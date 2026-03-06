export type AnyRecord = any;
export type UUID = string;

export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  pin?: string;
  [key: string]: any;
}
export type Profile = AnyRecord;
export type Product = Dish;
export type Category = MenuCategory;
export interface Customer {
  id: string;
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string | Date;
  created_at?: string;
  updatedAt?: string | Date;
  updated_at?: string;
  [key: string]: any;
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
  paymentMethod?: PaymentMethod | string | null;
  payment_method?: PaymentMethod | string | null; // For Supabase compatibility
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
}
export interface OrderItem {
  id?: string; // Optional, as it might be auto-generated
  orderId?: string; // Optional, set when part of an order
  order_id?: string; // For Supabase compatibility
  productId: string; // Standardized to 'product' to match db schema
  dish_id?: string; // For Supabase compatibility
  dishId?: string; // Alias for backward compatibility in UI components
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
export interface Fornecedor {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  nif?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string | Date;
  created_at?: string;
  updatedAt?: string | Date;
  updated_at?: string;
}
export type Supplier = Fornecedor;
export interface Table {
  id: string;
  number: number;
  name: string;
  label?: string;
  seats: number;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: TableZone;
  shape: TableShape;
  rotation: number;
  groupId?: string;
  group_id?: string;
  color?: string;
  userId?: string;
  user_id?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string | Date;
  created_at?: string;
  updatedAt?: string | Date;
  updated_at?: string;
  activeOrderIds?: string[];
  [key: string]: any;
}
export type AuditLog = AnyRecord;
export type OfflineQueue = AnyRecord;

export interface DailyAnalytics {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProductCost: number;
  totalOrders: number;
  netProfit: number;
  lastUpdated: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder?: number;
  sort_order?: number; // For Supabase compatibility
  isActive?: boolean; // camelCase for app
  is_active?: boolean; // snake_case for DB
  parentId?: string;
  parent_id?: string; // For Supabase compatibility
  deletedAt?: string | null;
  deleted_at?: string | null; // For Supabase compatibility
  availableOnDigitalMenu?: boolean;
  isAvailableOnDigitalMenu?: boolean; // camelCase alias
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number; // camelCase
  categoryId?: string; // camelCase
  imageUrl?: string; // camelCase
  category_id: string;
  categoryName?: string; // For category resolution fallback
  image?: string;
  image_url?: string; // For Supabase compatibility
  disponivel?: boolean;
  isActive?: boolean; // camelCase
  is_active?: boolean; // snake_case
  available?: boolean; // For Supabase compatibility
  taxCode?: string;
  taxPercentage?: number;
  tax_rate?: number; // For Supabase compatibility
  precoCusto?: number;
  cost_price?: number; // snake_case
  tempo_preparo?: string;
  preparationTime?: number; // camelCase
  preparation_time?: number; // snake_case
  availableOnDigitalMenu?: boolean;
  isAvailableOnDigitalMenu?: boolean; // camelCase alias
  is_available_on_digital_menu?: boolean; // snake_case
  controlaEstoque?: boolean;
  trackStock?: boolean; // camelCase
  track_stock?: boolean; // snake_case
  quantidadeEstoque?: number;
  stockQuantity?: number; // camelCase
  stock_quantity?: number; // snake_case
  quantidadeMinima?: number;
  minStockQuantity?: number; // camelCase
  min_stock_quantity?: number; // snake_case
  quantidadeMaxima?: number;
  maxStockQuantity?: number; // camelCase
  max_stock_quantity?: number; // snake_case
  unidadeMedida?: string;
  unit?: string; // Standardized
  fornecedorPadraoId?: string;
  supplierId?: string; // camelCase
  supplier_id?: string; // snake_case
  stockItemId?: string;
  deletedAt?: string | null;
  deleted_at?: string | null; // For Supabase compatibility
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
export type SystemSettings = {
  id?: string;
  name?: string;
  restaurantName: string;
  restaurant_name?: string; // snake_case
  appLogoUrl?: string;
  app_logo_url?: string; // snake_case
  currency: string;
  taxRate: number;
  taxPercentage?: number; // camelCase alias used in operations
  tax_percentage?: number; // snake_case
  phone?: string;
  address?: string;
  nif?: string;
  email?: string;
  timezone?: string;
  language?: string;
  commercialReg?: string;
  agtCertificate?: string;
  agt_certificate?: string; // snake_case
  invoiceSeries: string;
  retencaoFonte: number;
  regimeIVA: string;
  motivoIsencao?: string;
  openDrawerCode?: string;
  open_drawer_code?: string; // snake_case
  kdsEnabled: boolean;
  isSidebarCollapsed: boolean;
  apiToken: string;
  api_token?: string; // snake_case
  webhookEnabled: boolean;
  qrMenuUrl?: string;
  qr_menu_url?: string; // snake_case
  qrMenuCloudUrl?: string;
  qr_menu_cloud_url?: string; // snake_case
  qrMenuShortCode?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrMenuLogo?: string;
  
  // QR Code snake_case aliases for adminOperations
  qr_code_title?: string;
  qr_code_subtitle?: string;
  qr_code_short_code?: string;
  
  // Wifi
  wifi_name?: string;
  wifi_password?: string;
  wifiName?: string;
  wifiPassword?: string;

  // Configs
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
    autoSync: boolean;
  };
  supabase_config?: any;
  printerConfig?: any;
  printer_config?: any;
  backupConfig?: any;
  backup_config?: any;
  
  adminPin?: string;
  admin_pin?: string; // snake_case
  logo_url?: string;
  logoUrl?: string;
  
