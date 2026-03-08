import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import { 
  createMenuSlice 
} from './slices/menuSlice';
import { 
  createStaffSlice 
} from './slices/staffSlice';
import { 
  createFinanceSlice 
} from './slices/financeSlice';
import { 
  createOperationalSlice 
} from './slices/operationalSlice';
import { 
  createUISlice 
} from './slices/uiSlice';
import { 
  createIntegrationsSlice 
} from './slices/integrationsSlice';
import {
  Order,
  Table,
  Dish,
  Employee,
  OrderItem,
  OrderPayment,
  PaymentMethod,
  MenuCategory,
  StockItem,
  Revenue,
  Expense,
  Customer,
  Supplier,
  UUID,
  MenuAnalytics,
  DashboardSummary,
  Analytics,
  MenuAccessLog,
  MenuAccessAggregatedStats,
  IntegrityIssue,
  WorkShift,
  AttendanceRecord,
  SystemSettings,
  SupabaseSyncStatus,
  Notification,
  AuditLog,
  Permission
} from '@/types';

// Custom storage implementation to handle localStorage errors
class SafeLocalStorageStorage implements StateStorage {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  }

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
}

// Create a simplified store that works with all slices
export const useStore = create<any>()(
  persist(
    (set, get) => ({
      // Menu slice
      ...createMenuSlice(set, get, {} as any),
      
      // Staff slice
      ...createStaffSlice(set, get, {} as any),
      
      // Finance slice
      ...createFinanceSlice(set, get, {} as any),
      
      // Operational slice
      ...createOperationalSlice(set, get, {} as any),
      
      // UI slice
      ...createUISlice(set, get, {} as any),
      
      // Integrations slice
      ...createIntegrationsSlice(set, get, {} as any),
      
      // Legacy state that doesn't break the build
      supabaseSyncStatus: {
        isConnected: false,
        status: 'disconnected',
        lastErrorAt: null,
        errorMessage: null,
        retries: 0
      },
      setSupabaseSyncStatus: (status: SupabaseSyncStatus) => set({ supabaseSyncStatus: status }),
      
      databaseConfig: undefined,
      setDatabaseConfig: (config: any) => set({ databaseConfig: config }),
      
      notifications: [],
      addNotification: (type: string, message: string) => {
        const notification: Notification = {
          id: crypto.randomUUID() as UUID,
          type: type as any,
          message
        };
        set((state: any) => ({ notifications: [notification, ...state.notifications].slice(0, 50) }));
      },
      
      auditLogs: [],
      addAuditLog: (log: AuditLog) => set((state: any) => ({ auditLogs: [log, ...state.auditLogs].slice(0, 1000) })),
      
      cartItems: [], // ✅ Adicionar cartItems ao estado principal
      setCartItems: (items: OrderItem[]) => set({ cartItems: items }),
      
      integrationLogs: [],
      addIntegrationLog: (log: any) => set((state: any) => ({ integrationLogs: [log, ...state.integrationLogs].slice(0, 1000) })),
      
      settings: {} as SystemSettings,
      updateSettings: (newSettings: Partial<SystemSettings>) => 
        set((state: any) => ({ settings: { ...state.settings, ...newSettings } })),
      
      user: null,
      setUser: (user: any) => set({ user }),
      
      isLoading: false,
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      
      error: null,
      setError: (error: string | null) => set({ error }),
      
      // Initialize store with data from server actions
      initializeStore: async () => {
        try {
          set({ isLoading: true });
          console.log('🔄 Initializing store...');
          
          // TODO: Implementar inicialização quando métodos estiverem disponíveis
          console.log('Store initialization completed');
          
        } catch (error: any) {
          console.error('Failed to initialize store:', error);
          get().setError('Failed to initialize application');
        } finally {
          get().setIsLoading(false);
        }
      },
    }),
    {
      name: 'tasca-store',
      storage: new SafeLocalStorageStorage() as any,
      partialize: (state: any) => ({
        settings: state.settings,
        user: state.user,
        // Only persist essential data
      }),
    }
  )
);

export type StoreState = ReturnType<typeof useStore.getState>;
