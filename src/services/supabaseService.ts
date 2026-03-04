import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { logger } from './logger';
import { exponentialBackoff } from '@/utils/retry';
import { calculateHash } from '@/utils/crypto';
import { env } from '@/utils/env';

export class SupabaseService {
  public client: SupabaseClient | null = null;
  private config: { url: string; key: string } | null = null;
  private syncStatus: { status: 'idle' | 'success' | 'error' | 'retrying'; isConnected: boolean; lastSuccessAt: number | null; lastErrorAt: number | null; retries: number; errorMessage?: string; hasCriticalError: boolean; criticalErrorMessage?: string } = { status: 'idle', isConnected: false, lastSuccessAt: null, lastErrorAt: null, retries: 0, hasCriticalError: false };
  private circuitBreaker: { open: boolean; failures: number; threshold: number; openedAt: number; cooldownMs: number; halfOpenProbe: boolean } = { open: false, failures: 0, threshold: 3, openedAt: 0, cooldownMs: 30000, halfOpenProbe: false };
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private realtimeHandlers: Map<string, (payload: any) => void> = new Map();
  private statusHandler: ((status: typeof this.syncStatus) => void) | null = null;

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA TASCA DO VEREDA
  // ========================================

  async getOrders() {
    if (!this.client) throw new Error('Client not initialized');
    return await this.client
      .from('orders')
      .select(`
        *,
        restaurant_tables:table_id (
          number,
          name,
          capacity
        ),
        employees:waiter_id (
          name,
          email
        ),
        order_items (
          *,
          dishes:product_id (
            name,
            price,
            image_url
          )
        )
      `)
      .order('created_at', { ascending: false });
  }

  async createOrder(orderData: any) {
    if (!this.client) throw new Error('Client not initialized');
    const orderNumber = `ORD-${Date.now()}`;
    
    const { data, error } = await this.client
      .from('orders')
      .insert({
        ...orderData,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOrder(id: string, updates: any) {
    if (!this.client) throw new Error('Client not initialized');
    const { data, error } = await this.client
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTables() {
    if (!this.client) throw new Error('Client not initialized');
    return await this.client
      .from('restaurant_tables')
      .select('id, number, name, seats, zone, shape, x, y, width, height, rotation, status, is_active, group_id, color, label, user_id, created_at, updated_at')
      .order('number');
  }

  async updateTableStatus(id: string, status: string) {
    if (!this.client) throw new Error('Client not initialized');
    const { data, error } = await this.client
      .from('restaurant_tables')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProducts() {
    if (!this.client) throw new Error('Client not initialized');
    return await this.client
      .from('dishes')
      .select(`
        *,
        menu_categories:category_id (
          name,
          color
        )
      `)
      .eq('is_active', true)
      .order('name');
  }

  async getFinancialMetrics() {
    if (!this.client) throw new Error('Client not initialized');
    const { data, error } = await this.client.rpc('calculate_realtime_metrics');
    
    if (error) throw error;
    return data;
  }

  // ========================================
  // MÉTODOS DE TEMPO REAL
  // ========================================

  subscribeToOrders(callback: (payload: any) => void) {
    if (!this.client) throw new Error('Client not initialized');
    
    const channel = this.client
      .channel('realtime-orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        callback
      )
      .subscribe();

    this.subscriptions.set('orders', channel);
    return channel;
  }

  subscribeToTables(callback: (payload: any) => void) {
    if (!this.client) throw new Error('Client not initialized');
    
    const channel = this.client
      .channel('realtime-tables')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_tables' },
        callback
      )
      .subscribe();

    this.subscriptions.set('tables', channel);
    return channel;
  }

  subscribeToProducts(callback: (payload: any) => void) {
    if (!this.client) throw new Error('Client not initialized');
    
    const channel = this.client
      .channel('realtime-products')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
        callback
      )
      .subscribe();

    this.subscriptions.set('products', channel);
    return channel;
  }

  subscribeToTransactions(callback: (payload: any) => void) {
    if (!this.client) throw new Error('Client not initialized');
    
    const channel = this.client
      .channel('realtime-transactions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        callback
      )
      .subscribe();

    this.subscriptions.set('transactions', channel);
    return channel;
  }

  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      if (this.client) {
        this.client.removeChannel(channel);
      }
    });
    this.subscriptions.clear();
  }

