import { UISlice } from './store/slices/uiSlice';
import { OperationalSlice } from './store/slices/operationalSlice';
import { MenuSlice } from './store/slices/menuSlice';
import { StaffSlice } from './store/slices/staffSlice';
import { FinanceSlice } from './store/slices/financeSlice';
import { AuthSlice } from './store/slices/authSlice';



import { Database } from './types/supabase';

export type AnyRecord = any;

export type Dish = Partial<Database['public']['Tables']['dishes']['Row']> & {
  id: string; // Ensure ID is always present
  name: string; // Ensure name is always present
  price: number; // Ensure price is always present
  track_stock?: boolean;
  stock_quantity?: number;
  stock?: number;
  min_stock_quantity?: number;
  max_stock_quantity?: number;
  unit?: string;
  supplier_id?: string;
  preparation_time?: number;
  is_available_on_digital_menu?: boolean;
  costPrice?: number;
  supplierId?: string;
  taxPercentage?: number;

  categoryId?: string;
  imageUrl?: string;
  image?: string; // Alias for imageUrl/image_url
  taxCode?: string;
  isActive?: boolean;
  available?: boolean;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  trackStock?: boolean;
  stockQuantity?: number;
  minStockQuantity?: number;
  maxStockQuantity?: number;
  preparationTime?: number;
  isAvailableOnDigitalMenu?: boolean;
};

export type Product = Dish;

export type MenuCategory = Partial<Database['public']['Tables']['menu_categories']['Row']> & {
  id: string; // Ensure ID is always present
  name: string; // Ensure name is always present
  parentId?: string;
  availableOnDigitalMenu?: boolean;
  isAvailableOnDigitalMenu?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  deletedAt?: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
};
export type Category = MenuCategory;
export type OrderItem = Partial<Database['public']['Tables']['order_items']['Row']> & {
  // Runtime / Local DB extensions
  dish_id?: string;
  dishId?: string; // CamelCase alias
  tax_amount?: number;
  taxAmount?: number; // CamelCase alias
  tax_percentage?: number;
  taxPercentage?: number; // CamelCase alias
  tax_code?: string;
  taxCode?: string; // CamelCase alias
  unit_price?: number;
  unitPrice?: number; // CamelCase alias
  price?: number; // Alias for unitPrice
  quantity?: number; // Ensure quantity is available
  notes?: string;
  status?: string;
};

export type OrderItemDetail = OrderItem & {
  dish?: Dish;
  product?: Dish;
  dishId?: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  taxPercentage: number;
  taxCode: string;
};

export interface SecurityAlert {
  id: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  message: string;
  timestamp: string;
  isResolved: boolean;
  type: string;
  details?: any;
}

export type UUID = string;

export type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier';
// export type Permission = string; // Removed duplicate

export interface CustomRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export type PaymentMethod = 'NUMERARIO' | 'TPA' | 'TRANSFERENCIA' | 'QR_CODE' | 'CONTA_CORRENTE' | 'SPLIT' | 'OTHER';



export interface OrderPayment {
  id?: any;
  method: PaymentMethod;
  amount: number;
  date?: string;
  timestamp?: string;
}

export type Order = Omit<Partial<Database['public']['Tables']['orders']['Row']>, 'created_at' | 'updated_at' | 'split_payments'> & {
  items?: (OrderItem & { dish?: Dish; product?: Dish })[];
  payments?: OrderPayment[];
  payment_method?: PaymentMethod;
  split_payments?: { method: PaymentMethod; amount: number }[];
  timestamp?: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
  customer_name?: string;
  customer_id?: UUID;
  order_number?: string;
  shift_id?: UUID;
  table_id?: string;
  invoice_number?: string;
  tax_total?: number;
  sub_account_name?: string;
  user_id?: UUID;
  user_name?: string;
  paymentCorrectionHistory?: PaymentCorrection[];
  
  // CamelCase aliases
  tableId?: number | string;
  taxTotal?: number;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  shiftId?: string;
  subAccountName?: string;
  invoiceNumber?: string;
  userId?: string;
  userName?: string;
  customerName?: string;
  orderNumber?: string | number;
  createdAt?: string | Date;
  splitPayments?: { method: PaymentMethod; amount: number }[];
  customerNif?: string;
  
  // Additional properties
  previous_hash?: string;
  jws_payload?: any;
  is_synced_agt?: boolean;
  agt_submission_uuid?: string;
  signature?: string;
  hash?: string;
};

