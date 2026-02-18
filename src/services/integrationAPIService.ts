// @ts-nocheck
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';
import { SystemSettings, Product, MenuCategory, Order, DashboardSummary, StockItem, Fornecedor, User, AuditLog, Revenue, Expense, SystemSettings as Settings, Employee, AttendanceRecord, PayrollRecord, CashShift, Table } from '../types';
import { logger, LogEntry } from './logger';
import { supabaseService, SupabaseService } from './supabaseService';
import { getAngolaToday } from '@/utils/date';

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
  updated_at?: string;
  is_active?: boolean;
  is_available_on_digital_menu?: boolean;
}

interface SupabaseProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  image?: string;
  is_available: boolean;
  is_available_on_digital_menu: boolean;
  tax_percentage: number;
  tax_code: string;
  tempo_preparo?: number;
  controla_estoque?: boolean;
  quantidade_estoque?: number;
  quantidade_minima?: number;
  quantidade_maxima?: number;
  unidade_medida?: string;
  fornecedor_padrao_id?: string;
  updated_at?: string;
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

export class IntegrationAPIService {
    private supabase: SupabaseService;

    constructor(supabaseInstance: SupabaseService) {
        this.supabase = supabaseInstance;
    }

    private get client(): SupabaseClient | null {
        return this.supabase.getClient();
    }

    async initialize(url?: string, key?: string, onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void) {
        await this.supabase.initialize(url, key, onRealtimeChange);
    }

