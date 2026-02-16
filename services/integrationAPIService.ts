import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';
import { SystemSettings, Dish, MenuCategory, Order, DashboardSummary, StockItem, Fornecedor, User, AuditLog, Revenue, Expense, Settings, Employee, AttendanceRecord, PayrollRecord, CashShift, Table } from '../types';
import { logger, LogEntry } from './logger';
import { supabaseService, SupabaseService } from './supabaseService';

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

export type SupabaseResponseSuccess<T> = { success: true; data: T | null; error?: null };
export type SupabaseResponseFailure = { success: false; error: string; data?: null };
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

class IntegrationAPIService {
    private supabase: SupabaseService;

    constructor(supabaseInstance: SupabaseService) {
        this.supabase = supabaseInstance;
    }

    private get client(): SupabaseClient | null {
        return this.supabase.getClient();
    }

    initialize(url: string, key: string, onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void) {
        this.supabase.initialize(url, key, onRealtimeChange);
    }

    isConnected(): boolean {
        return this.supabase.isConnected();
    }

    getSyncStatus() {
        return this.supabase.getSyncStatus();
    }

    private _handleSupabaseResponse<T>({ data, error }: { data: T | null, error: any }, context: string, service: string): SupabaseResponse<T> {
        if (error) {
            logger.error(context, { error: error.message }, service);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    }

    private canWriteToProtectedTables(): boolean {
        // This is a placeholder. Implement logic to check if the current user/key has write access.
        return true;
    }

    private async callWithResilience<T>(fn: () => Promise<T>, context: string): Promise<T> {
        // This is a placeholder. In a real scenario, this would use the circuit breaker and retry logic from SupabaseService.
        try {
            return await fn();
        } catch (error) {
            logger.error(`Error in ${context}`, error, 'IntegrationAPIService');
            throw error;
        }
    }

  async syncMenu(categories: MenuCategory[], menu: Dish[], settings: SystemSettings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    // Sync Categories
    if (categories.length > 0) {
        const { error: catError } = await this.client.from('categories').upsert(categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            sort_order: c.sort_order || c.sortOrder || 0,
            parent_id: c.parentId || c.parent_id,
            deleted_at: c.deletedAt || c.deleted_at
        })), { onConflict: 'id' });
        
