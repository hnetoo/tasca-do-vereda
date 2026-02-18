export type AnyRecord = any;

export type UUID = string;

export type PaymentMethod = 'CASH' | 'CARD' | 'MULTIBANCO' | 'MBWAY' | 'TRANSFER' | 'OUTRO' | 'NUMERARIO' | 'TPA' | 'TRANSFERENCIA' | 'QR_CODE' | 'CONTA_CORRENTE';

export interface OrderPayment {
  id?: any;
  method: PaymentMethod;
  amount: number;
  date?: string;
  timestamp?: string;
}

export type Profile = AnyRecord;
export type Category = AnyRecord;
export type Customer = AnyRecord;
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  created_at: string;
  category?: string;
  payment_method?: string;
}

export interface Order {
  id: string;
  tableId?: number;
  table_id?: number; // For Supabase compatibility
  status: string;
  timestamp: Date | string; // ISO date string
  total: number;
  subtotal?: number; // New property
  taxTotal?: number;
  tax_total?: number; // For Supabase compatibility
  paymentMethod?: PaymentMethod;
  payment_method?: PaymentMethod; // For Supabase compatibility
  customerId?: string;
  customer_id?: string; // For Supabase compatibility
  shiftId?: string;
  shift_id?: string; // For Supabase compatibility
  subAccountName?: string;
  sub_account_name?: string; // For Supabase compatibility
  invoiceNumber?: string;
  invoice_number?: string; // For Supabase compatibility
  orderNumber?: number | string;
  order_number?: number | string; // For Supabase compatibility
  hash?: string;
  previous_hash?: string;
  signature?: string;
  jws_payload?: string;
  isSyncedAgt?: boolean;
  is_synced_agt?: boolean; // For Supabase compatibility
  agtSubmissionUuid?: string;
  agt_submission_uuid?: string; // For Supabase compatibility
  userId?: string;
  user_id?: string; // For Supabase compatibility
  userName?: string;
  user_name?: string; // For Supabase compatibility
  customerName?: string; // New property
  customer_name?: string; // For Supabase compatibility
  employeeId?: string; // New property
  employee_id?: string; // For Supabase compatibility
  customerNif?: string; // New property for customer tax ID
  customer_nif?: string; // For Supabase compatibility
  isPaid?: boolean; // New property for payment status
  createdAt?: Date | string; // New property for creation timestamp
  created_at?: string; // For Supabase compatibility
  updatedAt?: Date | string; // New property for update timestamp
  type?: string; // New property
  items?: OrderItem[];
  payments?: OrderPayment[];
  paymentCorrectionHistory?: PaymentCorrection[]; // Added property
  splitPayments?: any[];
}
export interface OrderItem {
  id?: string; // Optional, as it might be auto-generated
  orderId?: string; // Optional, set when part of an order
  order_id?: string; // For Supabase compatibility
  productId: string; // Renamed from dishId
  product_id?: string; // For Supabase compatibility
  quantity: number;
  unitPrice: number;
  unit_price?: number; // For Supabase compatibility
  taxAmount?: number;
  tax_amount?: number; // For Supabase compatibility
  taxPercentage?: number;
  tax_percentage?: number; // For Supabase compatibility
  taxCode?: string;
  tax_code?: string; // For Supabase compatibility
  notes?: string;
  status?: string;
}
export type Payment = AnyRecord;
export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date | string; // ISO date string
  category: string;
  paymentMethod?: PaymentMethod; // New property
  payment_method?: PaymentMethod; // For Supabase compatibility
  notes?: string; // New property
  supplierId?: string; // New property
  supplier_id?: string; // For Supabase compatibility
  status?: string;
  createdAt?: Date | string; // New property
  created_at?: string; // For Supabase compatibility
  updatedAt?: Date | string;
}
export type FixedExpense = AnyRecord;
export type Supplier = AnyRecord;
export type Table = AnyRecord;
export type TableZone = 'INTERIOR' | 'EXTERIOR' | 'BALCAO';
export type AuditLog = AnyRecord;
export type OfflineQueue = AnyRecord;
export interface Employee {
  id: string;
  name: string;
  role: string;
  phone?: string;
  salary?: number;
  status?: string;
  color?: string;
  workDaysPerMonth?: number;
  dailyWorkHours?: number;
  externalBioId?: string;
  email?: string;
  admissionDate?: string;
  active?: boolean;
  nif?: string;
  socialSecurityNumber?: string;
  bankAccount?: string;
  bi?: string;
  [key: string]: any;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  clockInMethod: string;
  clockOutMethod?: string;
  totalHours?: number;
  isLate?: boolean;
  lateMinutes?: number;
  overtimeHours?: number;
  isAbsence?: boolean;
  source?: string;
  status?: string;
  notes?: string;
  [key: string]: any;
}
export type Fornecedor = AnyRecord;

