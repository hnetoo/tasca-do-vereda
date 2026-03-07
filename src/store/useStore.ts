import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { logger } from '@/services/logger';
import { env } from '@/utils/env';

// Import actions individually to avoid module factory issues
import { getDatabaseConfigAction, saveDatabaseConfigAction } from '@/app/actions/settings';
import { integrationAPIService } from '@/services/integrationAPIService';
import { createMenuSlice } from './slices/menuSlice';
import { createStaffSlice } from './slices/staffSlice';
import { createFinanceSlice } from './slices/financeSlice';

import { createOperationalSlice } from './slices/operationalSlice';
import { getTablesAction } from '@/app/actions/operational';
import { getEmployeesAction } from '@/app/actions/users';
import { createUISlice } from './slices/uiSlice';
import { createIntegrationsSlice } from './slices/integrationsSlice';
import { 
  IntegrationLog, 
  Dish, 
  Category, 
  DashboardSummary, 
  Order, 
  SystemSettings, 
  Notification,
  Fornecedor,
  DailySalesAnalytics,
  StoreState,
  WorkShift,
  AttendanceRecord,
  Employee,
  OrderItem,
  AuditLog,
  SupabaseSyncStatus
} from '../types';
import { MOCK_USERS, LOCAL_STORAGE_SCHEMA_VERSION } from '@/constants/index';
import { supabaseService } from '@/services/supabaseService';

const clearLocalStorageIfSchemaChanged = () => {
  if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem('tasca-vereda-storage-v2_schema_version');
    if (storedVersion && parseInt(storedVersion) < LOCAL_STORAGE_SCHEMA_VERSION) {
      localStorage.removeItem('tasca-vereda-storage-v2');
      console.log('Local storage cleared due to schema version mismatch.');
    }
    localStorage.setItem('tasca-vereda-storage-v2_schema_version', LOCAL_STORAGE_SCHEMA_VERSION.toString());
  }
};

if (typeof window !== 'undefined') {
  clearLocalStorageIfSchemaChanged();
}

