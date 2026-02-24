// Slices will be defined in this file to avoid circular dependencies
// import { UISlice } from './store/slices/uiSlice';
// import { OperationalSlice } from './store/slices/operationalSlice';
// import { MenuSlice } from './store/slices/menuSlice';
// import { StaffSlice } from './store/slices/staffSlice';
// import { FinanceSlice } from './store/slices/financeSlice';
// import { IntegrationsSlice } from './store/slices/integrationsSlice';



import { Database } from './types/supabase';
export type { Database };

export type AnyRecord = any;

type DishRow = Database['public']['Tables']['dishes']['Row'];

export type Dish = Omit<Partial<DishRow>, 
  'image_url' | 
  'category_id' | 
  'supplier_id' | 
  'tax_code' | 
  'tax_percentage' | 
  'preparation_time' | 
  'is_active' | 
  'is_available_on_digital_menu' | 
  'track_stock' | 
  'stock_quantity' | 
  'min_stock_quantity' | 
  'max_stock_quantity' |
  'created_at' |
  'updated_at' |
  'cost_price'
> & {
  id: string; // Ensure ID is always present
  name: string; // Ensure name is always present
  price: number; // Ensure price is always present
  
  // CamelCase overrides
  imageUrl?: string;
  categoryId?: string;
  supplierId?: string;
  taxCode?: string;
  taxPercentage?: number;
  preparationTime?: number;
  isActive?: boolean;
  isAvailableOnDigitalMenu?: boolean;
  trackStock?: boolean;
  stockQuantity?: number;
  minStockQuantity?: number;
  maxStockQuantity?: number;

  // Additional fields
  stock?: number;
  unit?: string;
  costPrice?: number;
  available?: boolean;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
};

export type Product = Dish;

export type MenuCategory = Omit<Partial<Database['public']['Tables']['menu_categories']['Row']>,
  'created_at' |
  'deleted_at' |
  'is_active' |
  'is_available_on_digital_menu' |
  'parent_id' |
  'sort_order' |
  'updated_at'