    async reconnect() {
        await this.supabase.reconnect();
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

  async syncMenu(categories: MenuCategory[], products: Product[], settings: SystemSettings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };

    // Sync Categories
    if (categories.length > 0) {
        const { error: catError } = await this.client.from('categories').upsert(categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            sort_order: c.sort_order,
            parent_id: c.parent_id,
            deleted_at: c.deleted_at,
            is_active: c.is_active,
            is_available_on_digital_menu: c.is_available_on_digital_menu
        })), { onConflict: 'id' });
        
        if (catError) {
             return this._handleSupabaseResponse({ data: null, error: catError }, 'Supabase sync categories', 'IntegrationAPIService');
        }
    }

    // Sync Products
    if (products.length > 0) {
        const { error: prodError } = await this.client.from('products').upsert(products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category_id: p.category_id,
            image: p.image_url,
            is_available: p.is_active,
            is_available_on_digital_menu: p.is_available_on_digital_menu,
            tax_percentage: p.tax_percentage,
            tax_code: p.tax_code,
            tempo_preparo: p.preparation_time,
            controla_estoque: p.track_stock,
            quantidade_estoque: p.stock_quantity,
            quantidade_minima: p.min_stock_quantity,
            quantidade_maxima: p.max_stock_quantity,
            unidade_medida: p.unit,
            fornecedor_padrao_id: p.supplier_id
        })), { onConflict: 'id' });

        if (prodError) {
             return this._handleSupabaseResponse({ data: null, error: prodError }, 'Supabase sync products', 'IntegrationAPIService');
        }
    }

    // Sync Settings
    if (settings) {
        return this.syncSettings(settings);
    }

    return { success: true, data: null };
  }

  async syncOrders(orders: Order[]): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    if (orders.length === 0) return { success: true, data: null };

    try {
        // 1. Sync Orders
        const { error: ordersError } = await this.client.from('orders').upsert(orders.map(o => ({
            id: o.id,
            table_id: typeof o.tableId === 'number' ? o.tableId : (o.table_id || null),
            status: o.status,
            total: o.total,
            tax_total: o.taxTotal || o.tax_total || 0,
            payment_method: o.paymentMethod || o.payment_method,
            customer_id: o.customerId || o.customer_id,
            created_at: o.timestamp instanceof Date ? o.timestamp.toISOString() : o.timestamp,
            user_id: o.userId || o.user_id,
            user_name: o.userName || o.user_name,
            invoice_number: o.invoiceNumber || o.invoice_number
        })), { onConflict: 'id' });

        if (ordersError) {
             return this._handleSupabaseResponse({ data: null, error: ordersError }, 'Supabase sync orders', 'IntegrationAPIService');
        }

        // 2. Sync Order Items
        const allItems: any[] = [];
        orders.forEach(o => {
            if (o.items && o.items.length > 0) {
                o.items.forEach(item => {
                    allItems.push({
                        id: item.id || crypto.randomUUID(),
                        order_id: o.id,
                        product_id: item.productId || item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unitPrice || item.unit_price,
                        tax_amount: item.taxAmount || item.tax_amount || 0,
                        tax_percentage: item.taxPercentage || item.tax_percentage || 14,
                        notes: item.notes,
                        status: item.status || 'PENDENTE'
                    });
                });
            }
        });

        if (allItems.length > 0) {
            const { error: itemsError } = await this.client.from('order_items').upsert(allItems, { onConflict: 'id' });
            if (itemsError) {
                // Log but don't fail completely if items fail (though it's bad)
                logger.error('Failed to sync order items', { error: itemsError.message }, 'IntegrationAPIService');
            }
        }

        return { success: true, data: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
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
    // TEMPORARILY DISABLED TO PREVENT 401 ERRORS
    return { success: true, data: null };
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

  async fetchFinancials(startDate: string, endDate: string): Promise<SupabaseResponse<{ expenses: Expense[], revenues: Revenue[] }>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data: expenses, error: expError } = await this.client
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (expError) throw expError;

      const { data: revenues, error: revError } = await this.client
        .from('revenues')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (revError) throw revError;

      return {
        success: true,
        data: {
          expenses: (expenses || []).map(e => ({
            id: e.id,
            amount: e.amount,
            date: e.date,
            category: e.category,
            description: e.description,
            status: 'PAID'
          })) as Expense[],
          revenues: (revenues || []).map(r => ({
            id: r.id,
            amount: r.amount,
            date: r.date,
            category: r.category,
            description: r.description,
            source: r.payment_method
          })) as Revenue[]
        }
      };
    } catch (error: any) {
      logger.error('Failed to fetch financials from Supabase', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  // Menu CRUD Operations
  async createCategory(category: MenuCategory): Promise<SupabaseResponse<MenuCategory>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('categories').insert({
              id: category.id,
              name: category.name,
              icon: category.icon,
              sort_order: category.sort_order,
              parent_id: category.parent_id,
              deleted_at: category.deleted_at,
              is_active: category.is_active,
              is_available_on_digital_menu: category.is_available_on_digital_menu
          }).select().single();
          
          if (error) throw error;
          
          return { success: true, data: {
              id: data.id,
              name: data.name,
              icon: data.icon,
              sort_order: data.sort_order,
              parent_id: data.parent_id,
              deleted_at: data.deleted_at,
              is_active: data.is_active,
              is_available_on_digital_menu: data.is_available_on_digital_menu
          }};
      } catch (error: any) {
          logger.error('Failed to create category', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async updateCategory(category: MenuCategory): Promise<SupabaseResponse<MenuCategory>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('categories').update({
              name: category.name,
              icon: category.icon,
              sort_order: category.sort_order,
              parent_id: category.parent_id,
              deleted_at: category.deleted_at,
              is_active: category.is_active,
              is_available_on_digital_menu: category.is_available_on_digital_menu
          }).eq('id', category.id).select().single();
          
          if (error) throw error;
          
          return { success: true, data: {
              id: data.id,
              name: data.name,
              icon: data.icon,
              sort_order: data.sort_order,
              parent_id: data.parent_id,
              deleted_at: data.deleted_at,
              is_active: data.is_active,
              is_available_on_digital_menu: data.is_available_on_digital_menu
          }};
      } catch (error: any) {
          logger.error('Failed to update category', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async deleteCategory(categoryId: string): Promise<SupabaseResponse<null>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { error } = await this.client.from('categories').delete().eq('id', categoryId);
          if (error) throw error;
          return { success: true, data: null };
      } catch (error: any) {
          logger.error('Failed to delete category', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async fetchCategories(): Promise<SupabaseResponse<MenuCategory[]>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('categories').select('*');
          if (error) throw error;
          const categories = data.map((c: SupabaseCategory) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              sort_order: c.sort_order,
              parent_id: c.parent_id,
              deleted_at: c.deleted_at,
              is_active: c.is_active ?? true,
              is_available_on_digital_menu: c.is_available_on_digital_menu ?? true
          }));
          return { success: true, data: categories };
      } catch (error: any) {
          logger.error('Failed to fetch categories', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async createProduct(product: Product): Promise<SupabaseResponse<Product>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('products').insert({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              category_id: product.category_id,
              image: product.image_url,
              is_available: product.is_active,
              is_available_on_digital_menu: product.is_available_on_digital_menu,
              tax_percentage: product.tax_percentage,
              tax_code: product.tax_code,
              tempo_preparo: product.preparation_time,
              controla_estoque: product.track_stock,
              quantidade_estoque: product.stock_quantity,
              quantidade_minima: product.min_stock_quantity,
              quantidade_maxima: product.max_stock_quantity,
              unidade_medida: product.unit,
              fornecedor_padrao_id: product.supplier_id
          }).select().single();

          if (error) throw error;

          return { success: true, data: {
              id: data.id,
              name: data.name,
              description: data.description,
              price: data.price,
              category_id: data.category_id,
              image_url: data.image,
              is_active: data.is_available,
              is_available_on_digital_menu: data.is_available_on_digital_menu,
              tax_percentage: data.tax_percentage,
              tax_code: data.tax_code,
              preparation_time: data.tempo_preparo,
              track_stock: data.controla_estoque,
              stock_quantity: data.quantidade_estoque,
              min_stock_quantity: data.quantidade_minima,
              max_stock_quantity: data.quantidade_maxima,
              unit: data.unidade_medida,
              supplier_id: data.fornecedor_padrao_id,
              created_at: data.created_at,
              updated_at: data.updated_at
          }};
      } catch (error: any) {
          logger.error('Failed to create product', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async updateProduct(product: Product): Promise<SupabaseResponse<Product>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('products').update({
              name: product.name,
              description: product.description,
              price: product.price,
              category_id: product.category_id,
              image: product.image_url,
              is_available: product.is_active,
              is_available_on_digital_menu: product.is_available_on_digital_menu,
              tax_percentage: product.tax_percentage,
              tax_code: product.tax_code,
              tempo_preparo: product.preparation_time,
              controla_estoque: product.track_stock,
              quantidade_estoque: product.stock_quantity,
              quantidade_minima: product.min_stock_quantity,
              quantidade_maxima: product.max_stock_quantity,
              unidade_medida: product.unit,
              fornecedor_padrao_id: product.supplier_id
          }).eq('id', product.id).select().single();

          if (error) throw error;

          return { success: true, data: {
              id: data.id,
              name: data.name,
              description: data.description,
              price: data.price,
              category_id: data.category_id,
              image_url: data.image,
              is_active: data.is_available,
              is_available_on_digital_menu: data.is_available_on_digital_menu,
              tax_percentage: data.tax_percentage,
              tax_code: data.tax_code,
              preparation_time: data.tempo_preparo,
              track_stock: data.controla_estoque,
              stock_quantity: data.quantidade_estoque,
              min_stock_quantity: data.quantidade_minima,
              max_stock_quantity: data.quantidade_maxima,
              unit: data.unidade_medida,
              supplier_id: data.fornecedor_padrao_id,
              created_at: data.created_at,
              updated_at: data.updated_at
          }};
      } catch (error: any) {
          logger.error('Failed to update product', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async deleteProduct(productId: string): Promise<SupabaseResponse<null>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { error } = await this.client.from('products').delete().eq('id', productId);
          if (error) throw error;
          return { success: true, data: null };
      } catch (error: any) {
          logger.error('Failed to delete product', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async fetchProducts(): Promise<SupabaseResponse<Product[]>> {
      if (!this.client) return { success: false, error: 'Not initialized' };
      try {
          const { data, error } = await this.client.from('products').select('*');
          if (error) throw error;
          const products = data.map((p: SupabaseProduct) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              category_id: p.category_id,
              image_url: p.image,
              is_active: p.is_available,
              is_available_on_digital_menu: p.is_available_on_digital_menu,
              tax_percentage: p.tax_percentage,
              tax_code: p.tax_code,
              preparation_time: p.tempo_preparo,
              track_stock: p.controla_estoque,
              stock_quantity: p.quantidade_estoque,
              min_stock_quantity: p.quantidade_minima,
              max_stock_quantity: p.quantidade_maxima,
              unit: p.unidade_medida,
              supplier_id: p.fornecedor_padrao_id,
              updated_at: p.updated_at
          }));
          return { success: true, data: products };
      } catch (error: any) {
          logger.error('Failed to fetch products', { error: error.message }, 'IntegrationAPIService');
          return { success: false, error: error.message };
      }
  }

  async syncSettings(settings: Settings): Promise<SupabaseResponse<null>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { error } = await this.client.from('settings').upsert({
        id: settings.id,
        name: settings.name,
        logo_url: settings.logo_url,
        currency: settings.currency,
        phone: settings.phone,
        address: settings.address,
        wifi_name: settings.wifi_name,
        wifi_password: settings.wifi_password,
        qr_code_title: settings.qr_code_title,
        qr_code_subtitle: settings.qr_code_subtitle,
        qr_code_short_code: settings.qr_code_short_code,
        qr_menu_url: settings.qr_menu_url,
        qr_menu_cloud_url: settings.qr_menu_cloud_url
      }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true, data: null };
    } catch (error: any) {
      logger.error('Failed to sync settings', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async fetchSettings(): Promise<SupabaseResponse<Settings>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client.from('settings').select('*').single();
      if (error) throw error;
      return { success: true, data: data as Settings };
    } catch (error: any) {
      logger.error('Failed to fetch settings', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async uploadFile(bucket: string, path: string, file: File): Promise<UploadResult> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file);
      if (error) throw error;
      
      const { data: publicUrlData } = this.client.storage.from(bucket).getPublicUrl(data.path);
      
      return { success: true, path: data.path, publicUrl: publicUrlData.publicUrl };
    } catch (error: any) {
      logger.error(`Failed to upload file to ${bucket}`, { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async listFiles(bucket: string, path?: string): Promise<SupabaseResponse<FileObject[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client.storage.from(bucket).list(path);
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      logger.error(`Failed to list files in ${bucket}`, { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async getDashboardSummary(startDate: string, endDate: string): Promise<SupabaseResponse<DashboardSummary>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client.rpc('get_dashboard_summary', {
        start_date: startDate,
        end_date: endDate
      });
      if (error) throw error;
      return { success: true, data: data as DashboardSummary };
    } catch (error: any) {
      logger.error('Failed to get dashboard summary', { error: error.message }, 'IntegrationAPIService');
      return { success: false, error: error.message };
    }
  }

  async fetchOrders(limit = 100): Promise<SupabaseResponse<Order[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Map to Order type (simplified)
          const orders = data.map((o: any) => ({
              ...o, // Spread other fields
              id: o.id,
              tableId: o.table_id,
              status: o.status,
              total: o.total,
              taxTotal: o.tax_total,
              paymentMethod: o.payment_method,
              customerId: o.customer_id,
              timestamp: o.created_at,
              userId: o.user_id,
              userName: o.user_name,
              invoiceNumber: o.invoice_number,
              items: o.items || [] // Assuming JSON items are stored or joined
          }));

      return { success: true, data: orders };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async fetchRevenues(limit = 100): Promise<SupabaseResponse<Revenue[]>> {
    if (!this.client) return { success: false, error: 'Not initialized' };
    try {
      const { data, error } = await this.client
        .from('revenues')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const revenues = data.map((r: any) => ({
        id: r.id,
        amount: r.amount,
        date: r.date,
        category: r.category,
        description: r.description,
        source: r.payment_method
      }));

      return { success: true, data: revenues };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const integrationAPIService = new IntegrationAPIService(supabaseService);