  async initialize(
    url?: string, 
    key?: string, 
    onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void,
    onStatusChange?: (status: typeof this.syncStatus) => void
  ) {
    if (this.client) {
      logger.info('Supabase client already initialized. Skipping re-initialization.', {}, 'SupabaseService');
      // If a new status handler is provided, update it even if already initialized
      if (onStatusChange) {
          this.statusHandler = onStatusChange;
          // Emit current status immediately
          this.statusHandler(this.syncStatus);
      }
      return;
    }
    
    if (onStatusChange) {
        this.statusHandler = onStatusChange;
    }
    
    // Initialize client: prefer provided url/key for dynamic cloud config
    const targetUrl = url || supabaseUrl;
    const targetKey = key || supabaseAnonKey;
    if (url && key) {
      this.client = createBrowserClient<any>(url, key, { auth: { persistSession: true } });
    } else {
      // Use the robust client from src/lib/supabase (env-based or mock)
      this.client = supabase;
    }
    
    // Track effective config for reconnects
    if (targetUrl && targetKey) {
        this.config = { url: targetUrl, key: targetKey };
    } else {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error('Supabase URL missing! Check NEXT_PUBLIC_SUPABASE_URL');
        logger.warn('Supabase URL/Key not found in env or arguments. Client might be in mock mode.', {}, 'SupabaseService');
    }

    try {
      // Fase 4: Global Connection Check with Exponential Backoff
      await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not initialized');
        
        // Simple connectivity check
        const { error } = await this.client.from('settings').select('count', { count: 'exact', head: true });
        if (error) throw error;
        
        return true;
      }, 3, 1000);

      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'idle';
      
      // Auth State Listener
      this.client.auth.onAuthStateChange((event, session) => {
          logger.info(`Auth state changed: ${event}`, { userId: session?.user?.id }, 'SupabaseService');
          
          // Removed automatic logout on SIGNED_OUT to support local auth mode
          // where Supabase is only used for DB access, not user sessions.
          
          if (event === 'TOKEN_REFRESHED') {
              logger.info('Auth token refreshed successfully', {}, 'SupabaseService');
          }
      });

      this.setupRealtimeConnectionListeners();