  [key: string]: any;
};
export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  min_threshold?: number; // snake_case
  createdAt?: string | Date;
  created_at?: string;
  updatedAt?: string | Date;
  updated_at?: string;
}
export interface CashShift {
  id: string;
  userId?: string;
  user_id?: string; // For Supabase compatibility
  userName?: string;
  user_name?: string; // For Supabase compatibility
  startTime: Date | string; // ISO date string
  start_time?: string; // For Supabase compatibility
  endTime?: Date | string | null; // ISO date string
  end_time?: string | null; // For Supabase compatibility
  openingBalance: number;
  opening_balance?: number; // For Supabase compatibility
  closingBalance?: number;
  closing_balance?: number; // For Supabase compatibility
  expectedBalance?: number;
  expected_balance?: number; // For Supabase compatibility
  status: string;
  salesBreakdown?: Record<PaymentMethod, number>;
}
export type WorkShift = AnyRecord;
export type FinancialClearanceReport = AnyRecord;
export type OrderPayment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  timestamp: string;
};
export type PaymentMethod =
  | 'NUMERARIO'
  | 'TPA'
  | 'TRANSFERENCIA'
  | 'QR_CODE'
  | 'CONTA_CORRENTE'
  | 'MBWAY'
  | 'OUTROS'
  | 'Cash'
  | 'Card'
  | 'MBWay'
  | 'Other';
export interface PayrollRecord {
  id: string;
  employeeId?: string;
  employee_id?: string;
  month: number;
  year: number;
  baseSalary?: number;
  base_salary?: number;
  amount: number;
  date: string | Date;
  createdAt?: string | Date;
  created_at?: string;
}
export type DailySalesAnalytics = AnyRecord;
export type MenuAnalytics = AnyRecord;

export interface Analytics {
  totalCustomers: number;
  retentionRate: number;
  menu: Array<{ dishName: string; sold: number }>;
}
export interface Delivery {
  id: string;
  orderId?: string;
  order_id?: string;
  driverName?: string;
  driver_name?: string;
  status: string;
  address: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  startTime?: string | Date;
  start_time?: string;
  endTime?: string | Date;
  end_time?: string;
  updatedAt?: string | Date;
  updated_at?: string;
}
export interface Reservation {
  id: string;
  tableId?: string;
  table_id?: string;
  customerName: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  date: string | Date;
  time: string;
  guests: number;
  status: string;
  notes?: string;
  createdAt?: string | Date;
  created_at?: string;
  updatedAt?: string | Date;
  updated_at?: string;
}
export interface Employee {
  id: string;
  name: string;
  role: string;
  pin?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  is_active?: boolean; // snake_case
  permissions?: string[];
  admissionDate?: string;
  admission_date?: string; // snake_case
  socialSecurityNumber?: string;
  social_security_number?: string; // snake_case
  bankAccount?: string;
  bank_account?: string; // snake_case
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Legacy
  active?: boolean;
}
export interface AttendanceRecord {
  id: string;
  employeeId?: string;
  employee_id?: string;
  date?: string;
  clockIn?: string | Date;
  clock_in?: string;
  clockOut?: string | Date;
  clock_out?: string;
  clockInMethod?: string;
  clock_in_method?: string;
  clockOutMethod?: string;
  clock_out_method?: string;
  totalHours?: number;
  total_hours?: number;
  isLate?: boolean;
  is_late?: boolean;
  lateMinutes?: number;
  late_minutes?: number;
  overtimeHours?: number;
  overtime_hours?: number;
  isAbsence?: boolean;
  is_absence?: boolean;
  createdAt?: string | Date;
  created_at?: string;
}
export type MenuAccessLog = AnyRecord;
export type OfflineAction = AnyRecord;
export interface Revenue {
  id: string;
  description: string;
  amount: number;
  date: string | Date;
  category: string;
  paymentMethod?: string | PaymentMethod;
  payment_method?: string;
  updatedAt?: string | Date;
  updated_at?: string;
}
export type Settings = SystemSettings;
export type BackupState = AnyRecord;
export type FinancialBackupData = AnyRecord;
export type PaymentCorrection = AnyRecord;
export type BiometricDevice = AnyRecord;
export type BiometricClockEvent = AnyRecord;
export type CustomerDisplayEvent = AnyRecord;
export type LayoutBackup = AnyRecord;
export type MenuAccessStats = AnyRecord;
export type QRScanResult = AnyRecord;
export type QRScanData = AnyRecord;
export type TableStatus = string;
export type TableZone = string;
export type TableShape = string;
export type Permission = string;
export type UserRole = string;
export type CustomRole = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: Permission[];
  isDefault?: boolean;
  [key: string]: any;
};

export interface IntegrationLog {
  id: string;
  timestamp: string; // ISO date string
  integrationName: string;
  eventType: string;
  status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  duration: number;
}

export type CartEntry = AnyRecord;

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

export type SecurityAlert = AnyRecord;

export type IntegrityIssue = AnyRecord;

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  activeOrdersCount: number;
}

export type StoreState = Record<string, any>;

export interface SupabaseCategory {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  parent_id?: string;
  deleted_at?: string | null;
}

export interface SupabaseDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  image_url?: string;
  available: boolean;
  tax_rate: number;
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
    menu: Array<{ dishName: string; sold: number }>;
  };
  settings: SystemSettings;
  expenses: Array<Expense>;
  revenues: Array<Revenue>;
  menu: Array<Dish>;
  users: Array<User>;
  categories: Array<MenuCategory>;
}



export type FullApplicationState = StoreState