export type Profile = AnyRecord;
export type Customer = AnyRecord;

export type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  created_at?: string; // Legacy support
  payment_method?: string; // Legacy support
};

export type Payment = AnyRecord;

export type Expense = Database['public']['Tables']['expenses']['Row'] & {
  paymentMethod?: PaymentMethod | string;
  payment_method?: PaymentMethod | string; // Legacy support
  supplier_id?: string; // Legacy support
  supplierId?: string; // CamelCase alias
  created_at?: string; // Legacy support
  date?: string | Date | null;
  paid?: boolean; // Runtime extension / legacy schema
};

export type FixedExpense = AnyRecord;

export type Supplier = Database['public']['Tables']['suppliers']['Row'];

export type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  // Add any other relevant fields if they appear in useStore or inventory page
  createdAt?: Date;
  updatedAt?: Date;
  minThreshold?: number;
};

export type Table = Database['public']['Tables']['restaurant_tables']['Row'] & {
  activeOrderIds?: string[]; // Runtime extension
  // Redundant overrides removed to allow nulls from DB
  /*
  seats?: number;
  width?: number;
  height?: number;
  shape?: string;
  rotation?: number;
  groupId?: string;
  label?: string;
  color?: string;
  userId?: string;
  */
};
export type TableZone = 'INTERIOR' | 'EXTERIOR' | 'BALCAO';
export type TableShape = 'RECTANGLE' | 'SQUARE' | 'CIRCLE';
export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'PAYMENT' | 'DIRTY' | 'MAINTENANCE';

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  metadata?: any;
  createdAt?: string | Date;
  userId?: string;
};
export type OfflineQueue = AnyRecord;

export interface Delivery {
  id: UUID;
  orderId: UUID;
  driverName: string;
  status: 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADA';
  address: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  endTime?: Date;
  [key: string]: any; // For flexibility with additional properties
}