> & {
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
  order_id?: string;
  orderId?: string; // CamelCase alias
  product_id?: string;
  productId?: string; // CamelCase alias
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

  // Calculated fields
  subtotal?: number;
  tax?: number;
  total?: number;
  createdAt?: string; // CamelCase alias
  updatedAt?: string; // CamelCase alias
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

export type Order = Omit<Partial<Database['public']['Tables']['orders']['Row']>, 'created_at' | 'updated_at'> & {
  items?: (OrderItem & { dish?: Dish; product?: Dish })[];
  payments?: OrderPayment[];
  payment_method?: PaymentMethod | string | null;
  timestamp?: string | Date;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  customer_name?: string | null;
  customer_id?: UUID | null;
  order_number?: string | number | null;
  shift_id?: UUID | null;
  table_id?: string | null;
  invoice_number?: string | null;
  tax_total?: number | null;
  sub_account_name?: string | null;
  user_id?: UUID | null;
  user_name?: string | null;
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
  
  // Calculated fields
  subtotal?: number;
  tax?: number;
  total?: number | null; // Allow null from DB

  // Additional properties
  previous_hash?: string | null;
  previousHash?: string | null; // Alias
  jws_payload?: any;
  jwsPayload?: any; // Alias
  updatedAt?: string | Date; // Alias
  isSyncedAgt?: boolean | number | null; // Alias
  isPaid?: boolean; // Runtime flag
  is_synced_agt?: boolean | number | null;
  agt_submission_uuid?: string | null;
  signature?: string | null;
  hash?: string | null;
};

export type Profile = AnyRecord;
export type Customer = AnyRecord;

export type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  created_at?: string | null; // Legacy support
  payment_method?: string | null; // Legacy support
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
  permissions?: Permission[]; // Custom permissions
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
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'syncing' | 'retrying';
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
  location?: string;
  apiKey?: string;
  status?: 'CONNECTED' | 'DISCONNECTED' | string;
  lastSync?: Date | string | null;
  syncInterval?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
export interface MenuSlice {
  dishes: Dish[];
  categories: MenuCategory[];
  deletedCategoryIds: UUID[];
  isDiagnosing: boolean;
  integrityIssues: IntegrityIssue[];
  setDishes: (dishes: Dish[]) => void;
  setCategories: (categories: MenuCategory[]) => void;
  setDishesFromCloud: (dishes: Dish[]) => void;
  setCategoriesFromCloud: (categories: MenuCategory[]) => void;
  addCategory: (cat: MenuCategory) => void;
  updateCategory: (cat: MenuCategory) => void;
  removeCategory: (id: UUID) => void;
  restoreCategory: (id: UUID) => void;
  recoverDeletedCategory: (category: MenuCategory) => void;
  scanAndRecoverCategories: () => Promise<void>;
  addDish: (dish: Dish) => Promise<boolean>;
  updateDish: (dish: Dish) => Promise<boolean>;
  batchUpdateDishes: (updates: { id: UUID; changes: Partial<Dish> }[]) => Promise<boolean>;
  removeDish: (id: UUID) => void;
  restoreMenuData: () => Promise<void>;
  hardResetMenu: () => Promise<void>;
  loadFromSQLExclusively: () => Promise<boolean>;
  getDishById: (id: UUID) => Dish | undefined;
  getDishesByCategory: (categoryId: UUID) => Dish[];
  getCategoryById: (id: UUID) => MenuCategory | undefined;
  rebuildMenu: (categories: MenuCategory[], dishes: Dish[]) => void;
  invalidateMenuCache: () => void;
  syncMenuWithCloud: () => Promise<void>;
  validateMenuIntegrity: (categories: MenuCategory[], dishes: Dish[]) => { isValid: boolean; issues: IntegrityIssue[] };
  runIntegrityDiagnostics: () => Promise<void>;
  performSafeCleanup: () => Promise<boolean>;
  importCloudItems: (data: { categories: MenuCategory[], dishes: Dish[], preferCloud: boolean }) => Promise<void>;
  detectCloudConflicts: (data: { categories: MenuCategory[], products: Dish[] }) => { categories: MenuCategory[], products: Dish[] };
  menuAccessLogs: MenuAccessLog[];
  getMenuAccessStats: () => MenuAccessAggregatedStats;
  clearMenuAccessLogs: () => void;
  logMenuAccess: (log: MenuAccessLog) => void;
}

export interface StaffSlice {
  employees: Employee[];
  workShifts: WorkShift[];
  attendance: AttendanceRecord[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  removeEmployee: (id: UUID) => void;
  addWorkShift: (shift: WorkShift) => void;
  removeWorkShift: (id: UUID) => void;
  clockIn: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  clockOut: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  getEmployeeById: (id: UUID) => Employee | undefined;
  getAttendanceByEmployeeId: (employeeId: UUID) => AttendanceRecord[];
  setEmployees: (employees: Employee[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;
  updateAttendance: (record: AttendanceRecord) => void;
}

export interface UISlice {
  settings: SystemSettings;
  notifications: Notification[];
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  triggerSync: () => Promise<void>;
}

export interface IntegrationsSlice {
  apiKeys: APIKey[];
  generateApiKey: (name: string, scopes: string[]) => APIKey;
  revokeApiKey: (keyId: string) => void;
  webhooks: WebhookConfig[];
  registerWebhook: (config: WebhookConfig) => void;
  updateWebhook: (config: WebhookConfig) => void;
  removeWebhook: (webhookId: string) => void;
  triggerWebhook: (event: string, data: unknown) => Promise<void>;
  testWebhook: (webhookId: string) => Promise<boolean>;
  biometricDevices: BiometricDevice[];
  registerBiometricDevice: (device: BiometricDevice) => void;
  removeBiometricDevice: (deviceId: string) => void;
  updateBiometricDevice: (device: BiometricDevice) => void;
  syncBiometricDevice: (deviceId: string) => Promise<void>;
  testBiometricConnection: (deviceId: string) => Promise<boolean>;
  integrationLogs: IntegrationLog[]; 
  mobileSessions: MobileSession[];
  createMobileSession: (userId: string, deviceInfo: { deviceId: string; deviceName: string; ipAddress: string }) => MobileSession;
  validateMobileSession: (token: string) => MobileSession | null;
  revokeMobileSession: (sessionId: string) => void;
  processBiometricWebhook: (payload: {
    externalBioId: string;
    type: string;
    clockTime: string | Date;
    temperature?: number;
    deviceId?: string;
  }) => Promise<void>;
}

export interface OperationalSlice {
  tables: Table[];
  fetchTables: () => Promise<void>;
  activeTableId: string | null;
  saveStatus: 'SAVING' | 'SAVED' | 'ERROR' | 'IDLE';
  setSaveStatus: (status: 'SAVING' | 'SAVED' | 'ERROR' | 'IDLE') => void;
  customers: Customer[];
  reservations: Reservation[];
  stock: StockItem[];
  shifts: CashShift[];
  currentShiftId: UUID | null;
  deliveries: Delivery[];
  
  setActiveTable: (id: string | null) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  removeTable: (id: string) => void;
  updateTableStatus: (id: string, status: string) => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  removeCustomer: (id: UUID) => void;
  
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation) => void;
  removeReservation: (id: UUID) => void;
  
  addStockItem: (item: StockItem) => void;
  updateStockItem: (item: StockItem) => void;
  removeStockItem: (id: UUID) => void;
  
  openShift: (amount: number) => void;
  closeShift: (closingAmount: number) => void;
  backupLayout: () => void;
  createNewOrder: (tableId: string, name: string) => UUID;
  addOrderItem: (orderId: UUID, item: OrderItem) => void;
  updateOrderItem: (orderId: UUID, itemId: UUID, updatedItem: Partial<OrderItem>) => void;
  removeOrderItem: (orderId: UUID, itemId: UUID) => void;
  updateStockQuantity: (id: UUID, quantity: number) => void;
  
  closeTableWithoutOrders: (tableId: string) => void;
  transferTable: (fromTableId: string, toTableId: string) => void;

  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (delivery: Delivery) => void;
  removeDelivery: (id: UUID) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
  setShifts: (shifts: CashShift[]) => void;
  addAuditLog: (log: any) => void;
  auditLogs: any[];
  settleCustomerDebt: (customerId: UUID, amount: number) => void;
}

export interface FinanceSlice {
  orders: Order[];
  activeOrders: Order[];
  activeOrderIds: UUID[];
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
  setRevenues: (revenues: Revenue[]) => void;
  setPayroll: (payroll: PayrollRecord[]) => void;
  getLoyaltyTier: (customerId: UUID) => string;
  processPayroll: (employeeId: UUID, month: number, year: number, paymentMethod: PaymentMethod) => Promise<void>;
  createFullFinancialBackup: () => Promise<boolean>;
  restoreFullFinancialBackup: () => Promise<boolean>;
  clearFinancialData: (reason: string, userId: UUID) => Promise<{ success: boolean; report: FinancialClearanceReport }>;
  correctPayment: (orderId: UUID, newPayments: OrderPayment[], reason: string, user: User) => Promise<boolean>;
  getDailySalesAnalytics: (days: number) => DailySalesAnalytics[];
  getSalesForDate: (date: Date) => DailySalesAnalytics;
  getMenuAnalytics: (period: 'day' | 'week' | 'month' | number) => MenuAnalytics[];
  getStockAnalytics: () => Array<{ itemId: string; itemName: string; currentStock: number; minThreshold: number; daysToRunOut: number }>;
  getEmployeePerformance: () => Array<{ employeeId: string; efficiency: number; rating: number }>;
  getPeakHours: () => number[];
  getTopSellingDishes: (limit?: number) => Dish[];
  getAverageOrderValue: () => number;
  getCustomerRetention: () => any;
  getRevenueHistory: (days?: number) => Array<{ date: string; totalRevenue: number }>;
  syncFinancialMetricsToDashboard: () => Promise<void>;
  fetchRemoteDashboard: () => Promise<void>;
  handleRealtimeUpdate: (payload: RealtimePayload<any>) => void;
  
  addToOrder: (tableId: string, dish: Dish, quantity: number, notes: string, orderId: UUID, userId?: string) => void;
  removeFromOrder: (orderId: UUID, itemIndex: number, userId?: string) => void;
  checkoutTable: (orderId: UUID, payments: OrderPayment[], subAccountName?: string, customerNif?: string, userId?: string) => Promise<void>;
  fireOrderToKitchen: (orderId: UUID) => void;
  clearDraftOrder: (orderId: UUID) => void;
  updateOrderItemStatus: (orderId: string, itemIndex: number, status: string) => void;
  markOrderAsServed: (orderId: string) => void;
}

export interface StoreState extends MenuSlice, StaffSlice, FinanceSlice, UISlice, OperationalSlice, IntegrationsSlice {
  addAuditLog: (log: any) => void;
  suppliers: Fornecedor[];
  supabaseSyncStatus: SupabaseSyncStatus;
  setSupabaseSyncStatus: (status: SupabaseSyncStatus) => void;
  activeTableId: string | null;
  shifts: WorkShift[];
  stock: StockItem[];
  attendance: AttendanceRecord[];
  employees: Employee[];
  notifications: Notification[];
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
  retrySync: () => Promise<void>;
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
  notes?: string;
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
