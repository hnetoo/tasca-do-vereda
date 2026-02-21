import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { logger } from '@/services/logger';

import { saveSettingsAction, saveSupplierAction } from '@/app/actions';
import { integrationAPIService } from '@/services/integrationAPIService';
import { createMenuSlice } from './slices/menuSlice';
import { createStaffSlice } from './slices/staffSlice';
import { createFinanceSlice } from './slices/financeSlice';
import { createAuthSlice } from './slices/authSlice';
import { createOperationalSlice } from './slices/operationalSlice';
import { getTablesAction } from '@/app/actions/operational';
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
  StoreState
} from '../types';
import { MOCK_USERS } from '@/constants';
import { supabaseService } from '@/services/supabaseService';

const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem(name); } catch { return null; }
    }



    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(name, value); } catch { }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(name); } catch { }
    }
  },
};

export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createMenuSlice(set, get, api),
      ...createStaffSlice(set, get, api),
      ...createFinanceSlice(set, get, api),
      ...createAuthSlice(set, get, api),
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
            saveSettingsAction(updated).catch((e: any) => logger.error('Failed to save settings to DB', { error: (e as Error).message }, 'DATABASE'));
            
            logger.info('Supabase config for sync:', { config: updated.supabaseConfig }, 'STORE');
            logger.info('IntegrationAPIService is connected:', { isConnected: integrationAPIService.isConnected() }, 'STORE');

            // Check if Supabase environment variables are available
            const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
                        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
          // Load menu data from server actions
          const success = await get().loadFromSQLExclusively();
          if (!success) {
             const state = get();
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
          const { success: usersSuccess, data: fetchedUsers, error: usersError } = await supabaseService.fetchUsers();
          if (usersSuccess && fetchedUsers) {
            set({ users: fetchedUsers });
            logger.info('Users fetched from Supabase and updated in store.', { count: fetchedUsers.length }, 'STORE');
          } else {
            logger.error('Failed to fetch users from Supabase.', { error: usersError }, 'STORE');
            get().addNotification('error', 'Falha ao carregar utilizadores. A aplicação pode não funcionar corretamente.');
          }

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


      setShifts: (shifts: any[]) => set({ shifts }),
      setAttendance: (records: any[]) => set({ attendance: records }),
      setEmployees: (employees: any[]) => set({ employees }),
      addAuditLog: (log: any) => console.log('Audit log:', log),
      addNotification: (type: Notification['type'], message: string, duration?: number) => {
        const autoDismissDuration = duration || 2500; // Reduced to 2.5s for faster dismissal
        const newNotification = { id: Date.now().toString(), type, message, duration: autoDismissDuration };
        set((state: StoreState) => ({ notifications: [...(state.notifications || []), newNotification] }));
        
        setTimeout(() => {
          set((state: any) => ({
            notifications: (state.notifications || []).filter((n: any) => n.id !== newNotification.id)
          }));
        }, autoDismissDuration);
      },  

      setSuppliers: (suppliers: Fornecedor[]) => set({ suppliers }),
      addSupplier: (supplier: Fornecedor) => {
        set((state: StoreState) => ({ suppliers: [...(state.suppliers || []), supplier] }));
        saveSupplierAction(supplier);
      },
      updateSupplier: (supplier: Fornecedor) => {
        set((state: StoreState) => ({ suppliers: (state.suppliers || []).map((s: Fornecedor) => s.id === supplier.id ? supplier : s) }));
        saveSupplierAction(supplier);
      },
      removeSupplier: (id: string) => {
        set((state: StoreState) => ({ suppliers: (state.suppliers || []).filter((s: Fornecedor) => s.id !== id) }));
      },

      onRealtimeChange: (payload: any) => {
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
                createdAt: p.created_at ? new Date(p.created_at) : null,
                updatedAt: p.updated_at ? new Date(p.updated_at) : null,
              };
              
              if (payload.eventType === 'INSERT') state.addDish(dish);
              if (payload.eventType === 'UPDATE') state.updateDish(dish);
            }
            if (payload.eventType === 'DELETE') state.removeDish(payload.old.id as string);
            break;
            
          case 'categories':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const c = payload.new as any;
              const category: Category = {
                ...c, // Spread all properties from payload.new
                parentId: c.parent_id,
                availableOnDigitalMenu: c.is_available_on_digital_menu,
                createdAt: c.created_at ? new Date(c.created_at) : null,
                updatedAt: c.updated_at ? new Date(c.updated_at) : null,
              };
              if (payload.eventType === 'INSERT') state.addCategory(category);
              if (payload.eventType === 'UPDATE') state.updateCategory(category);
            }
            if (payload.eventType === 'DELETE') state.removeCategory(payload.old.id as string);
            break;
            
          case 'orders':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const o = payload.new as any;
              const order: Order = {
                ...o, // Spread all properties from payload.new
                tableId: o.table_id,
                userId: o.user_id,
                userName: o.user_name,
                customerNif: o.customer_nif,
                customerId: o.customer_id,
                shiftId: o.shift_id,
                subAccountName: o.sub_account_name,
                invoiceNumber: o.invoice_number,
                previousHash: o.previous_hash,
                jwsPayload: o.jws_payload,
                isSyncedAgt: o.is_synced_agt,
                agtSubmissionUuid: o.agt_submission_uuid,
                createdAt: o.created_at ? new Date(o.created_at) : null,
                updatedAt: o.updated_at ? new Date(o.updated_at) : null,
                closedAt: o.closed_at ? new Date(o.closed_at) : null,
                paymentMethod: o.payment_method,
                splitPayments: o.split_payments,
                customerName: o.customer_name,
                // Runtime fields
                items: [],
                payments: []
              };
              if (payload.eventType === 'INSERT') state.addOrder(order);
              if (payload.eventType === 'UPDATE') state.updateOrder(order);
            }
            if (payload.eventType === 'DELETE') state.removeOrder(payload.old.id as string);
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
