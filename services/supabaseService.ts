import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from './logger';
import { exponentialBackoff } from '../src/utils/retry';
import { calculateHash } from '../src/utils/crypto';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: { url: string; key: string } | null = null;
  private syncStatus: { status: 'idle' | 'success' | 'error' | 'retrying'; isConnected: boolean; lastSuccessAt: number | null; lastErrorAt: number | null; retries: number; errorMessage?: string; hasCriticalError: boolean; criticalErrorMessage?: string } = { status: 'idle', isConnected: false, lastSuccessAt: null, lastErrorAt: null, retries: 0, hasCriticalError: false };
  private circuitBreaker: { open: boolean; failures: number; threshold: number; openedAt: number; cooldownMs: number; halfOpenProbe: boolean } = { open: false, failures: 0, threshold: 3, openedAt: 0, cooldownMs: 30000, halfOpenProbe: false };
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private realtimeHandlers: Map<string, (payload: any) => void> = new Map();

  async initialize(url: string, key: string, onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void) {
    if (this.client) {
      logger.info('Supabase client already initialized. Skipping re-initialization.', {}, 'SupabaseService');
      return;
    }
    if (!url || !key) return;
    try {
      this.client = createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
      });
      this.config = { url, key };
      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'idle';
      
      // Auth State Listener
      this.client.auth.onAuthStateChange((event, session) => {
          logger.info(`Auth state changed: ${event}`, { userId: session?.user?.id }, 'SupabaseService');
          if (event === 'SIGNED_OUT') {
              // Handle logout cleanup if needed
          }
          if (event === 'TOKEN_REFRESHED') {
              logger.info('Auth token refreshed successfully', {}, 'SupabaseService');
          }
      });

      logger.info('Supabase client initialized', {}, 'SupabaseService');
      if (onRealtimeChange) {
        this.realtimeHandlers.set('default', onRealtimeChange);
        await this.setupSubscriptions(onRealtimeChange);
      }
    } catch (error: any) {
      logger.error('Failed to initialize Supabase client', { error: error.message }, 'SupabaseService');
    }
  }

  private async setupSubscriptions(handler: (payload: any) => void) {
    const tables = [
      'menu_items', 
      'categories', 
      'orders', 
      'revenues', 
      'expenses', 
      'employees', 
      'attendance_records', 
      'payroll_records', 
      'dashboard_summary',
      'settings'
    ];

    await Promise.all(tables.map(table => this.subscribeToTableChanges(table, handler)));
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
      const { data, error } = await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not available during backoff');
        return this.client.from('settings').upsert({ id: 1, ...settings });
      }, 5, 1000, 'SupabaseService.syncSettings');

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
      }, 5, 1000, 'SupabaseService.fetchSettings');

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
    return calculateHash(data);
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
                  // We reject here to trigger the retry in exponentialBackoff
                  reject(new Error(`Subscription failed: ${status} - ${errMsg}`));
                }
              });
        });
    };

    try {
        await exponentialBackoff(subscribeAttempt, 5, 2000, `Subscribe:${tableName}`);
    } catch (error: any) {
        logger.error(`Failed to subscribe to ${tableName} after retries`, { error: error.message }, 'SupabaseService');
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

  async fetchCategoriesPaged({ page, pageSize }: { page: number; pageSize: number }) {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await this.client
        .from('categories')
        .select('*', { count: 'exact' })
        .range(from, to);
      if (error) throw error;
      return { success: true, data, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async fetchDishesPaged({ page, pageSize }: { page: number; pageSize: number }) {
    if (!this.client) return { success: false, error: 'Client not initialized' };
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await this.client
        .from('products')
        .select('*', { count: 'exact' })
        .range(from, to);
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
      const catRes = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('categories').select('*').order('sort_order');
           if (error) throw error;
           return data;
      }, 3, 1000, 'fetchMenu:categories');

      if (catRes.error) throw catRes.error;

      const dishRes = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('products').select('*');
           if (error) throw error;
           return data;
      }, 3, 1000, 'fetchMenu:products');

      if (dishRes.error) throw dishRes.error;

      this.syncStatus.status = 'success';
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.isConnected = true;

      return { 
          success: true, 
          data: { 
              categories: catRes.data, 
              dishes: dishRes.data 
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
      const { data, error } = await exponentialBackoff(async () => {
           const { data, error } = await this.client!.from('employees').select('*');
           if (error) throw error;
           return data;
      }, 3, 1000, 'fetchUsers');

      if (error) throw error;

      const users = data.map((user: any) => ({
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
