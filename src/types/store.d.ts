import { MenuSlice } from '../store/slices/menuSlice';
import { StaffSlice } from '../store/slices/staffSlice';
import { FinanceSlice } from '../store/slices/financeSlice';
import { AuthSlice } from '../store/slices/authSlice';
import { OperationalSlice } from '../store/slices/operationalSlice';
import { UISlice } from '../store/slices/uiSlice';
import { 
  SystemSettings, 
  IntegrationLog, 
  DailySalesAnalytics, 
  UUID,
  Notification,
  Fornecedor,
  SupabaseSyncStatus
} from './index'; // Assuming index.ts exports these common types

// Combine all slice interfaces
export interface StoreState extends 
  MenuSlice, 
  StaffSlice, 
  FinanceSlice, 
  AuthSlice, 
  OperationalSlice, 
  UISlice 
{
  // Root State Properties from useStore.ts
  supabaseSyncStatus: SupabaseSyncStatus;
  activeTableId: UUID | null;
  shifts: any[]; // Defined in OperationalSlice, but also initialized here
  stock: any[]; // Defined in OperationalSlice, but also initialized here
  attendance: any[]; // Defined in StaffSlice, but also initialized here
  employees: any[]; // Defined in StaffSlice, but also initialized here
  notifications: Notification[]; // Defined in UISlice, but also initialized here
  users: any[]; // Defined in AuthSlice, but also initialized here
  payroll: any[]; // Defined in FinanceSlice, but also initialized here
  loyaltyRewards: any[];
  dailyAnalyticsData: DailySalesAnalytics | null;
  menuAccessLogs: any[];
  integrationLogs: IntegrationLog[];
  suppliers: Fornecedor[]; // Defined in OperationalSlice, but also initialized here
  
  isInitialized: boolean;
  isMobileMenuOpen: boolean;

  // Root State Actions from useStore.ts
  updateSettings: (newSettings: Partial<SystemSettings>) => void; // Defined in UISlice, but also here
  initializeStore: () => Promise<void>;
  toggleMobileMenu: () => void;
  setDailyAnalyticsData: (data: DailySalesAnalytics | null) => void;
  getMenuAccessStats: () => { 
    total: number; 
    todayAccesses: number; 
    publicMenus: number; 
    tableMenus: number; 
    uniqueVisitors: number; 
    averageAccessPerDay: number; 
    peakAccessTime: string; 
    mostAccessedMenu: string; 
  };
  addIntegrationLog: (log: IntegrationLog) => void;
  setShifts: (shifts: any[]) => void; // Defined in OperationalSlice, but also here
  setAttendance: (records: any[]) => void; // Defined in StaffSlice, but also here
  setEmployees: (employees: any[]) => void; // Defined in StaffSlice, but also here
  addAuditLog: (log: any) => void; // This was a function, not a state property
  addNotification: (type: Notification['type'], message: string, duration?: number) => void; // Defined in UISlice, but also here
  setSuppliers: (suppliers: Fornecedor[]) => void; // Defined in OperationalSlice, but also here
  addSupplier: (supplier: Fornecedor) => void; // Defined in OperationalSlice, but also here
  updateSupplier: (supplier: Fornecedor) => void; // Defined in OperationalSlice, but also here
  removeSupplier: (id: string) => void; // Defined in OperationalSlice, but also here
  onRealtimeChange: (payload: any) => void;
}