      logger.info('Supabase client initialized via src/lib/supabase', {}, 'SupabaseService');
      if (onRealtimeChange) {
        this.realtimeHandlers.set('default', onRealtimeChange);
        // Start subscriptions in background to not block initialization
        this.setupSubscriptions(onRealtimeChange).catch(err => {
            logger.error('Failed to setup subscriptions in background', { error: err.message }, 'SupabaseService');
        });
      }
    } catch (error: any) {
      logger.error('Failed to initialize Supabase client', { error: error.message }, 'SupabaseService');
    }
  }

  private updateStatus(updates: Partial<typeof this.syncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    if (this.statusHandler) {
        this.statusHandler(this.syncStatus);
    }
  }

  private setupRealtimeConnectionListeners() {
    if (!this.client) {
        logger.warn('Supabase client not initialized for realtime listeners.', {}, 'SupabaseService');
        return;
    }

    // Check if realtime connection methods are available (Supabase v2 compatibility)
    // Accessing internal socket/connection properties might be fragile
    const realtime = this.client.realtime as any;
    
    if (realtime && typeof realtime.onOpen === 'function') {
        realtime.onOpen(() => {
            logger.info('Supabase Realtime connection opened.', {}, 'SupabaseService');
            this.updateStatus({
                isConnected: true,
                status: 'success',
                lastSuccessAt: Date.now(),
                retries: 0,
                hasCriticalError: false,
                criticalErrorMessage: undefined
            });
            this.reconnect();
        });

        realtime.onClose(() => {
            logger.warn('Supabase Realtime connection closed. Attempting to reconnect...', {}, 'SupabaseService');
            this.updateStatus({
                isConnected: false,
                status: 'retrying',
                lastErrorAt: Date.now(),
                retries: this.syncStatus.retries + 1
            });
            setTimeout(() => this.reconnect(), 3000);
        });

        realtime.onError((event: any) => {
            logger.error('Supabase Realtime connection error.', { error: event.message || event }, 'SupabaseService');
            this.updateStatus({
                isConnected: false,
                status: 'error',
                lastErrorAt: Date.now(),
                errorMessage: event.message || 'Unknown Realtime error',
                retries: this.syncStatus.retries + 1
            });
            setTimeout(() => this.reconnect(), 3000);
        });
    } else {
        logger.info('Supabase Realtime connection listeners skipped (method not available).', {}, 'SupabaseService');
    }
  }

  private async setupSubscriptions(handler: (payload: any) => void) {
    const tables = [
      'dishes', 
      'menu_categories', 
      'orders', 
      'order_items',
      'audit_logs',
      'system_settings',
      'revenues', 
      'expenses', 
      'employees', 
      'attendance_records', 
      'payroll_records', 
      'settings'
    ];

    // Subscribe sequentially to avoid overwhelming the connection and causing TIMED_OUT errors
    for (const table of tables) {
        try {
            await this.subscribeToTableChanges(table, handler);
            // Small delay between subscriptions to ensure stability
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            logger.error(`Failed to setup subscription for ${table}`, { error }, 'SupabaseService');
        }
    }
  }

  async reconnect() {
      if (!this.config || !this.client) return;
      logger.info('Attempting to reconnect Supabase real-time subscriptions...', {}, 'SupabaseService');
      const handler = this.realtimeHandlers.get('default');
      if (handler) {
          await this.unsubscribeFromAllChanges();
          await this.setupSubscriptions(handler);
      }
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  isConnected(): boolean {
    return this.syncStatus.isConnected;
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  async syncSettings(settings: any): Promise<void> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot sync settings.', {}, 'SupabaseService');
      return;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt < this.circuitBreaker.cooldownMs)) {
      logger.warn('Circuit breaker is open. Skipping syncSettings.', {}, 'SupabaseService');
      return;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt >= this.circuitBreaker.cooldownMs)) {
      this.circuitBreaker.halfOpenProbe = true;
      logger.info('Circuit breaker in half-open state. Probing for recovery.', {}, 'SupabaseService');
    }

    try {
      logger.debug('Attempting to sync settings with payload:', { settings }, 'SupabaseService');
      const { data, error } = await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not available during backoff');
        return this.client.from('settings').upsert(settings);
      }, 5, 1000);

      if (error) {
        throw error;
      }

      logger.info('Settings synced to Supabase', { data }, 'SupabaseService');
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.retries = 0;
      this.syncStatus.status = 'success';
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.open = false;
      this.circuitBreaker.halfOpenProbe = false;
    } catch (error: any) {
      logger.error('Failed to sync settings to Supabase', { error: error.message }, 'SupabaseService');
      this.syncStatus.lastErrorAt = Date.now();
      this.syncStatus.status = 'error';
      this.syncStatus.retries++;
      this.circuitBreaker.failures++;

      if (this.circuitBreaker.halfOpenProbe && error) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        this.circuitBreaker.halfOpenProbe = false;
        logger.warn('Half-open probe failed. Circuit breaker opened.', {}, 'SupabaseService');
      } else if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        logger.warn('Circuit breaker opened due to too many failures.', {}, 'SupabaseService');
      }
      throw error;
    }
  }

  async fetchSettings(): Promise<any | null> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot fetch settings.', {}, 'SupabaseService');
      return null;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt < this.circuitBreaker.cooldownMs)) {
      logger.warn('Circuit breaker is open. Skipping fetchSettings.', {}, 'SupabaseService');
      return null;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt >= this.circuitBreaker.cooldownMs)) {
      this.circuitBreaker.halfOpenProbe = true;
      logger.info('Circuit breaker in half-open state. Probing for recovery.', {}, 'SupabaseService');
    }

    try {
      const { data, error } = await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not available during backoff');
        return this.client.from('settings').select('*').single();
      }, 5, 1000);

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error for initial fetch
        throw error;
      }

      logger.info('Settings fetched from Supabase', { data }, 'SupabaseService');
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.retries = 0;
      this.syncStatus.status = 'success';
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.open = false;
      this.circuitBreaker.halfOpenProbe = false;
      return data;
    } catch (error: any) {
      logger.error('Failed to fetch settings from Supabase', { error: error.message }, 'SupabaseService');
      this.syncStatus.lastErrorAt = Date.now();
      this.syncStatus.status = 'error';
      this.syncStatus.retries++;
      this.circuitBreaker.failures++;

      if (this.circuitBreaker.halfOpenProbe && error) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        this.circuitBreaker.halfOpenProbe = false;
        logger.warn('Half-open probe failed. Circuit breaker opened.', {}, 'SupabaseService');
      } else if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        logger.warn('Circuit breaker opened due to too many failures.', {}, 'SupabaseService');
      }
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot verify PIN.', {}, 'SupabaseService');
      return false;
    }
    try {
      const { data, error } = await this.client.from('settings').select('adminPin').single();
      if (error) {
        logger.error('Error fetching admin PIN from Supabase', { error: error.message }, 'SupabaseService');
        return false;
      }
      return data?.adminPin === pin;
    } catch (error: any) {
      logger.error('Failed to verify PIN with Supabase', { error: error.message }, 'SupabaseService');
      return false;
    }
  }

  async calculateHash(data: string): Promise<string> {
    return await calculateHash(data);
  }

  async subscribeToTableChanges(tableName: string, handler: (payload: any) => void, eventType: '*' | 'INSERT' | 'UPDATE' | 'DELETE' = '*'): Promise<void> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot subscribe to table changes.', { tableName }, 'SupabaseService');
      return;
    }
    
    if (this.subscriptions.has(tableName)) {
      logger.info(`Already subscribed to ${tableName}. Re-subscribing.`, {}, 'SupabaseService');
      await this.removeRealtimeHandler(tableName);
    }

    const subscribeAttempt = async () => {
        return new Promise<void>((resolve, reject) => {
            if (!this.client) {
                return reject(new Error('Client not initialized'));
            }
            
            // Use a simpler channel name to avoid potential conflicts
            const channel = this.client
              .channel(`public:${tableName}`)
              .on('postgres_changes', { event: eventType, schema: 'public', table: tableName }, (payload) => {
                logger.info(`Realtime change detected for ${tableName}`, { payload }, 'SupabaseService');
                // Wrap handler to prevent it from crashing the listener
                try {
                    handler({ ...payload, tableName });
                } catch (hErr) {
                    logger.error(`Error in realtime handler for ${tableName}`, hErr, 'SupabaseService');
                }
              })
              .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                  logger.info(`Subscribed to ${tableName} changes`, {}, 'SupabaseService');
                  this.subscriptions.set(tableName, channel);
                  this.realtimeHandlers.set(tableName, handler);
                  resolve();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                  const errMsg = err ? err.message : status;
                  logger.error(`Error subscribing to ${tableName} changes: ${status}`, { error: errMsg }, 'SupabaseService');
                  
                  // Clean up channel on error to avoid lingering bad state
                  channel.unsubscribe().catch(() => {});
                  
                  // We reject here to trigger the retry in exponentialBackoff
                  reject(new Error(`Subscription failed: ${status} - ${errMsg}`));
                } else if (status === 'CLOSED') {
                   // Graceful close, usually intentionally called
                   logger.info(`Channel for ${tableName} closed`, {}, 'SupabaseService');
                }
              });
        });
    };

    // Retry configuration: 5 attempts with exponential backoff (starting at 2s)
    try {
        await exponentialBackoff(subscribeAttempt, 5, 2000);
    } catch (error: any) {
        logger.error(`Failed to subscribe to ${tableName} after retries`, { error: error.message }, 'SupabaseService');
        // Do not throw here to prevent blocking other subscriptions
    }
  }

  async removeRealtimeHandler(tableName: string): Promise<void> {
    const channel = this.subscriptions.get(tableName);
    if (channel) {
      await channel.unsubscribe();
      this.subscriptions.delete(tableName);
      this.realtimeHandlers.delete(tableName);
      logger.info(`Unsubscribed from ${tableName} changes`, {}, 'SupabaseService');
    }
  }

  async unsubscribeFromAllChanges(): Promise<void> {
    const promises: Promise<void>[] = [];
    this.subscriptions.forEach((channel, tableName) => {
      promises.push(channel.unsubscribe().then(() => {
          logger.info(`Unsubscribed from ${tableName} changes`, {}, 'SupabaseService');
      }));
    });
    await Promise.all(promises);
    this.subscriptions.clear();
    this.realtimeHandlers.clear();
  }

  async fetchCategoriesPaged({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = this.client
        .from('menu_categories')
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { success: true, data, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async fetchProductsPaged({ page, pageSize, search, categoryId }: { page: number; pageSize: number; search?: string; categoryId?: string }) {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = this.client
        .from('dishes')
        .select('*', { count: 'exact' })
        .range(from, to);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      const mappedData = data.map((item: any) => ({
          ...item,
          taxCode: item.tax_code || item.taxCode || 'NOR'
      }));

      return { success: true, data: mappedData, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async fetchMenu() {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const categories = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('menu_categories').select('*').order('sort_order');
           if (error) throw error;
           return data;
      }, 3, 1000);

      const products = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('dishes').select('*');
           if (error) throw error;
           return data;
      }, 3, 1000);

      this.syncStatus.status = 'success';
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.isConnected = true;

      return { 
          success: true, 
          data: { 
              categories: categories, 
              products: products 
          } 
      };
    } catch (error: any) {
        this.syncStatus.status = 'error';
        this.syncStatus.lastErrorAt = Date.now();
        return { success: false, error: error.message };
    }
  }

  async fetchUsers() {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const usersData = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('employees').select('*');
           if (error) throw error;
           return data;
      }, 3, 1000);

      const users = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          pin: user.pin_code || user.pin, // Handle mapping
          role: user.role,
          isActive: user.active,
          permissions: user.permissions || [],
          createdAt: user.created_at ? new Date(user.created_at) : new Date(),
          updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
      }));

      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDailyAnalytics(date: string) {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const { data, error } = await this.client
        .from('daily_analytics')
        .select('*')
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return { success: true, data: null };

      return { 
        success: true, 
        data: {
          date: data.date,
          totalRevenue: Number(data.total_revenue || 0),
          totalExpenses: Number(data.total_expenses || 0),
          totalProductCost: Number(data.total_product_cost || 0),
          totalOrders: Number(data.total_orders || 0),
          netProfit: Number(data.net_profit || 0),
          lastUpdated: data.last_updated || data.updated_at || new Date().toISOString()
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const supabaseService = new SupabaseService();