const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      try { 
        console.log('📦 Getting item from storage:', name);
        const item = localStorage.getItem(name);
        console.log('📦 Item retrieved:', item ? 'success' : 'null');
        return item;
      } catch (error) { 
        console.error('📦 Error getting item:', error);
        return null;
      }
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try { 
        console.log('📦 Setting item in storage:', name, 'size:', value.length);
        localStorage.setItem(name, value);
        console.log('📦 Item set successfully');
      } catch (error) { 
        console.error('📦 Error setting item:', error);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      try { 
        console.log('📦 Removing item from storage:', name);
        localStorage.removeItem(name);
        console.log('📦 Item removed successfully');
      } catch (error) { 
        console.error('📦 Error removing item:', error);
      }
    }
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createMenuSlice(set, get, api),
      ...createStaffSlice(set, get, api),
      ...createFinanceSlice(set, get, api),

      ...createOperationalSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createIntegrationsSlice(set, get, api),

      // Legacy/Root State Initializers
      supabaseSyncStatus: {
        isConnected: false,
        status: 'disconnected',
        lastErrorAt: null,
        errorMessage: null,
        retries: 0
      },
      setSupabaseSyncStatus: (status: SupabaseSyncStatus) => set({ supabaseSyncStatus: status }),
      retrySync: async () => {
        set((state) => ({
          supabaseSyncStatus: {
            ...state.supabaseSyncStatus,
            status: 'connecting',
            errorMessage: null
          }
        }));
        await supabaseService.reconnect();
      },
      activeTableId: null,
      shifts: [],
      stock: [],
      attendance: [],
      employees: [],
      notifications: [],
      // users: MOCK_USERS, // Users will be fetched from Supabase during initialization
      payroll: [],
      loyaltyRewards: [],
      dailyAnalyticsData: null,
      menuAccessLogs: [],
      integrationLogs: [],
      suppliers: [],
      
      // Update Settings with Sync Logic
      updateSettings: (newSettings: Partial<SystemSettings>) => {
        const currentSettings = get().settings;
        set((state: StoreState) => {
            const updated = { ...state.settings, ...newSettings };
            saveDatabaseConfigAction({ type: 'postgres', ...updated }).catch((e: any) => logger.error('Failed to save settings to DB', { error: (e as Error).message }, 'DATABASE'));
            
            logger.info('Supabase config for sync:', { config: updated.supabaseConfig }, 'STORE');
            logger.info('IntegrationAPIService is connected:', { isConnected: integrationAPIService.isConnected() }, 'STORE');
            logger.info('env.SUPABASE_URL in updateSettings:', { url: env.SUPABASE_URL }, 'STORE');
            const isSupabaseConfigured = !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY;

            if (isSupabaseConfigured) {
                // If configured, ensure enabled and autoSync are true by default if not explicitly set to false
                if (updated.supabaseConfig) {
                    updated.supabaseConfig.enabled = updated.supabaseConfig.enabled ?? true;
                    updated.supabaseConfig.autoSync = updated.supabaseConfig.autoSync ?? true;
                } else {
                    // If supabaseConfig is entirely missing but env vars are present, initialize it
                    updated.supabaseConfig = {
                        enabled: true,
                        autoSync: true,
                        url: env.SUPABASE_URL!,
                        key: env.SUPABASE_ANON_KEY!
                    };
                }
            } else {
                // If Supabase is not configured via env vars, ensure it's disabled in settings
                if (updated.supabaseConfig) {
                    updated.supabaseConfig.enabled = false;
                    updated.supabaseConfig.autoSync = false;
                }
            }
            
            if (updated.supabaseConfig?.enabled && updated.supabaseConfig?.autoSync) {
                if (!integrationAPIService.isConnected()) {
                    integrationAPIService.initialize(updated.supabaseConfig.url, updated.supabaseConfig.key, get().onRealtimeChange);
                }
                integrationAPIService.syncSettings(updated).then(res => {
                    if (!res.success) logger.error('Failed to sync settings to Supabase', { error: res.error }, 'CLOUD');
                });
            }
            return { settings: updated };
        });
      },

      isInitialized: false,
      initializeStore: async () => {
        try {
          const state = get();
          
          // CRITICAL: Validate session integrity on startup
          // If the user thinks they are authenticated but the cookie is gone (expired/deleted), 
          // we must clear the state immediately to force login screen.


          const { supabaseConfig } = state.settings;

          logger.info('env.SUPABASE_URL:', { url: env.SUPABASE_URL }, 'STORE');
          logger.info('state.settings.supabaseConfig.url before init:', { url: supabaseConfig?.url }, 'STORE');

          // Initialize IntegrationAPIService if Supabase is enabled and not already connected
          if (supabaseConfig?.enabled && supabaseConfig?.url && supabaseConfig?.key && !integrationAPIService.isConnected()) {
            logger.info('Initializing IntegrationAPIService in initializeStore', {}, 'STORE');
            await integrationAPIService.initialize(
                supabaseConfig.url, 
                supabaseConfig.key, 
                state.onRealtimeChange,
                (status: any) => {
                    state.setSupabaseSyncStatus(status);
                    // Check for critical realtime connection failure
                    if (status.status === 'error' && status.retries === 3) {
                         state.addNotification('error', 'Conexão em tempo real indisponível; dados atualizados ao recarregar', 10000);
                    }
                }
            );
          }

          // Load menu data from server actions
          const success = await state.loadFromSQLExclusively();
          if (!success) {
             if (state.categories.length === 0) {
                state.addNotification?.('error', 'Falha ao carregar menu. Tente recarregar a página.', 10000);
             }
          }

          // Fetch tables from SQL
          try {
             const tablesResult = await getTablesAction();
             if (tablesResult.success && tablesResult.data) {
                set({ tables: tablesResult.data });
                logger.info('Tables loaded from SQL', { count: tablesResult.data.length }, 'STORE');
             } else {
                logger.error('Failed to load tables from SQL', { error: tablesResult.error }, 'STORE');
             }
          } catch (err) {
             logger.error('Exception loading tables', { error: err }, 'STORE');
          }

          // Fetch users from Supabase



        } catch (error) {
          logger.error('Error during store initialization', { error }, 'STORE');
        } finally {
          set({ isInitialized: true });
        }
      },
      
      isMobileMenuOpen: false,
      toggleMobileMenu: () => set((state: StoreState) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

      setDailyAnalyticsData: (data: DailySalesAnalytics | null) => set({ dailyAnalyticsData: data }),
      
      getMenuAccessStats: () => {
        const logs = get().menuAccessLogs || [];
        const now = new Date();
        const todayStr = now.toDateString();
        return { 
          total: logs.length, 
          todayAccesses: logs.filter((log: any) => new Date(log.timestamp).toDateString() === todayStr).length, 
          publicMenus: 0, 
          tableMenus: 0, 
          uniqueVisitors: 0, 
          averageAccessPerDay: 0, 
          peakAccessTime: '', 
          mostAccessedMenu: '' 
        };
      },

      addIntegrationLog: (log: IntegrationLog) => set((state: StoreState) => {
        const newLog: IntegrationLog = {
           id: `log-${Date.now()}`,
           timestamp: new Date().toISOString(),
           integrationName: 'AppStore',
           eventType: log.type,
           status: 'INFO',
           request: { message: log.message, details: log.details },
           response: {},
           duration: 0
        };
        const currentLogs = state.integrationLogs || [];
        return { integrationLogs: [newLog, ...currentLogs].slice(0, 100) };
      }),


      setShifts: (shifts: WorkShift[]) => set({ shifts }),
      setAttendance: (records: AttendanceRecord[]) => set({ attendance: records }),
      setEmployees: (employees: Employee[]) => set({ employees }),
      addAuditLog: (log: AuditLog) => console.log('Audit log:', log),
      addNotification: (type: Notification['type'], message: string, duration?: number) => {
        const autoDismissDuration = duration || 2500; // Reduced to 2.5s for faster dismissal
        const newNotification = { id: Date.now().toString(), type, message, duration: autoDismissDuration };
        set((state: StoreState) => ({ notifications: [...(state.notifications || []), newNotification] }));
        
        setTimeout(() => {
          set((state: StoreState) => ({
            notifications: (state.notifications || []).filter((n: Notification) => n.id !== newNotification.id)
          }));
        }, autoDismissDuration);
      },  

      setSuppliers: (suppliers: Fornecedor[]) => set({ suppliers }),
      addSupplier: (supplier: Fornecedor) => {
        set((state: StoreState) => ({ suppliers: [...(state.suppliers || []), supplier] }));
        // saveSupplierAction(supplier); // TODO: Implement saveSupplierAction
      },
      updateSupplier: (supplier: Fornecedor) => {
        set((state: StoreState) => ({ suppliers: (state.suppliers || []).map((s: Fornecedor) => s.id === supplier.id ? supplier : s) }));
        // saveSupplierAction(supplier); // TODO: Implement saveSupplierAction
      },
      removeSupplier: (id: string) => {
        set((state: StoreState) => ({ suppliers: (state.suppliers || []).filter((s: Fornecedor) => s.id !== id) }));
      },

      onRealtimeChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => {
        logger.info(`Realtime change received for table: ${payload.tableName}, event: ${payload.eventType}`, payload, 'STORE');
        // Add a specific log for orders to confirm reception
        if (payload.tableName === 'orders') {
          logger.info(`Realtime ORDER change received: ${payload.eventType}`, payload, 'STORE_ORDERS');
        }
        const state = get();
        switch (payload.tableName) {
          case 'dishes':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const p = payload.new as any;
              const dish: Dish = {
                ...p, // Spread all properties from payload.new
                categoryId: p.category_id,
                imageUrl: p.image_url || p.image,
                taxCode: p.tax_code,
                isActive: p.is_active,
                available: p.available ?? p.is_available_on_digital_menu,
                parentId: p.parent_id,
                createdAt: p.created_at ? new Date(p.created_at) : undefined,
                updatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
              };
              
              if (payload.eventType === 'INSERT') state.addDish(dish);
              if (payload.eventType === 'UPDATE') state.updateDish(dish);
            }
            if (payload.eventType === 'DELETE') state.removeDish(payload.old.id as string);
            break;
            
          case 'menu_categories':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const c = payload.new as Category;
              const category: Category = {
                ...c,
                parentId: (c as any).parent_id,
                availableOnDigitalMenu: (c as any).is_available_on_digital_menu,
                createdAt: (c as any).created_at ? new Date((c as any).created_at) : undefined,
                updatedAt: (c as any).updated_at ? new Date((c as any).updated_at) : undefined,
              };
              if (payload.eventType === 'INSERT') state.addCategory(category);
              if (payload.eventType === 'UPDATE') state.updateCategory(category);
            }
            if (payload.eventType === 'DELETE') state.removeCategory(payload.old.id as string);
            break;
            
          case 'categories':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const c = payload.new as any;
              const category: Category = {
                ...c, // Spread all properties from payload.new
                parentId: c.parent_id,
                availableOnDigitalMenu: c.is_available_on_digital_menu,
                createdAt: c.created_at ? new Date(c.created_at) : undefined,
                updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
              };
              if (payload.eventType === 'INSERT') state.addCategory(category);
              if (payload.eventType === 'UPDATE') state.updateCategory(category);
            }
            if (payload.eventType === 'DELETE') state.removeCategory(payload.old.id as string);
            break;
            
          case 'employees':
            // Handles realtime updates for the Employees table
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const e = payload.new as any;
              const employee: Employee = {
                id: e.id,
                name: e.name,
                role: e.role,
                phone: e.phone,
                salary: e.salary,
                status: e.status,
                color: e.color,
                workDaysPerMonth: e.work_days_per_month,
                dailyWorkHours: e.daily_work_hours,
                externalBioId: e.external_bio_id,
                bi: e.bi,
                nif: e.nif,
              } as Employee;

              // Estas funções (addEmployee, updateEmployee) devem existir no seu staffSlice
              if (payload.eventType === 'INSERT') get().addEmployee(employee);
              if (payload.eventType === 'UPDATE') get().updateEmployee(employee.id, employee);
            }
            if (payload.eventType === 'DELETE') get().removeEmployee(payload.old.id as string);
            break;

          case 'expenses':
            // Handles realtime updates for the Expenses table
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const ex = payload.new as any;
              const expense = {
                id: ex.id,
                description: ex.description,
                amount: ex.amount,
                category: ex.category,
                date: ex.date,
                supplierId: ex.supplier_id,
                createdAt: ex.created_at ? new Date(ex.created_at) : new Date(),
              };
              // Estas funções (addExpense, updateExpense) devem existir no seu financeSlice
              if (payload.eventType === 'INSERT') get().addExpense(expense as any);
              if (payload.eventType === 'UPDATE') get().updateExpense(expense as any);
            }
            if (payload.eventType === 'DELETE') get().removeExpense(payload.old.id as string);
            break;

          case 'orders':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const o = payload.new as Order;
              const order: Order = {
                ...o, // Spread all properties from payload.new
                tableId: o.table_id ?? undefined,
                userId: o.user_id ?? undefined,
                userName: o.user_name ?? undefined,
                customerNif: o.customer_nif ?? undefined,
                customerId: o.customer_id ?? undefined,
                shiftId: o.shift_id ?? undefined,
                subAccountName: o.sub_account_name ?? undefined,
                invoiceNumber: o.invoice_number ?? undefined,
                previousHash: o.previous_hash,
                jwsPayload: o.jws_payload,
                isSyncedAgt: o.is_synced_agt ?? undefined,
                agtSubmissionUuid: o.agt_submission_uuid ?? undefined,
                createdAt: o.created_at ? new Date(o.created_at) : undefined,
                updatedAt: o.updated_at ? new Date(o.updated_at) : undefined,
                closedAt: o.closed_at ? new Date(o.closed_at) : undefined,
                paymentMethod: (o.payment_method as any) ?? undefined,
                splitPayments: (o.split_payments as any) ?? undefined,
                customerName: o.customer_name ?? undefined,
                // Runtime fields
                items: [],
                payments: []
              } as unknown as Order;
              if (payload.eventType === 'INSERT') state.addOrder(order);
              if (payload.eventType === 'UPDATE') state.updateOrder(order);
            }
            if (payload.eventType === 'DELETE') state.removeOrder(payload.old.id as string);
            break;
            
          case 'payroll':
            // Handles realtime updates for the Payroll table
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const p = payload.new as any;
                const payrollEntry = {
                    id: p.id,
                    employeeId: p.employee_id,
                    paymentDate: p.payment_date,
                    baseSalary: p.base_salary,
                    deductions: p.deductions,
                    netSalary: p.net_salary,
                    month: p.month,
                    year: p.year,
                };
                // Estas funções (addPayroll, updatePayroll) devem existir no seu financeSlice
                if (payload.eventType === 'INSERT') get().addPayroll(payrollEntry as any);
                if (payload.eventType === 'UPDATE') get().updatePayroll(payrollEntry as any);
            }
            if (payload.eventType === 'DELETE') get().removePayroll(payload.old.id as string);
            break;
            
          case 'order_items':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const oi = payload.new as any; // Cast to any first to access snake_case properties
              const orderItem: any = {
                id: oi.id,
                productId: oi.product_id,
                quantity: oi.quantity,
                price: oi.price,
                subtotal: oi.subtotal,
                tax: oi.tax,
                total: oi.total,
                notes: oi.notes,
                status: oi.status,
                createdAt: oi.created_at ? new Date(oi.created_at).toISOString() : new Date().toISOString(),
                updatedAt: oi.updated_at ? new Date(oi.updated_at).toISOString() : new Date().toISOString(),
              };
              if (payload.eventType === 'INSERT') {
                state.addOrderItem(oi.order_id, orderItem);
              }
              if (payload.eventType === 'UPDATE') {
                state.updateOrderItem(oi.order_id, orderItem.id!, orderItem);
              }
            }
            if (payload.eventType === 'DELETE') {
              const oldOrderItem = payload.old as any;
              state.removeOrderItem(oldOrderItem.order_id, oldOrderItem.id);
            }
            break;
            
          case 'system_settings':
          case 'settings':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const s = payload.new as any;
              const current = state.settings;
              const settingsPatch: Partial<SystemSettings> = {
                id: s.id ?? current.id,
                restaurantName: s.restaurant_name ?? s.name ?? current.restaurantName,
                nif: s.nif ?? current.nif,
                address: s.address ?? current.address,
                phone: s.phone ?? current.phone,
                email: s.email ?? current.email,
                appLogoUrl: s.app_logo_url ?? s.logo_url ?? current.appLogoUrl ?? null,
                taxPercentage: Number(s.tax_percentage ?? current.taxPercentage ?? 0),
                currency: s.currency ?? current.currency,
                timezone: s.timezone ?? current.timezone,
                language: s.language ?? current.language,
                wifi_name: s.wifi_name ?? current.wifi_name,
                wifi_password: s.wifi_password ?? current.wifi_password,
                qr_code_title: s.qr_code_title ?? current.qr_code_title,
                qr_code_subtitle: s.qr_code_subtitle ?? current.qr_code_subtitle,
                qr_code_short_code: s.qr_code_short_code ?? current.qr_code_short_code,
                qr_menu_url: s.qr_menu_url ?? current.qr_menu_url,
                qr_menu_cloud_url: s.qr_menu_cloud_url ?? current.qr_menu_cloud_url,
                logo_url: s.logo_url ?? current.logo_url,
                name: s.name ?? current.name,
              };
              state.updateSettings(settingsPatch);
            }
            break;
          
          case 'audit_logs':
            if (payload.eventType === 'INSERT') {
              const logEntry = payload.new as any;
              state.addAuditLog(logEntry);
            }
            break;
            
          case 'dashboard_summary':
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const summaryData = payload.new as any;
              const summary: DashboardSummary = {
                totalRevenue: Number(summaryData.total_revenue ?? 0),
                totalExpenses: Number(summaryData.total_expenses ?? 0),
                totalOrders: Number(summaryData.total_orders ?? 0),
                activeOrders: Number(summaryData.active_orders_count ?? 0)
              };
              state.setDashboardSummary(summary);
            }
            break;
        }
      },
    }),
    {
      name: 'tasca-vereda-storage-v2',
      storage: createJSONStorage(() => customStorage),
       partialize: (state) => {
         // Persist critical data, exclude transient UI state
         const { 
            notifications, 
            isMobileMenuOpen, 
            isInitialized, 
            dailyAnalyticsData,
            ...persistedState 
         } = state as StoreState;
         return persistedState;
       },
    }
  )
);
