import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';
import { SystemSettings, Dish, MenuCategory, Order, DashboardSummary, StockItem, Fornecedor, User, AuditLog, Revenue, Expense, Settings, Employee, AttendanceRecord, PayrollRecord, CashShift, Table } from '../types';
import { logger, LogEntry } from './logger';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  hash: string;
  size: number;
  status: string;
  type: string;
  [key: string]: unknown;
}

export type UploadSuccess = { success: true; path: string | null; publicUrl: string };
export type UploadFailure = { success: false; error: string };
export type UploadResult = UploadSuccess | UploadFailure;

export type SupabaseResponseSuccess<T> = { success: true; data: T | null };
export type SupabaseResponseFailure = { success: false; error: string };
export type SupabaseResponse<T> = SupabaseResponseSuccess<T> | SupabaseResponseFailure;

interface SupabaseCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  parent_id?: string;
  deleted_at?: string | null;
}

interface SupabaseDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  image_url?: string;
  available: boolean;
  tax_rate: number;
}

interface SupabaseSettings {
  id: string;
  name: string;
  logo_url?: string;
  currency: string;
  phone?: string;
  address?: string;
  wifi_name?: string;
  wifi_password?: string;
  qr_code_title?: string;
  qr_code_subtitle?: string;
  qr_code_short_code?: string;
  qr_menu_url?: string;
  qr_menu_cloud_url?: string;
}

interface SupabaseUser {
  id: string;
  name: string;
  role: string;
  pin: string;
  active: boolean;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: { url: string; key: string } | null = null;
  private syncStatus: { status: 'idle' | 'success' | 'error' | 'retrying'; isConnected: boolean; lastSuccessAt: number | null; lastErrorAt: number | null; retries: number; errorMessage?: string } = { status: 'idle', isConnected: false, lastSuccessAt: null, lastErrorAt: null, retries: 0 };
  private circuitBreaker: { open: boolean; failures: number; threshold: number; openedAt: number; cooldownMs: number; halfOpenProbe: boolean } = { open: false, failures: 0, threshold: 3, openedAt: 0, cooldownMs: 30000, halfOpenProbe: false };
  private metrics: { totalCalls: number; totalErrors: number; latencies: number[]; lastLatencyMs: number } = { totalCalls: 0, totalErrors: 0, latencies: [], lastLatencyMs: 0 };

  private isClientSide(): boolean {
    return typeof window !== 'undefined';
  }

  private isPublishableKey(): boolean {
    const key = this.config?.key || '';
    return /^sb_/i.test(key) || /publishable/i.test(key);
  }

  private canWriteToProtectedTables(): boolean {
    // Avoid writes from client-side with publishable/anon keys (RLS will block)
    return !this.isClientSide() || !this.isPublishableKey();
  }

  initialize(url: string, key: string, onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void) {
    if (!url || !key) return;
    try {
      this.client = createClient(url, key);
      this.config = { url, key };
      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'idle';
      logger.info('Supabase client initialized', {}, 'SupabaseService');

      const isTestEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test');
      if (onRealtimeChange && !isTestEnv) {
        // Subscribe to menu_items changes
        this.subscribeToTableChanges('menu_items', (payload) => onRealtimeChange({ ...payload, tableName: 'menu_items' }));
        // Subscribe to categories changes
        this.subscribeToTableChanges('categories', (payload) => onRealtimeChange({ ...payload, tableName: 'categories' }));
        // Subscribe to employees changes
        this.subscribeToTableChanges('employees', (payload) => onRealtimeChange({ ...payload, tableName: 'employees' }));
        // Subscribe to attendance_records changes
          this.subscribeToTableChanges('attendance_records', (payload) => onRealtimeChange({ ...payload, tableName: 'attendance_records' }));
          // Subscribe to payroll_records changes
        this.subscribeToTableChanges('payroll_records', (payload) => onRealtimeChange({ ...payload, tableName: 'payroll_records' }));
        // Subscribe to revenues changes
        this.subscribeToTableChanges('revenues', (payload) => onRealtimeChange({ ...payload, tableName: 'revenues' }));
        // Subscribe to expenses changes
        this.subscribeToTableChanges('expenses', (payload) => onRealtimeChange({ ...payload, tableName: 'expenses' }));
        // Subscribe to dashboard_summary changes
        this.subscribeToTableChanges('dashboard_summary', (payload) => onRealtimeChange({ ...payload, tableName: 'dashboard_summary' }));
        // Add other tables as needed for real-time sync
      }
    } catch (error) {
      logger.error('Failed to initialize Supabase client', error, 'SupabaseService');
    }
  }