export interface Reservation {
  id: UUID;
  tableId?: UUID;
  customerName: string;
  customerPhone: string;
  date: Date;
  time: string;
  guests: number;
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'CONCLUIDA';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Employee = Partial<Database['public']['Tables']['employees']['Row']> & {
  id: string;
  name: string;
  role: string;
  pin?: string | null;
  phone?: string | null;
  email?: string | null;
  nif?: string | null;
  address?: string | null;
  salary?: number | null;
  isActive?: boolean | null;
  admissionDate?: string | Date | null;
  socialSecurityNumber?: string | null;
  bankAccount?: string | null;
  bi?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  color?: string;
  workDaysPerMonth?: number | null;
  dailyWorkHours?: number | null;
  externalBioId?: string | null;
  is_active?: boolean | null;
  admission_date?: string | null;
  social_security_number?: string | null;
  bank_account?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  work_days_per_month?: number | null;
  daily_work_hours?: number | null;
  external_bio_id?: string | null;
  [key: string]: any;
};

export type Role = string;
export type Permission =
  | 'CREATE_ORDER'
  | 'EDIT_ORDER'
  | 'DELETE_ORDER'
  | 'PAY_ORDER'
  | 'VIEW_FINANCIAL'
  | 'MANAGE_USERS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_DELIVERIES'
  | 'VIEW_KITCHEN'
  | 'PRINT_BILL'
  | 'APPLY_DISCOUNT'
  | 'ACCESS_REPORTS'
  | 'MANAGE_TABLES'
  | 'MANAGE_RESERVATIONS'
  | 'MANAGE_EMPLOYEES'
  | 'QR_MENU_CONFIG'
  | 'BIOMETRIC_SYNC'
  | 'EXPORT_DATA'
  | 'VIEW_SYSTEM_HEALTH'
  | 'CLOSE_SHIFT'
  | 'CORRECT_PAYMENT_PRE_PRINT'
  | 'CORRECT_PAYMENT_POST_PRINT';

export type AttendanceRecord = Partial<Database['public']['Tables']['attendance_records']['Row']> & {
  id?: string;
  employeeId?: string | null;
  date?: string;
  clockIn?: Date | string | null;
  clockOut?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  clockInMethod?: string | null;
  clockOutMethod?: string | null;
  totalHours?: number | null;
  isLate?: boolean | null;
  lateMinutes?: number | null;
  overtimeHours?: number | null;
  isAbsence?: boolean | null;
  source?: string;
  status?: string;
  notes?: string;
};

export interface WorkShift {
  id: UUID;
  employeeId: UUID;
  // Planning/Schedule fields
  dayOfWeek?: number; // 1 (Mon) - 7 (Sun)
  startTime: Date | string; // Date for worked shifts, string "HH:mm" for schedule
  endTime: Date | string;   // Date for worked shifts, string "HH:mm" for schedule
  // Worked shift fields
  date?: Date;
  shiftType?: string;
  notes?: string;
  salesBreakdown?: Partial<Record<PaymentMethod, number>>;
  openingBalance?: number;
}

// --- Missing Types for Finance/Analytics ---

export interface DailySalesAnalytics {
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  averageTicket: number;
  date: string;
  totalProductCost?: number;
}

export interface MenuAnalytics {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface DailyAnalytics {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProductCost?: number;
  netProfit: number;
  paymentMethods?: Record<string, number>;
  topDishes?: MenuAnalytics[];
  lastUpdated?: string;
}

export interface RealtimePayload<T> {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  commit_timestamp: string;
  errors: null | any[];
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  activeOrders: number;
}

export interface IntegrityIssue {
  id: UUID;
  severity: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  entityType?: 'DISH' | 'CATEGORY' | 'ORDER' | 'EMPLOYEE' | 'TABLE' | 'STOCK_ITEM';
  entityId?: UUID;
  type?: 'INVALID_CATEGORY' | 'NO_IMAGE' | 'DUPLICATE_ID' | 'NEGATIVE_PRICE' | 'LOOP_REFERENCE' | 'INTEGRITY_CHECK';
  timestamp?: number;
  isResolved?: boolean;
  data?: AnyRecord;
}

export interface Analytics {
  [key: string]: any;
}

export interface AIAnalysisResult {
  [key: string]: any;
}

export interface AIMonthlyReport {
  month: string;
  totalRevenue: number;
  topSellingItem: string;
  strategicAdvice: string;
  operationalEfficiency: string;
  customerSentiment: string;
}

export interface PedidoPayload {
  [key: string]: any;
}

export interface DailyAnalyticsPayload {
  [key: string]: any;
}

export interface Revenue {
  id: string;
  amount: number;
  date: string | Date;
  description?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  created_at?: string;
  updatedAt?: string;
  orderId?: string; // Link to order if applicable
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  amount: number;
  date: string | Date;
  paymentMethod: PaymentMethod;
  month: number;
  year: number;
  status: string;
  // Runtime / Legacy fields
  netSalary?: number;
  paymentDate?: string | Date;
  baseSalary?: number;
  notes?: string;
}

export type CashShift = AnyRecord;
export type User = AnyRecord;
export type LayoutBackup = AnyRecord;

export interface FinancialClearanceReport {
  timestamp: string;
  user: UUID;
  reason: string;
  authorizedBy: UUID;
  clearedOrders: number;
  clearedExpenses: number;
  clearedRevenues: number;
  clearedPayroll: number;
  summary: {
    ordersCount: number;
    expensesCount: number;
    fixedExpensesCount: number;
    revenuesCount: number;
    payrollCount: number;
    totalRevenue: number;
    totalExpenses: number;
  };
  error?: string;
}

export interface FinancialBackupData {
  timestamp: string;
  orders: Order[];
  expenses: Expense[];
  revenues: Revenue[];
  payroll: PayrollRecord[];
  // Add others as needed
  [key: string]: any;
}

export interface SupabaseSyncStatus {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastErrorAt: string | null;
  errorMessage: string | null;
  retries: number;
}

export type PaymentCorrection = any;
export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  createdAt: Date | string;
  lastUsed?: Date | string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | string;
  scopes: string[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  createdAt?: Date | string;
  lastTriggered?: Date | string;
  failureCount?: number;
  status?: 'ACTIVE' | 'DISABLED' | string;
}

export interface BiometricDevice {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  port: number;
  apiKey?: string;
  status?: 'CONNECTED' | 'DISCONNECTED' | string;
  lastSync?: Date | string;
  syncInterval?: number;
}

export interface MobileSession {
  id: string;
  userId: string;
  token: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  lastActive: Date | string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | string;
}

export interface BiometricClockEvent {
  id: string;
  deviceId: string;
  externalBioId: string;
  clockTime: Date | string;
  type: string;
  temperature?: number;
  processed?: boolean;
  processedAt?: Date | string;
  linkedAttendanceId?: string;
}
export interface StoreState extends MenuSlice, StaffSlice, FinanceSlice, AuthSlice, UISlice, OperationalSlice {
  addAuditLog: (log: any) => void;
  suppliers: Fornecedor[];
  supabaseSyncStatus: SupabaseSyncStatus;
  activeTableId: string | null;
  shifts: WorkShift[];
  stock: StockItem[];
  attendance: AttendanceRecord[];
  employees: Employee[];
  notifications: Notification[];
  users: User[];
  payroll: PayrollRecord[];
  loyaltyRewards: any[];
  dailyAnalyticsData: DailySalesAnalytics | null;
  menuAccessLogs: MenuAccessLog[];
  integrationLogs: IntegrationLog[];
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  isInitialized: boolean;
  initializeStore: () => Promise<void>;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setDailyAnalyticsData: (data: DailySalesAnalytics | null) => void;
  getMenuAccessStats: () => MenuAccessAggregatedStats;
  clearMenuAccessLogs: () => void;
  logMenuAccess: (log: MenuAccessLog) => void;
  addIntegrationLog: (log: any) => void;
  setShifts: (shifts: any[]) => void;
  setAttendance: (records: any[]) => void;
  setEmployees: (employees: any[]) => void;
  setRevenues: (revenues: Revenue[]) => void;
  addNotification: (type: any, message: string, duration?: number) => void;
  onRealtimeChange: (payload: any) => void;
  isDiagnosing: boolean;
  integrityIssues: IntegrityIssue[];
  auditLogs: AuditLog[];
  updateOrderItemStatus: (orderId: string, itemIndex: number, status: string) => void;
  markOrderAsServed: (orderId: string) => void;
}

export type FullApplicationState = StoreState;

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // Add duration here as it's used in useStore
}

export interface SystemSettings {
  id: string;
  restaurantName: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
  appLogoUrl: string | null;
  taxPercentage: number;
  currency: string;
  timezone: string;
  language: string;
  // Supabase
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
    autoSync: boolean;
  };
  // Printer
  printerConfig?: {
    enabled: boolean;
    name: string;
    paperSize: string;
  };
  // Backup
  backupConfig?: {
    enabled: boolean;
    interval: string;
    location: string;
  };
  // Others
  agtCertificate?: string;
  openDrawerCode?: string;
  adminPin?: string;
  apiToken?: string;
  wifi_name?: string;
  wifi_password?: string;
  qr_code_title?: string;
  qr_code_subtitle?: string;
  qr_code_short_code?: string;
  qr_menu_url?: string;
  qr_menu_cloud_url?: string;
  logo_url?: string;
  name?: string;
  legacyTotalRevenue?: number;
  
