import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { logger } from '@/services/logger';
import { databaseOperations } from '@/services/database/operations';
import { integrationAPIService } from '@/services/integrationAPIService';
import { createMenuSlice } from './slices/menuSlice';
import { createStaffSlice } from './slices/staffSlice';
import { createFinanceSlice } from './slices/financeSlice';
import { createAuthSlice } from './slices/authSlice';
import { createOperationalSlice } from './slices/operationalSlice';
import { createUISlice } from './slices/uiSlice';
import { 
  StoreState, 
  IntegrationLog, 
  Product, 
  MenuCategory, 
  Employee, 
  AttendanceRecord, 
  PayrollRecord, 
  Revenue, 
  Expense, 
  DashboardSummary, 
  DailyAnalyticsPayload,
  Order,
  SystemSettings,
  RealtimePayload,
  Fornecedor
} from '../types';
import { MOCK_USERS } from '@/constants';

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
      products: [] as any[],
      categories: [] as any[],
      ...createStaffSlice(set, get, api),
      ...createFinanceSlice(set, get, api),
      ...createAuthSlice(set, get, api),
      ...createOperationalSlice(set, get, api),
      ...createUISlice(set, get, api),

      // Override updateSettings to include Sync logic
      updateSettings: (newSettings: Partial<SystemSettings>) => {
        const currentSettings = get().settings;
        set((state) => {
            const updated = { ...state.settings, ...newSettings };
            databaseOperations.saveSettings(updated).catch((e: any) => logger.error('Failed to save settings to DB', { error: (e as Error).message }, 'DATABASE'));
            
            // Sync to Supabase if enabled
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

      // Legacy/Root State
      isInitialized: false,
      initializeStore: async () => {
        set({ isInitialized: true });
      },
      isMobileMenuOpen: false,
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      users: MOCK_USERS,
      payroll: [], 
      loyaltyRewards: [],
      dailyAnalyticsData: null,
      setDailyAnalyticsData: (data) => set({ dailyAnalyticsData: data }),
      
      // Menu Access Logs
      menuAccessLogs: [],
      getMenuAccessStats: () => {
        const logs = get().menuAccessLogs || [];
        const now = new Date();
        const todayStr = now.toDateString();
        const total = logs.length;
        const todayAccesses = logs.filter((log: any) => new Date(log.timestamp).toDateString() === todayStr).length;
        return { 
          total, 
          todayAccesses, 
          publicMenus: 0, 
          tableMenus: 0, 
          uniqueVisitors: 0, 
          averageAccessPerDay: 0, 
          peakAccessTime: '', 
          mostAccessedMenu: '' 
        };
      },

      // Integration Logs
      integrationLogs: [],
      addIntegrationLog: (log: any) => set((state) => {
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
        // Use type assertion or default empty array to handle potential undefined
        const currentLogs = state.integrationLogs || [];
        return { integrationLogs: [newLog, ...currentLogs].slice(0, 100) };
      }),

      // Suppliers
      suppliers: [],
      setSuppliers: (suppliers: Fornecedor[]) => set({ suppliers }),
      addSupplier: (supplier: Fornecedor) => {
        set((state) => ({ suppliers: [...(state.suppliers || []), supplier] }));
        databaseOperations.saveSupplier(supplier);
      },
      updateSupplier: (supplier: Fornecedor) => {
        set((state) => ({ suppliers: (state.suppliers || []).map((s: Fornecedor) => s.id === supplier.id ? supplier : s) }));
        databaseOperations.saveSupplier(supplier);
      },
      removeSupplier: (id: string) => {
        set((state) => ({ suppliers: (state.suppliers || []).filter((s: Fornecedor) => s.id !== id) }));
      },

      // Realtime Sync
      onRealtimeChange: (payload: any) => { // Using any temporarily as RealtimePayload might not cover all cases yet
        logger.info(`Realtime change received for table: ${payload.tableName}, event: ${payload.eventType}`, payload, 'STORE');
        const state = get();
        switch (payload.tableName) {
          case 'products':
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const p = payload.new as any;
              const product: Product = {
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                category_id: p.category_id,
                image_url: p.image,
                tax_code: p.tax_code,
                tax_percentage: p.tax_percentage,
                is_active: p.is_available,
                is_available_on_digital_menu: p.is_available_on_digital_menu
              } as Product;
              
              if (payload.eventType === 'INSERT') state.addProduct(product);
              if (payload.eventType === 'UPDATE') state.updateProduct(product);
            }
            if (payload.eventType === 'DELETE') state.removeProduct(payload.old.id as string);
            break;
            
          case 'categories':
            if (payload.eventType === 'INSERT') state.addCategory(payload.new as unknown as MenuCategory);
            if (payload.eventType === 'UPDATE') state.updateCategory(payload.new as unknown as MenuCategory);
            if (payload.eventType === 'DELETE') state.removeCategory(payload.old.id as string);
            break;
            
          case 'orders':
            if (payload.eventType === 'INSERT') state.addOrder(payload.new as unknown as Order);
            if (payload.eventType === 'UPDATE') state.updateOrder(payload.new as unknown as Order);
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
      
      // Default Properties
      isDiagnosing: false,
      integrityIssues: [],
      lastSync: null,
      syncError: null,
      saveStatus: 'SAVED',
      supabaseSyncStatus: { isConnected: false, status: 'disconnected', lastErrorAt: null, errorMessage: null, retries: 0 }
    }),
    {
      name: 'tasca-store',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        menu: state.menu,
        categories: state.categories,
        tables: state.tables,
        settings: state.settings,
        users: state.users,
        suppliers: state.suppliers,
        stock: state.stock,
        orders: state.orders,
        activeOrders: state.activeOrders,
        customers: state.customers,
        reservations: state.reservations,
        shifts: state.shifts,
        employees: state.employees,
        payroll: state.payroll,
        expenses: state.expenses
      })
    }
  )
);