  isConnected(): boolean {
    return !!this.client;
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  private async delay(ms: number) {
    const t = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ? Math.min(ms, 1) : ms;
    return new Promise(resolve => setTimeout(resolve, t));
  }

  private async retryWithBackoff<T>(operation: () => Promise<T>, retries: number = 3, baseDelay: number = 800, label: string = 'operation'): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        this.syncStatus.status = attempt > 0 ? 'retrying' : this.syncStatus.status;
        const result = await operation();
        this.syncStatus.status = 'success';
        this.syncStatus.lastSuccessAt = Date.now();
        this.syncStatus.retries = attempt;
        this.syncStatus.errorMessage = undefined;
        return result;
      } catch (error: unknown) {
        const errMsg = (error as any)?.message ? String((error as any).message) : String(error);
        this.syncStatus.status = 'error';
        this.syncStatus.lastErrorAt = Date.now();
        this.syncStatus.errorMessage = errMsg;
        logger.error(`${label} attempt failed`, { attempt, error: errMsg }, 'SupabaseService');
        if (attempt >= retries) {
          throw error;
        }
        attempt++;
        this.syncStatus.retries = attempt;
        const jitter = Math.floor(Math.random() * 200);
        const waitMs = baseDelay * Math.pow(2, attempt - 1) + jitter;
        await this.delay(waitMs);
      }
    }
  }

  private async callWithResilience<T>(operation: () => Promise<T>, label: string): Promise<T> {
    if (this.circuitBreaker.open) {
      const elapsed = Date.now() - this.circuitBreaker.openedAt;
      if (elapsed < this.circuitBreaker.cooldownMs) {
        throw new Error('Circuit breaker open');
      }
      this.circuitBreaker.halfOpenProbe = true;
    }
    const start = Date.now();
    try {
      const result = await this.retryWithBackoff(operation, 3, 800, label);
      const latency = Date.now() - start;
      this.metrics.totalCalls++;
      this.metrics.lastLatencyMs = latency;
      this.metrics.latencies.push(latency);
      if (this.circuitBreaker.halfOpenProbe) {
        this.circuitBreaker.open = false;
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.halfOpenProbe = false;
      }
      return result;
    } catch (error) {
      this.metrics.totalCalls++;
      this.metrics.totalErrors++;
      this.circuitBreaker.failures++;
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        this.circuitBreaker.halfOpenProbe = false;
      }
      throw error as unknown as Error;
    }
  }

  getHealthMetrics() {
    const total = this.metrics.totalCalls || 1;
    const errorRate = this.metrics.totalErrors / total;
    const avgLatency = this.metrics.latencies.length > 0 ? Math.round(this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length) : 0;
    const throughput = total;
    return { latencyMs: this.metrics.lastLatencyMs, avgLatencyMs: avgLatency, throughputPerSession: throughput, errorRate };
  }
  private _handleSupabaseResponse<T>(
    response: { data: T | null; error: { message: string; code?: string; details?: string; hint?: string } | null },
    operationName: string,
    context: string
  ): SupabaseResponse<T> {
    if (response.error) {
      const errorMessage = response.error.message || `Unknown error during ${operationName}`;
      logger.error(
        `${operationName} failed`,
        {
          message: errorMessage,
          code: response.error.code,
          details: response.error.details,
          hint: response.error.hint,
        },
        context
      );
      return { success: false, error: errorMessage };
    }
    logger.info(`${operationName} successful`, {}, context);
    return { success: true, data: response.data };
  }

  async testConnection(url: string, key: string): Promise<SupabaseResponse<null>> {
    try {
      const tempClient = createClient(url, key);
      const { error } = await tempClient
        .from('categories')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is fine
        if (error.message.includes('relation "categories" does not exist')) {
          logger.info('Supabase connection valid (but tables missing)', {}, 'SupabaseService');
          return { success: true, data: null };
        }
        return this._handleSupabaseResponse({ data: null, error }, 'Supabase connection test', 'SupabaseService');
      }
      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'success';
      this.syncStatus.lastSuccessAt = Date.now();
      return { success: true, data: null };
    } catch (error: unknown) {
      logger.error('Supabase connection test failed', error, 'SupabaseService');
      this.syncStatus.isConnected = false;
      this.syncStatus.status = 'error';
      this.syncStatus.lastErrorAt = Date.now();
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  // --- Sync Methods (Push to Cloud) ---

  async syncMenu(categories: MenuCategory[], dishes: Dish[], settings: SystemSettings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    try {
      const catsPayload = categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        sort_order: c.sortOrder || (c as any).sort_order || 0,
        parent_id: (c as any).parentId || (c as any).parent_id || null,
        deleted_at: (c as any).deletedAt || null
      }));
      const dishesPayload = dishes.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        price: d.price,
        category_id: d.categoryId,
        image_url: (d as any).image,
        available: d.disponivel !== false,
        tax_rate: d.taxPercentage || 14
      }));
      const settingsPayload = {
        name: settings.restaurantName,
        logo_url: (settings as any).qrMenuLogo || (settings as any).logoUrl,
        currency: settings.currency,
        phone: settings.phone,
        address: settings.address,
        qr_menu_cloud_url: settings.qrMenuCloudUrl
      };

      // Try direct upsert first (fast path)
      const catResponse = await this.client
        .from('categories')
        .upsert(catsPayload, { onConflict: 'id' });
      const catErr = (catResponse as any)?.error?.message || '';

      const dishResponse = await this.client
        .from('menu_items')
        .upsert(dishesPayload, { onConflict: 'id' });
      const dishErr = (dishResponse as any)?.error?.message || '';

      let needRpc = false;
      if ((catErr && /row-level security/i.test(catErr)) || (dishErr && /row-level security/i.test(dishErr))) {
        needRpc = true;
        logger.warn('RLS blocked direct upsert; falling back to RPC sync_menu', { catErr, dishErr }, 'SupabaseService');
      }

      // Sync settings via normal path (will also fallback to base columns)
      const settingsResult = await this.syncSettings(settings);
      if (!settingsResult.success) {
        needRpc = true;
      }

      if (needRpc) {
        const token = settings.apiToken || '';
        const { error: rpcError } = await (this.client as any).rpc('sync_menu', {
          categories: catsPayload,
          items: dishesPayload,
          settings: settingsPayload,
          token
        });
        if (rpcError) {
          const errMsg = rpcError.message || 'RPC sync_menu failed';
          logger.error('RPC sync_menu error', { error: errMsg }, 'SupabaseService');
          return { success: false, error: errMsg };
        }
        logger.info('Menu synced successfully via RPC', {}, 'SupabaseService');
        return { success: true, data: null };
      }

      const catResult = this._handleSupabaseResponse(catResponse, 'Supabase sync categories', 'SupabaseService');
      if (!catResult.success) return catResult;
      const dishResult = this._handleSupabaseResponse(dishResponse, 'Supabase sync dishes', 'SupabaseService');
      if (!dishResult.success) return dishResult;
      if (!settingsResult.success) return settingsResult;

      logger.info('Menu synced successfully (direct upsert)', {}, 'SupabaseService');
      return { success: true, data: null };
    } catch (error: unknown) {
      logger.error('Menu sync failed', error, 'SupabaseService');
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async syncSettings(settings: SystemSettings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    
    let response = await this.client
      .from('restaurant_settings')
      .upsert({
        id: '1', // Singleton
        name: settings.restaurantName,
        logo_url: settings.qrMenuLogo || settings.logoUrl,
        currency: settings.currency,
        phone: settings.phone,
        address: settings.address,
        wifi_name: settings.wifiName,
        wifi_password: settings.wifiPassword,
        // QR Menu Fields
        qr_code_title: settings.qrMenuTitle,
        qr_code_subtitle: settings.qrMenuSubtitle,
        qr_code_short_code: settings.qrMenuShortCode,
        qr_menu_url: settings.qrMenuUrl,
        qr_menu_cloud_url: settings.qrMenuCloudUrl
      });

    // Handle missing columns scenario
    if (response.error && response.error.message.includes('column') && response.error.message.includes('does not exist')) {
      logger.warn('Supabase schema missing columns for settings sync, retrying with base columns', {}, 'SupabaseService');
      response = await this.client
        .from('restaurant_settings')
        .upsert({
          id: '1',
          name: settings.restaurantName,
          logo_url: settings.qrMenuLogo || settings.logoUrl,
          currency: settings.currency,
          phone: settings.phone,
          address: settings.address
        });
    }

    return this._handleSupabaseResponse(response, 'Supabase sync settings', 'SupabaseService');
  }

  async setupBuckets(): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const menuBucketResponse = await this.client.storage.createBucket('menu-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    const backupBucketResponse = await this.client.storage.createBucket('backups', {
      public: false, // Backups should not be public
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/json', 'application/sql']
    });

    // Only log errors if they are not "bucket already exists"
    if (menuBucketResponse.error && !menuBucketResponse.error.message.includes('already exists')) {
      this._handleSupabaseResponse({ data: null, error: menuBucketResponse.error }, 'Supabase create menu-images bucket', 'SupabaseService');
      return { success: false, error: menuBucketResponse.error.message };
    }
    if (backupBucketResponse.error && !backupBucketResponse.error.message.includes('already exists')) {
      this._handleSupabaseResponse({ data: null, error: backupBucketResponse.error }, 'Supabase create backups bucket', 'SupabaseService');
      return { success: false, error: backupBucketResponse.error.message };
    }

    logger.info('Buckets configured successfully.', {}, 'SupabaseService');
    return { success: true, data: null };
  }

  async setupRLS(): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    // RLS usually requires SQL execution which is restricted for anon keys.
    // We will check if tables exist and are queryable, implying RLS allows it or is open.
    const response = await this.client.from('restaurant_settings').select('id').limit(1);
    const result = this._handleSupabaseResponse({ data: response.data, error: response.error }, 'Supabase RLS setup check', 'SupabaseService');
    if (result.success) {
      logger.info('Conexão validada. RLS deve ser configurado via Migrations SQL.', {}, 'SupabaseService');
    }
    return result as SupabaseResponse<null>;
  }

  // --- Storage Methods ---

  async uploadFile(bucket: 'menu-images' | 'backups', path: string, file: File | Blob | ArrayBuffer): Promise<UploadResult> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: bucket === 'menu-images' ? 'image/png' : 'application/octet-stream'
      });

    if (error) {
      const errorMessage = error.message || `Unknown error during upload to ${bucket}`;
      logger.error(`Upload to ${bucket} failed`, { message: errorMessage, details: error.message }, 'SupabaseService');
      return { success: false, error: errorMessage };
    }

    // Get public URL for menu-images
    let publicUrl = '';
    if (bucket === 'menu-images') {
      const { data: urlData } = this.client.storage.from(bucket).getPublicUrl(path);
      publicUrl = urlData?.publicUrl || '';
    }

    logger.info(`Upload to ${bucket} successful`, { path: data?.path, publicUrl }, 'SupabaseService');
    return { success: true, path: data?.path || null, publicUrl };
  }

  async listFiles(bucket: 'menu-images' | 'backups', path: string = ''): Promise<SupabaseResponse<FileObject[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { data, error } = await this.client.storage
      .from(bucket)
      .list(path);

    return this._handleSupabaseResponse(
      { data: data as FileObject[] | null, error },
      `Supabase list files in ${bucket}`,
      'SupabaseService'
    );
  }

  async deleteFile(bucket: 'menu-images' | 'backups', path: string): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);

    return this._handleSupabaseResponse({ data: null, error }, `Supabase delete from ${bucket}`, 'SupabaseService');
  }

  async syncDashboardData(summary: DashboardSummary, activeOrders: Order[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    // 1. Sync Dashboard Summary
    const summaryResponse = await this.client
      .from('dashboard_summary')
      .upsert({
          id: '1',
          total_revenue: summary.totalRevenue,
          total_orders: summary.totalOrders,
          active_orders_count: activeOrders.length,
          last_updated: new Date().toISOString()
      });

    const summaryResult = this._handleSupabaseResponse({ data: null, error: summaryResponse.error }, 'Supabase sync dashboard summary', 'SupabaseService');
    if (!summaryResult.success) return summaryResult;
      
    // 2. Sync Active Orders (Simplified for mobile view)
    const simplifiedOrders = activeOrders.map(o => ({
        id: o.id,
        table_id: o.tableId,
        status: o.status,
        total: o.total,
        items_count: o.items.length,
        created_at: o.timestamp
    }));
    
    const ordersResponse = await this.client
      .from('active_orders_snapshot')
      .upsert(simplifiedOrders); 

    const ordersResult = this._handleSupabaseResponse({ data: null, error: ordersResponse.error }, 'Supabase sync active orders snapshot', 'SupabaseService');
    if (!ordersResult.success) return ordersResult;

    return { success: true, data: null };
  }

  async syncUsers(users: User[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { error } = await this.client.from('users').upsert(users.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        pin: u.pin
    })), { onConflict: 'id' });
    
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync users', 'SupabaseService');
  }

  async syncAuditLogs(logs: (AuditLog | LogEntry)[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    if (!this.canWriteToProtectedTables()) {
      logger.info('Skipping audit log sync on client (publishable key / RLS)', {}, 'SupabaseService');
      return { success: true, data: null };
    }

    // Explicitly map only existing columns to avoid schema cache errors
    const sanitizedLogs = logs.map(l => {
        const baseLog = {
            timestamp: l.timestamp,
            details: 'data' in l ? (l.data ? JSON.stringify(l.data) : null) : ('details' in l ? JSON.stringify(l.details) : null)
        };

        if ('level' in l) {
            // It's a LogEntry
            return {
                ...baseLog,
                level: l.level.toUpperCase(),
                message: l.message,
                context: l.context || 'GENERAL'
            };
        } else {
            // It's an AuditLog
            return {
                ...baseLog,
                level: 'INFO',
                message: l.action,
                context: l.entityType || 'AUDIT'
            };
        }
    });

    const { error } = await this.client.from('audit_logs').insert(sanitizedLogs);
    
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync audit logs', 'SupabaseService');
  }

  async syncStock(stock: StockItem[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { error } = await this.client.from('stock_items').upsert(stock.map(s => ({
        id: s.id,
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        min_threshold: s.minThreshold
    })), { onConflict: 'id' });
    
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync stock', 'SupabaseService');
  }

  async syncSuppliers(suppliers: Fornecedor[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { error } = await this.client.from('suppliers').upsert(suppliers.map(s => ({
        id: s.id,
        nome: s.nome,
        nif: s.nif,
        telefone: s.telefone,
        email: s.email,
        endereco: s.endereco,
        ativo: s.ativo,
        categoria: s.categoria
    })), { onConflict: 'id' });
    
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync suppliers', 'SupabaseService');
  }

  async syncFinancials(revenues: Revenue[], expenses: Expense[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    // Sync Revenues
    if (revenues.length > 0) {
        const { error: revError } = await this.client.from('revenues').upsert(revenues.map(r => ({
            id: r.id,
            amount: r.amount,
            date: r.date,
            category: r.category,
            description: r.description,
            payment_method: r.source
        })));
        const revResult = this._handleSupabaseResponse({ data: null, error: revError }, 'Supabase sync revenues', 'SupabaseService');
        if (!revResult.success) return revResult;
    }

    // Sync Expenses
    if (expenses.length > 0) {
        const { error: expError } = await this.client.from('expenses').upsert(expenses.map(e => ({
            id: e.id,
            amount: e.amount,
            date: e.date,
            category: e.category,
            description: e.description,
            status: 'PAID'
        })));
        const expResult = this._handleSupabaseResponse({ data: null, error: expError }, 'Supabase sync expenses', 'SupabaseService');
        if (!expResult.success) return expResult;
    }

    return { success: true, data: null };
  }

  async syncEmployees(employees: Employee[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { error } = await this.client.from('employees').upsert(employees.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role,
        phone: e.phone,
        salary: e.salary,
        status: e.status || (e.active ? 'ATIVO' : 'INATIVO'),
        color: e.color,
        work_days_per_month: e.workDaysPerMonth,
        daily_work_hours: e.dailyWorkHours,
        external_bio_id: e.externalBioId,
        bi: e.bi,
        nif: e.nif
    })), { onConflict: 'id' });
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync employees', 'SupabaseService');
  }

  async syncAttendance(records: AttendanceRecord[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { error } = await this.client.from('attendance_records').upsert(records.map(r => ({
        id: r.id,
        employee_id: r.employeeId,
        date: r.date,
        clock_in: r.clockIn,
        clock_out: r.clockOut,
        total_hours: r.totalHours,
        is_late: r.isLate,
        late_minutes: r.lateMinutes,
        overtime_hours: r.overtimeHours,
        is_absence: r.isAbsence,
        status: r.status,
        justification: r.justification,
        source: r.source
    })), { onConflict: 'id' });
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync attendance', 'SupabaseService');
  }

  async syncPayroll(records: PayrollRecord[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { error } = await this.client.from('payroll_records').upsert(records.map(r => ({
        id: r.id,
        employee_id: r.employeeId,
        amount: r.grossSalary || r.baseSalary,
        date: r.paymentDate,
        month: r.month,
        year: r.year,
        status: r.status,
        net_salary: r.netSalary,
        base_salary: r.baseSalary,
        notes: r.notes
    })), { onConflict: 'id' });
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync payroll', 'SupabaseService');
  }

  async syncShifts(shifts: CashShift[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { error } = await this.client.from('cash_shifts').upsert(shifts.map(s => ({
        id: s.id,
        user_id: s.userId,
        user_name: s.userName,
        start_time: s.startTime,
        end_time: s.endTime,
        opening_balance: s.openingBalance,
        closing_balance: s.closingBalance,
        expected_balance: s.expectedBalance,
        status: s.status
    })), { onConflict: 'id' });
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync shifts', 'SupabaseService');
  }

  async syncTables(tables: Table[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { error } = await this.client.from('restaurant_tables').upsert(tables.map(t => ({
        id: t.id,
        name: t.name,
        seats: t.seats,
        status: t.status,
        current_order_id: t.currentOrderId,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        zone: t.zone,
        shape: t.shape,
        rotation: t.rotation,
        groupId: t.groupId,
        label: t.label,
        color: t.color,
        userId: t.userId
    })), { onConflict: 'id' });
    return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync tables', 'SupabaseService');
  }

  async syncBackup(backupMetadata: BackupMetadata, backupData: unknown): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    // 1. Upload the actual data to the 'backups' bucket
    const backupFileName = `${backupMetadata.id}.json`;
    const dataToUpload = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);
    
    const { error: uploadError } = await this.client.storage
        .from('backups')
        .upload(backupFileName, dataToUpload, {
            contentType: 'application/json',
            upsert: true
        });

    const uploadResult = this._handleSupabaseResponse({ data: null, error: uploadError }, 'Supabase backup data upload', 'SupabaseService');
    if (!uploadResult.success) {
        logger.warn('Failed to upload backup data to bucket, but proceeding with metadata', { error: (uploadResult as SupabaseResponseFailure).error }, 'SupabaseService');
    }

    // 2. Upsert metadata to the 'backups' table
    const { error: metaError } = await this.client.from('backups').upsert({
        id: backupMetadata.id,
        timestamp: backupMetadata.timestamp,
        hash: backupMetadata.hash,
        size: backupMetadata.size,
        status: backupMetadata.status,
        type: backupMetadata.type,
        metadata: {
            ...backupMetadata,
            storage_path: uploadError ? null : backupFileName
        }
    });

    return this._handleSupabaseResponse({ data: null, error: metaError }, 'Supabase backup metadata sync', 'SupabaseService');
  }
  
  // --- Fetch Methods (Pull from Cloud - for Remote Clients) ---
  
  private async fetchWithTimeout<T>(promise: Promise<{ data: T | null; error: unknown }>, timeoutMs: number = 15000): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await promise;
      clearTimeout(timeoutId);
      if (result.error) throw result.error;
      return result.data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const err = error as Error;
      if (err.name === 'AbortError') {
        logger.warn('Supabase request timed out', { timeoutMs }, 'SupabaseService');
      }
      throw error;
    }
  }

  async fetchMenu(): Promise<SupabaseResponse<{ categories: MenuCategory[]; dishes: Dish[]; settings: SystemSettings }>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    
    const execute = async () => {
      try {
        const categoriesPromisePrimary = this.client!.from('categories').select('*').order('name');
        const dishesPromisePrimary = this.client!.from('menu_items').select('*').eq('available', true);
        const settingsPromise = this.client!.from('restaurant_settings').select('*').maybeSingle();
        
        let categories: SupabaseCategory[] | null = null;
        try {
          categories = await this.fetchWithTimeout<SupabaseCategory[]>(categoriesPromisePrimary as unknown as Promise<{ data: SupabaseCategory[] | null; error: unknown }>);
        } catch (err: unknown) {
          try {
            const categoriesPromiseNoOrder = this.client!.from('categories').select('*');
            categories = await this.fetchWithTimeout<SupabaseCategory[]>(categoriesPromiseNoOrder as unknown as Promise<{ data: SupabaseCategory[] | null; error: unknown }>);
            logger.warn('Supabase: categories order failed; fell back to no ordering', {}, 'SupabaseService');
          } catch (finalErr: unknown) {
            logger.warn('Supabase: categories not accessible; continuing without categories', {}, 'SupabaseService');
            categories = [];
          }
        }
        let dishes: SupabaseDish[] | null = null;
        try {
          dishes = await this.fetchWithTimeout<SupabaseDish[]>(dishesPromisePrimary as unknown as Promise<{ data: SupabaseDish[] | null; error: unknown }>);
        } catch (err: unknown) {
          try {
            const dishesPromiseNoFilter = this.client!.from('menu_items').select('*');
            dishes = await this.fetchWithTimeout<SupabaseDish[]>(dishesPromiseNoFilter as unknown as Promise<{ data: SupabaseDish[] | null; error: unknown }>);
            logger.warn('Supabase: menu_items available filter failed; fell back to unfiltered query', {}, 'SupabaseService');
          } catch (fallbackErr: unknown) {
            try {
              const dishesPromiseFallback = this.client!.from('menu').select('*');
              dishes = await this.fetchWithTimeout<SupabaseDish[]>(dishesPromiseFallback as unknown as Promise<{ data: SupabaseDish[] | null; error: unknown }>);
              logger.warn('Supabase: menu_items query failed; fell back to table public.menu', {}, 'SupabaseService');
            } catch (finalErr: unknown) {
              logger.warn('Supabase: dishes not accessible; continuing without dishes', {}, 'SupabaseService');
              dishes = [];
            }
          }
        }
        let settings: SupabaseSettings | null = null;
        try {
          settings = await this.fetchWithTimeout<SupabaseSettings>(settingsPromise as unknown as Promise<{ data: SupabaseSettings | null; error: unknown }>);
        } catch (e: unknown) {
          logger.warn('Restaurant settings not accessible; continuing without header info', {}, 'SupabaseService');
          settings = null;
        }

        const mappedCategories = (categories || []).map((c: SupabaseCategory) => {
          const raw = c as unknown as Record<string, unknown>;
          const rawId = String(raw.id || raw['uuid'] || '');
          const rawName = String(raw.name || raw['nome'] || '');
          const rawSort = typeof raw['sort_order'] === 'number' ? raw['sort_order'] : Number(raw['order'] || 0);
          return {
            id: rawId || `cat_${Math.random().toString(36).slice(2)}`,
            name: rawName || 'SEM_NOME',
            icon: raw['icon'] as string | undefined,
            sort_order: Number.isFinite(rawSort) ? Number(rawSort) : 0,
            parentId: (raw['parent_id'] || raw['parentId']) as string | undefined,
            is_active: !raw['deleted_at']
          };
        });
        const mappedDishes = (dishes || []).map((d: SupabaseDish) => {
          const raw = d as unknown as Record<string, unknown>;
          const rawAvailable = typeof raw['available'] === 'boolean' ? raw['available'] : raw['disponivel'] ?? raw['is_active'];
          return {
            id: String(raw['id'] || raw['uuid'] || '') || `dish_${Math.random().toString(36).slice(2)}`,
            name: String(raw['name'] || raw['nome'] || '') || 'SEM_NOME',
            description: (raw['description'] || raw['descricao']) as string | undefined,
            price: Number(raw['price'] ?? raw['preco'] ?? 0),
            categoryId: String(raw['category_id'] || raw['categoria_id'] || raw['categoryId'] || ''),
            image: (raw['image_url'] || raw['imagem_url'] || raw['image']) as string | undefined,
            disponivel: rawAvailable !== false,
            taxCode: 'NOR',
            taxPercentage: Number(raw['tax_rate'] ?? raw['taxa'] ?? 14) || 14
          };
        });
        const mappedSettings = settings ? {
          restaurantName: settings.name || (settings as unknown as Record<string, unknown>)['restaurant_name'],
          logoUrl: settings.logo_url || (settings as unknown as Record<string, unknown>)['logo'],
          currency: settings.currency || (settings as unknown as Record<string, unknown>)['moeda'],
          phone: settings.phone || (settings as unknown as Record<string, unknown>)['telefone'],
          address: settings.address || (settings as unknown as Record<string, unknown>)['endereco'],
          wifiName: settings.wifi_name || (settings as unknown as Record<string, unknown>)['wifi_nome'],
          wifiPassword: settings.wifi_password || (settings as unknown as Record<string, unknown>)['wifi_password'],
          qrMenuTitle: settings.qr_code_title || (settings as unknown as Record<string, unknown>)['qr_menu_title'],
          qrMenuSubtitle: settings.qr_code_subtitle || (settings as unknown as Record<string, unknown>)['qr_menu_subtitle'],
          qrMenuShortCode: settings.qr_code_short_code || (settings as unknown as Record<string, unknown>)['qr_menu_short_code'],
          qrMenuUrl: settings.qr_menu_url || (settings as unknown as Record<string, unknown>)['qr_menu_url'],
          qrMenuCloudUrl: settings.qr_menu_cloud_url || (settings as unknown as Record<string, unknown>)['qr_menu_cloud_url'],
          nif: '',
          taxRate: 14,
          apiToken: '',
          webhookEnabled: false
        } as Settings : null;

        if (mappedCategories.length === 0 && mappedDishes.length === 0) {
          logger.warn('Supabase returned empty dataset; using local fallback in UI', {}, 'SupabaseService');
        }
        return { success: true, data: { categories: mappedCategories, dishes: mappedDishes, settings: mappedSettings } } as SupabaseResponse<{ categories: MenuCategory[]; dishes: Dish[]; settings: SystemSettings }>;
      } catch (error: unknown) {
        logger.error('Fetch menu attempt failed', error, 'SupabaseService');
        throw error;
      }
    };

    try {
      const result = await this.callWithResilience(execute, 'Fetch Menu');
      return result;
    } catch (error: unknown) {
      logger.error('Fetch menu failed', error, 'SupabaseService');
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async fetchCategoriesPaged(options: { page?: number; pageSize?: number; search?: string; orderBy?: 'name' | 'sort_order'; ascending?: boolean } = {}): Promise<SupabaseResponse<MenuCategory[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { page = 1, pageSize = 20, search = '', orderBy = 'sort_order', ascending = true } = options;
    const offset = (page - 1) * pageSize;
    try {
      const qb = this.client.from('categories').select('*');
      const filtered = search ? (qb as any).ilike('name', `%${search}%`) : qb;
      const ranged = (filtered as any).range(offset, offset + pageSize - 1) as Promise<{ data: SupabaseCategory[] | null; error: unknown }>;
      const data = await this.fetchWithTimeout<SupabaseCategory[]>(ranged);
      let mapped = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : 0,
        parentId: c.parent_id,
        is_active: !c.deleted_at
      })) as MenuCategory[];
      mapped = mapped.sort((a: any, b: any) => {
        const va = orderBy === 'name' ? String(a.name || '').toLowerCase() : Number(a.sort_order || 0);
        const vb = orderBy === 'name' ? String(b.name || '').toLowerCase() : Number(b.sort_order || 0);
        if (va < vb) return ascending ? -1 : 1;
        if (va > vb) return ascending ? 1 : -1;
        return 0;
      });
      return { success: true, data: mapped };
    } catch (error: unknown) {
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async fetchDishesPaged(options: { page?: number; pageSize?: number; search?: string; categoryId?: string; availableOnly?: boolean } = {}): Promise<SupabaseResponse<Dish[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    const { page = 1, pageSize = 20, search = '', categoryId = '', availableOnly = true } = options;
    const offset = (page - 1) * pageSize;
    try {
      let qb: any = this.client.from('menu_items').select('*');
      if (availableOnly) qb = qb.eq('available', true);
      if (categoryId) qb = qb.eq('category_id', categoryId);
      if (search) qb = qb.ilike('name', `%${search}%`);
      const ranged = qb.range(offset, offset + pageSize - 1) as Promise<{ data: SupabaseDish[] | null; error: unknown }>;
      const data = await this.fetchWithTimeout<SupabaseDish[]>(ranged);
      const mapped = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        price: Number(d.price || 0),
        categoryId: d.category_id,
        image: d.image_url,
        disponivel: !!d.available,
        taxCode: 'NOR',
        taxPercentage: Number(d.tax_rate) || 14
      })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))) as Dish[];
      return { success: true, data: mapped };
    } catch (error: unknown) {
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async fetchDashboard() {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      // Fetch dashboard summary
      const dashPromise = this.client.from('dashboard_summary').select('*').maybeSingle() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      const data = await this.fetchWithTimeout<Record<string, unknown>>(dashPromise);
      
      // Fetch financial data (revenues and expenses) for today
      const today = new Date().toISOString().split('T')[0];
      let revenues: Revenue[] = [];
      let expenses: Expense[] = [];
      
      try {
        const revenuesPromise = this.client.from('revenues').select('*').gte('date', today).order('date', { ascending: false });
        const expensesPromise = this.client.from('expenses').select('*').gte('date', today).order('date', { ascending: false });
        
        const [revenuesResponse, expensesResponse] = await Promise.all([
          revenuesPromise,
          expensesPromise
        ]);

        if (revenuesResponse.data && Array.isArray(revenuesResponse.data)) {
          revenues = revenuesResponse.data.map((r: any) => ({
            id: r.id,
            amount: Number(r.amount || 0),
            date: r.date,
            category: r.category || 'VENDAS',
            description: r.description
          }));
        }
        
        if (expensesResponse.data && Array.isArray(expensesResponse.data)) {
          expenses = expensesResponse.data.map((e: any) => ({
            id: e.id,
            amount: Number(e.amount || 0),
            date: e.date,
            category: e.category || 'OUTROS',
            description: e.description,
            paymentMethod: e.payment_method
          }));
        }
      } catch (financialError) {
        logger.warn('Failed to fetch financial data, continuing without it', { error: financialError }, 'SupabaseService');
      }

      if (!data) return { success: true, data: { expenses, revenues } };

      // Map DashboardSummary to RemoteDashboardData
      const mappedData: Record<string, unknown> = {
        summary: {
          total_revenue: Number(data.total_revenue || 0),
          total_orders: Number(data.total_orders || 0),
          active_orders_count: Number(data.active_orders_count || 0)
        },
        analytics: {
          totalCustomers: 0,
          retentionRate: 0,
          menu: []
        },
        expenses: expenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          date: e.date,
          category: e.category
        })),
        revenues: revenues.map(r => ({
          id: r.id,
          description: r.description,
          amount: r.amount,
          date: r.date,
          category: r.category
        })),
        lastUpdated: data.last_updated
      };

      return { success: true, data: mappedData };
    } catch (error: unknown) {
      logger.error('Fetch dashboard failed', error, 'SupabaseService');
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async calculateHash(data: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).crypto && (window as any).crypto.subtle) {
        const msgUint8 = new TextEncoder().encode(data);
        const hashBuffer = await (window as any).crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      logger.warn('Falling back to non-crypto hash', { error: (e as Error)?.message }, 'SupabaseService');
    }
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  
  async computeRecordHash<T extends Record<string, unknown>>(obj: T): Promise<string> {
    const keys = Object.keys(obj).sort();
    const normalized = keys.reduce((acc: Record<string, unknown>, k: string) => {
      acc[k] = obj[k];
      return acc;
    }, {});
    const str = JSON.stringify(normalized);
    return this.calculateHash(str);
  }

  async fetchUsers() {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const usersPromise = this.client.from('users').select('*').eq('active', true) as unknown as Promise<{ data: SupabaseUser[] | null; error: unknown }>;
      const data = await this.fetchWithTimeout<SupabaseUser[]>(usersPromise);
      
      if (!data) return { success: true, data: [] };

      // Hash PINs for security so plain text PINs are not stored in memory state
      const secureUsers = await Promise.all(data.map(async (u: SupabaseUser) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        pin: await this.calculateHash(u.pin), // Store Hash only
        isActive: u.active,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })));

      return { 
        success: true, 
        data: secureUsers
      };
    } catch (error: unknown) {
      logger.error('Fetch users failed', error, 'SupabaseService');
      return { success: false, error: (error as Error)?.message || String(error) };
    }
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
      if (!this.client) return false;
      try {
          // Check directly against DB for maximum security (if online)
          const { data, error } = await this.client
              .from('users')
              .select('pin')
              .eq('id', userId)
              .single();
              
          if (error || !data) return false;
          return data.pin === pin;
      } catch {
          return false;
      }
  }

  // --- Realtime Subscriptions ---
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private realtimeHandlers: Map<string, Set<(payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => void>> = new Map();

  subscribeToTableChanges(
    tableName: string,
    callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => void
  ) {
    if (!this.client) {
      logger.error(`Cannot subscribe to ${tableName}: Supabase client not initialized`, {}, 'SupabaseService');
      return () => undefined;
    }

    const handlers = this.realtimeHandlers.get(tableName) || new Set();
    handlers.add(callback);
    this.realtimeHandlers.set(tableName, handlers);

    if (this.subscriptions.has(tableName)) {
      return () => this.removeRealtimeHandler(tableName, callback);
    }

    logger.info(`Subscribing to real-time changes for table: ${tableName}`, {}, 'SupabaseService');
    const subscription = this.client
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        logger.info(`Realtime change in ${tableName}`, { eventType: payload.eventType, new: payload.new, old: payload.old }, 'SupabaseService');
        const currentHandlers = this.realtimeHandlers.get(tableName);
        if (!currentHandlers || currentHandlers.size === 0) {
          return;
        }
        const event = {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old
        };
        currentHandlers.forEach(handler => handler(event));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info(`Successfully subscribed to ${tableName} real-time changes`, {}, 'SupabaseService');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(`Error subscribing to ${tableName} real-time changes`, {}, 'SupabaseService');
        } else {
          logger.debug(`Subscription status for ${tableName}: ${status}`, {}, 'SupabaseService');
        }
      });
    this.subscriptions.set(tableName, subscription);
    return () => this.removeRealtimeHandler(tableName, callback);
  }

  private removeRealtimeHandler(
    tableName: string,
    callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown> }) => void
  ) {
    const handlers = this.realtimeHandlers.get(tableName);
    if (!handlers) {
      return;
    }
    handlers.delete(callback);
    if (handlers.size === 0) {
      this.realtimeHandlers.delete(tableName);
      const subscription = this.subscriptions.get(tableName);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(tableName);
      }
    }
  }

  unsubscribeFromAllChanges() {
    if (!this.client) return;
    logger.info('Unsubscribing from all Supabase real-time channels', {}, 'SupabaseService');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.realtimeHandlers.clear();
  }
}

export const supabaseService = new SupabaseService();