        if (catError) {
             return this._handleSupabaseResponse({ data: null, error: catError }, 'Supabase sync categories', 'IntegrationAPIService');
        }
    }

    // Sync Dishes
    if (menu.length > 0) {
        const { error: dishError } = await this.client.from('menu_items').upsert(menu.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            category_id: d.category_id,
            image_url: d.image || d.image_url,
            available: d.disponivel ?? d.available ?? true,
            tax_rate: d.taxPercentage || d.tax_rate || 14
        })), { onConflict: 'id' });

        if (dishError) {
             return this._handleSupabaseResponse({ data: null, error: dishError }, 'Supabase sync dishes', 'IntegrationAPIService');
        }
    }

    // Sync Settings
    if (settings) {
        return this.syncSettings(settings);
    }

    return { success: true, data: null };
  }

  async syncUsers(users: User[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    if (users.length > 0) {
        const { error } = await this.client.from('users').upsert(users.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            pin: u.pin,
            active: u.active ?? true
        })), { onConflict: 'id' });
        
        return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync users', 'IntegrationAPIService');
    }
    
    return { success: true, data: null };
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
  
  async fetchUsers(): Promise<SupabaseResponse<User[]>> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot fetch users.', {}, 'IntegrationAPIService');
      return { success: false, error: 'Supabase client not initialized.' };
    }
    try {
      const { data, error } = await this.client.from('users').select('*');
      if (error) throw error;
      return { success: true, data: data as User[] };
    } catch (error: any) {
      logger.error('Failed to fetch users from Supabase', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async fetchDashboard(startDate: string, endDate: string): Promise<SupabaseResponse<DashboardSummary>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    try {
      // Try to fetch specific day summary if ID is date-based
      const { data, error } = await this.client
          .from('dashboard_summary')
          .select('*')
          .eq('id', startDate)
          .maybeSingle();

      if (error) {
          logger.error('Failed to fetch dashboard summary', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }

      if (data) {
          return {
              success: true,
              data: {
                  totalRevenue: Number(data.total_revenue || 0),
                  totalOrders: Number(data.total_orders || 0),
                  activeOrdersCount: Number(data.active_orders_count || 0)
              }
          };
      }

      return { success: true, data: { totalRevenue: 0, totalOrders: 0, activeOrdersCount: 0 } };
    } catch (error: any) {
      logger.error('Exception in fetchDashboard', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async syncDashboardData(summary: DashboardSummary, activeOrders: Order[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Sync Summary
      const { error: summaryError } = await this.client.from('dashboard_summary').upsert({
          id: today, // Use date as ID
          total_revenue: summary.totalRevenue,
          total_orders: summary.totalOrders,
          active_orders_count: summary.activeOrdersCount,
          last_updated: new Date().toISOString()
      });

      if (summaryError) {
           return this._handleSupabaseResponse({ data: null, error: summaryError }, 'Supabase sync dashboard summary', 'IntegrationAPIService');
      }

      // 2. Sync Active Orders (Snapshot)
      if (activeOrders.length > 0) {
          const { error: ordersError } = await this.client.from('active_orders_snapshot').upsert(activeOrders.map(o => ({
              id: o.id,
              table_id: typeof o.tableId === 'number' ? String(o.tableId) : (o.tableId || ''),
              status: o.status,
              total: o.total,
              items_count: o.items ? o.items.length : 0,
              created_at: o.timestamp instanceof Date ? o.timestamp.toISOString() : o.timestamp
          })), { onConflict: 'id' });

          if (ordersError) {
               logger.warn('Failed to sync active orders snapshot', { error: ordersError.message }, 'IntegrationAPIService');
               // We don't fail the whole sync for this
          }
      }

      return { success: true, data: null };
    } catch (error: any) {
      logger.error('Exception in syncDashboardData', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async syncSettings(settings: SystemSettings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    const { error } = await this.client.from('restaurant_settings').upsert({
        id: '1',
        name: settings.restaurantName,
        logo_url: settings.appLogoUrl || settings.logoUrl,
        currency: settings.currency,
        phone: settings.phone,
        address: settings.address,
        wifi_name: settings.wifiName,
        wifi_password: settings.wifiPassword,
        qr_code_title: settings.qrMenuTitle,
        qr_code_subtitle: settings.qrMenuSubtitle,
        qr_code_short_code: settings.qrMenuShortCode,
        qr_menu_url: settings.qrMenuUrl,
        qr_menu_cloud_url: settings.qrMenuCloudUrl
    });

    if (error) {
         return this._handleSupabaseResponse({ data: null, error }, 'Supabase sync settings', 'IntegrationAPIService');
    }
    return { success: true, data: null };
  }

  async testConnection(url: string, key: string): Promise<boolean> {
      try {
          const tempClient = createClient(url, key);
          const { data, error } = await tempClient.from('restaurant_settings').select('count', { count: 'exact', head: true });
          if (error && error.code !== 'PGRST116') {
             console.warn('Test connection warning:', error);
          }
          return true;
      } catch (e) {
          return false;
      }
  }

  async setupRLS(): Promise<{ success: boolean; message?: string; error?: string }> {
      // Placeholder for RLS setup. 
      // In a real app, this might call a Supabase RPC function or guide the user.
      return { success: true, message: 'RLS policies should be configured in Supabase Dashboard.' };
  }

  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<UploadResult> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: publicUrlData } = this.client.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { 
        success: true, 
        path: data.path, 
        publicUrl: publicUrlData.publicUrl 
      };
    } catch (error: any) {
      logger.error('File upload failed', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async setupBuckets(): Promise<{ success: boolean; message?: string; error?: string }> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      
      try {
          const buckets = ['backups', 'images', 'documents'];
          const results = await Promise.all(buckets.map(async (bucket) => {
              const { data, error } = await this.client!.storage.getBucket(bucket);
              if (error && error.message.includes('not found')) {
                  // Attempt to create bucket if API allows (usually requires service role key, but try anyway or just warn)
                  const { error: createError } = await this.client!.storage.createBucket(bucket, {
                      public: bucket === 'images',
                      fileSizeLimit: 52428800 // 50MB
                  });
                  if (createError) return { bucket, status: 'failed', error: createError.message };
                  return { bucket, status: 'created' };
              } else if (error) {
                  return { bucket, status: 'error', error: error.message };
              }
              return { bucket, status: 'exists' };
          }));

          const failures = results.filter(r => r.status === 'failed' || r.status === 'error');
          if (failures.length > 0) {
              return { success: false, error: `Failed to setup buckets: ${failures.map(f => `${f.bucket} (${f.error})`).join(', ')}` };
          }

          return { success: true, message: 'Storage buckets validated/created successfully.' };
      } catch (error: any) {
          logger.error('Failed to setup buckets', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  initialize(url: string, key: string, onRealtimeChange?: (payload: any) => void) {
      this.supabase.initialize(url, key, onRealtimeChange);
  }

  isConnected(): boolean {
      return this.supabase.isConnected();
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
        const categoriesPromisePrimary = this.client!.from('categories').select('*').order('sort_order');
        const dishesPromisePrimary = this.client!.from('menu_items').select('*').eq('available', true);
        const settingsPromise = this.client!.from('restaurant_settings').select('*').maybeSingle();
        
        let categories: SupabaseCategory[] | null = null;
        try {
          categories = await this.fetchWithTimeout<SupabaseCategory[]>(categoriesPromisePrimary as unknown as Promise<{ data: SupabaseCategory[] | null; error: unknown }>);
        } catch (err: unknown) {
          try {
            const categoriesPromiseFallback = this.client!.from('categories').select('*').order('name');
            categories = await this.fetchWithTimeout<SupabaseCategory[]>(categoriesPromiseFallback as unknown as Promise<{ data: SupabaseCategory[] | null; error: unknown }>);
            logger.warn('Supabase: categories primary query failed; fell back to name ordering', {}, 'SupabaseService');
          } catch (fallbackErr: unknown) {
            try {
              const categoriesPromiseNoOrder = this.client!.from('categories').select('*');
              categories = await this.fetchWithTimeout<SupabaseCategory[]>(categoriesPromiseNoOrder as unknown as Promise<{ data: SupabaseCategory[] | null; error: unknown }>);
              logger.warn('Supabase: categories order failed; fell back to no ordering', {}, 'SupabaseService');
            } catch (finalErr: unknown) {
              logger.warn('Supabase: categories not accessible; continuing without categories', {}, 'SupabaseService');
              categories = [];
            }
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
            category_id: String(raw['category_id'] || raw['categoria_id'] || raw['categoryId'] || ''),
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
        return { success: true, data: { categories: mappedCategories, dishes: mappedDishes, settings: mappedSettings }, error: null } as SupabaseResponse<{ categories: MenuCategory[]; dishes: Dish[]; settings: SystemSettings }>;
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

  async fetchCategoriesPaged(params: { page: number; pageSize: number; search?: string }): Promise<SupabaseResponse<MenuCategory[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
        let query = this.client.from('categories').select('*');
        if (params.search) {
            query = query.ilike('name', `%${params.search}%`);
        }
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        
        const { data, error } = await query.range(from, to).order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        const categories = (data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            sort_order: c.sort_order,
            parentId: c.parent_id,
            is_active: !c.deleted_at
        }));
        
        return { success: true, data: categories, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  }

  async fetchDishesPaged(params: { page: number; pageSize: number; search?: string; categoryId?: string }): Promise<SupabaseResponse<Dish[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
        let query = this.client.from('menu_items').select('*');
        if (params.search) {
            query = query.ilike('name', `%${params.search}%`);
        }
        if (params.categoryId) {
            query = query.eq('category_id', params.categoryId);
        }
        
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        
        const { data, error } = await query.range(from, to).order('name', { ascending: true });
        
        if (error) throw error;
        
        const dishes = (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            category_id: d.category_id,
            image: d.image_url,
            disponivel: d.available,
            taxPercentage: d.tax_rate
        }));
        
        return { success: true, data: dishes, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
  }
}

export const integrationAPIService = new IntegrationAPIService(supabaseService);
export const initializeIntegrationAPI = (url: string, key: string) => {
    supabaseService.initialize(url, key);
};