export interface DailyAnalytics {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProductCost: number;
}

export interface PedidoPayload {
  eventType: 'INSERT' | 'UPDATE';
  new: { 
    id: UUID; 
    status: string; 
    kitchen_status: string; 
    payment_status: string; 
    delivery_status: string; 
    table_id: number; 
    created_at: string; 
    updated_at: string; 
    [key: string]: unknown 
  };
  old: { id: UUID; status: string; [key: string]: unknown };
  schema: 'public';
  table: 'pedidos';
  commit_timestamp: string;
}

export interface DailyAnalyticsPayload {
  eventType: 'UPDATE';
  new: { 
    date: string; 
    total_revenue: number; 
    total_expenses: number; 
    total_product_cost: number; 
    total_orders: number; 
    net_profit: number; 
    [key: string]: unknown 
  };
  old: { date: string; total_revenue: number; total_expenses: number; total_product_cost: number; total_orders: number; net_profit: number; [key: string]: unknown };
  schema: 'public';
  table: 'daily_analytics';
  commit_timestamp: string;
}

export type RealtimePayload = PedidoPayload | DailyAnalyticsPayload;

export interface SupabaseSyncStatus {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'retrying' | 'error';
  lastErrorAt: number | null;
  errorMessage: string | null;
  retries: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface SecurityAlert {
  id: string;
  type: 'unauthorized_access' | 'suspicious_activity' | 'system_error' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  source?: string;
  details?: any;
  resolved?: boolean;
}

export interface StoreState {
  // Auth Slice
  isAuthenticated: boolean;
  currentUser?: User | null;
  login: (pin: string, userId?: UUID, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  users: User[];
  setUsers: (users: User[]) => void;
  
  // Operational Slice
  settings: SystemSettings;
  isInitialized: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  tables: Table[];
  activeTableId: number | null;
  shifts: any[]; // Using any for now as Shift interface is not imported
  stock: StockItem[]; // Added stock
  attendance: AttendanceRecord[]; // Added attendance
  employees: Employee[]; // Added employees
  setShifts: (shifts: any[]) => void;
  setAttendance: (records: AttendanceRecord[]) => void; // Added setAttendance
  setEmployees: (employees: Employee[]) => void; // Added setEmployees
  addAuditLog: (log: AuditLog) => void;
  notifications: Notification[];
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number) => void;
  triggerSync?: () => Promise<void>; // Added triggerSync

  // Menu Slice
  products: Product[];
  categories: MenuCategory[];
  importCloudItems: (data: { categories: MenuCategory[], dishes: Product[], preferCloud: boolean }) => Promise<void>;
  validateMenuIntegrity: (categories: MenuCategory[], products: Product[]) => { isValid: boolean; issues: IntegrityIssue[] };
  runIntegrityDiagnostics: () => Promise<void>;
  integrityIssues?: IntegrityIssue[];
  isDiagnosing?: boolean;
  addIntegrationLog?: (log: IntegrationLog) => void;

  // Analytics Slice
  dailyAnalyticsData: DailyAnalyticsPayload['new'] | null;
  setDailyAnalyticsData: (data: DailyAnalyticsPayload['new'] | null) => void;
  supabaseSyncStatus: SupabaseSyncStatus;
  