  [key: string]: any;
}

export type Fornecedor = Supplier & {
  nome?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
  categoria?: string;
};
export type IntegrationLog = any;

export interface CustomerDisplayEvent {
  type: 'order_update' | 'status_change' | 'new_order' | 'clear_display' | string;
  order?: Order; // Assuming it might carry order information
  message?: string;
  // Add other properties as needed
  [key: string]: any;
}

export interface MenuAccessLog {
  id?: string;
  date: string;
  type: string;
  timestamp: string;
  tableId?: string;
  ip?: string;
  userAgent?: string;
}

export interface MenuAccessAggregatedStats {
  total: number;
  todayAccesses: number;
  publicMenus: number;
  tableMenus: number;
  uniqueVisitors: number;
  averageAccessPerDay: number;
  peakAccessTime: string;
  mostAccessedMenu: string;
}

export interface QRScanData {
  rawValue: string;
  format?: string;
  [key: string]: any;
}

export type QRScanResult = QRScanData | QRScanData[] | string;

export interface MenuAccessStats {
  // Deprecated, kept for backward compatibility if needed, but should be removed
  date: string;
  totalAccesses: number;
  uniqueAccesses: number;
  qrCodeScans: number;
  type: string;
  timestamp: string;
  tableId?: string;
}

export interface BackupData {
    version: string;
    timestamp: string;
    checksum?: string;
    source: 'tasca-do-vereda-system';
    data: {
        menu?: Dish[];
        categories?: MenuCategory[];
        orders?: Order[];
        expenses?: Expense[];
        revenues?: Revenue[];
        users?: User[];
        employees?: Employee[];
        attendance?: AttendanceRecord[];
        stock?: StockItem[];
        suppliers?: Fornecedor[];
        settings?: any;
        [key: string]: any;
    };
}