  // Finance Slice
  orders: Order[];
  activeOrders: Order[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  revenues: Revenue[];
  payroll: PayrollRecord[];
  activeOrderId: UUID | null;
  dashboardSummary: DashboardSummary | null;
  dashboardAnalytics: Analytics | null;
  setActiveOrder: (id: UUID | null) => void;
  setDashboardSummary: (summary: DashboardSummary) => void;
  setDashboardAnalytics: (analytics: Analytics) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (id: UUID) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (id: UUID) => void;
  addRevenue: (revenue: Revenue) => void;
  removeRevenue: (id: UUID) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  updateFixedExpense: (expense: FixedExpense) => void;
  removeFixedExpense: (id: UUID) => void;
  addPayrollRecord: (record: PayrollRecord) => void;
  updatePayrollRecord: (record: PayrollRecord) => void;
  removePayrollRecord: (id: UUID) => void;
  setOrders: (orders: Order[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setPayroll: (payroll: PayrollRecord[]) => void;
  getLoyaltyTier: (customerId: UUID) => string;
  processPayroll: (employeeId: UUID, month: number, year: number, paymentMethod: PaymentMethod) => Promise<void>;
  createFullFinancialBackup: () => Promise<boolean>;
  restoreFullFinancialBackup: () => Promise<boolean>;
  clearFinancialData: (reason: string, userId: UUID) => Promise<{ success: boolean; report: FinancialClearanceReport }>;
  correctPayment: (orderId: UUID, newPayments: OrderPayment[], reason: string) => Promise<boolean>;
  getDailySalesAnalytics: (date: Date) => DailySalesAnalytics;
  getMenuAnalytics: (period: 'day' | 'week' | 'month') => MenuAnalytics[];
  getRevenueHistory: (days?: number) => Array<{ date: string; totalRevenue: number }>;
  syncFinancialMetricsToDashboard: () => Promise<void>;
  fetchRemoteDashboard: () => Promise<void>;
  handleRealtimeUpdate: (payload: any) => void;
  addToOrder: (tableId: number, product: Product, quantity: number, notes: string, orderId: UUID) => void;
  removeFromOrder: (orderId: UUID, itemIndex: number) => void;
  checkoutTable: (orderId: UUID, payments: OrderPayment[], subAccountName?: string, customerNif?: string) => Promise<void>;

  // Allow other properties (temporary fix for incomplete types)
  [key: string]: any;
}

// Updated Product interface to match 'products' table
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  image_url?: string;
  tax_code: string;
  tax_percentage: number;
  is_active: boolean; // mapped to is_available
  is_available_on_digital_menu: boolean;
  preparation_time?: number; // mapped to tempo_preparo
  track_stock?: boolean; // mapped to controla_estoque
  stock_quantity?: number; // mapped to quantidade_estoque
  min_stock_quantity?: number; // mapped to quantidade_minima
  max_stock_quantity?: number; // mapped to quantidade_maxima
  unit?: string; // mapped to unidade_medida
  supplier_id?: string; // mapped to fornecedor_padrao_id
  
  // Legacy/Compatibility fields (optional)
  categoryName?: string;
  cost?: number; // preco_custo
  sort_order?: number;
  allergens?: string[];
  notes?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
  is_active: boolean;
  parent_id?: string;
  is_available_on_digital_menu?: boolean;
  deleted_at?: string;
}

export interface SystemSettings {
  id?: UUID;
  restaurantName?: string;
  appLogoUrl?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrMenuLogo?: string;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
    autoSync?: boolean;
  };
  sqlServerConfig?: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    lastSync?: string;
    connectionString?: string;
  };
  [key: string]: unknown;
}

export interface BackupState {
  lastBackupDate: Date | null;
  backupInProgress: boolean;
  totalBackups: number;
}

export interface FinancialClearanceReport {
  clearedOrders: number;
  clearedExpenses: number;
  clearedRevenues: number;
  clearedPayroll: number;
  timestamp: string;
  reason: string;
  authorizedBy: string;
  user?: string;
  summary?: {
    ordersCount: number;
    expensesCount: number;
    fixedExpensesCount: number;
    revenuesCount: number;
    payrollCount: number;
    totalRevenue: number;
    totalExpenses: number;
  };
}

export interface FullApplicationState {
  version: string;
  timestamp: string;
  store: StoreState;
  orders?: Order[];
  shifts?: any[];
  revenues?: any[];
  payrollRecords?: PayrollRecord[];
  settings?: SystemSettings;
  customers?: Customer[];
  attendance?: AttendanceRecord[];
  suppliers?: Fornecedor[];
  users?: User[];
  tables?: Table[];
  products?: Product[];
  categories?: MenuCategory[];
  stock?: StockItem[];
  expenses?: Expense[];
  employees?: Employee[];
}

export interface IntegrityIssue {
  id: string;
  type: 'error' | 'warning' | 'INVALID_CATEGORY' | 'NO_IMAGE' | 'INTEGRITY_CHECK';
  severity?: 'error' | 'warning' | 'info' | 'critical' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  message: string;
  entityId?: string;
  entityType?: string;
  timestamp?: number;
  isResolved?: boolean;
  data?: any;
}

export interface FinancialBackupData {
  orders: Order[];
  expenses: Expense[];
  revenues: Revenue[];
  payroll: any[];
  shifts: any[];
  settings: SystemSettings;
  timestamp: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: Date | string;
  month: number;
  year: number;
  paymentMethod: PaymentMethod;
  status: 'PAID' | 'PENDING';
  notes?: string;
}

export interface PaymentCorrection {
  id: string;
  orderId: string;
  originalPayments: OrderPayment[];
  correctedPayments: OrderPayment[];
  previousPayments?: OrderPayment[]; // Alias for originalPayments
  newPayments?: OrderPayment[]; // Alias for correctedPayments
  reason: string;
  timestamp: string | Date;
  correctedBy?: string;
  userId?: string; // Alias for correctedBy
  userName?: string;
  type?: 'correction' | 'refund' | 'POST_PRINT' | 'PRE_PRINT';
}

export interface Analytics {
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  averageTicket: number;
  topSellingItems: MenuAnalytics[];
  salesByHour: { hour: number; revenue: number }[];
}

export interface User {
  id: string;
  name: string;
  role: string;
  pin: string;
  active: boolean;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IntegrationLog {
  id: string;
  integrationName: string;
  eventType: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'INFO';
  timestamp: Date | string;
  request?: unknown;
  response?: unknown;
  duration?: number;
  message?: string;
  [key: string]: unknown;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  createdAt: Date;
  status: 'ACTIVE' | 'REVOKED';
  scopes: string[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  status: 'ACTIVE' | 'INACTIVE';
  failureCount: number;
  lastTriggered?: Date;
}

export interface BiometricDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  apiKey?: string;
  type: 'FINGERPRINT' | 'FACIAL' | 'CARD';
  status: 'CONNECTED' | 'DISCONNECTED';
  lastSync?: Date;
  syncInterval?: number;
}

export type Permission = string;

export type UserRole = 'ADMIN' | 'MANAGER' | 'WAITER' | 'CHEF' | 'CASHIER' | 'DELIVERY' | 'CUSTOMER' | 'CAIXA' | 'GARCOM' | 'COZINHEIRO';

export interface CustomRole {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  isSystem?: boolean;
}

export interface MobileSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface BiometricClockEvent {
  id?: string;
  externalBioId: string;
  type: string;
  clockTime: string | Date;
  temperature?: number;
  deviceId?: string;
  processed?: boolean;
  processedAt?: Date;
  linkedAttendanceId?: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  driverId?: string;
  customerName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  productId: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  lastUpdated: Date | string;
}

export interface Reservation {
  id: string;
  tableId: number;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  partySize: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  notes?: string;
}

export interface WorkShift {
  id: string;
  employeeId: string;
  startTime: string;
  endTime?: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export type Revenue = AnyRecord;
export type CashShift = AnyRecord;

export type AIAnalysisResult = {
  summary: string;
  recommendation: string;
  trend: string;
  [key: string]: any;
};

export type AIMonthlyReport = {
  month: string;
  totalRevenue: number;
  topSellingItem: string;
  strategicAdvice: string;
  operationalEfficiency: string;
  customerSentiment: string;
  [key: string]: any;
};

export interface MenuAnalytics {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface DailySalesAnalytics {
  date: string;
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  averageTicket: number;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalExpenses: number;
}

export interface RemoteDashboardData {
  summary: {
    total_revenue: number;
    total_orders: number;
    active_orders_count: number;
    total_expenses: number;
  };
  analytics: {
    totalCustomers: number;
    retentionRate: number;
    menu: { productName: string; sold: number }[];
  };
  settings: SystemSettings;
  expenses: Array<Expense>;
  revenues: Array<Revenue>;
  menu: Array<Product>;
  users: Array<User>;
  categories: Array<MenuCategory>;
}
