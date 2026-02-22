export type AnyRecord = any;

export type User = AnyRecord;
export type Profile = AnyRecord;
export type Product = AnyRecord;
export type Category = AnyRecord;
export type Customer = AnyRecord;
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
  paymentMethod?: PaymentMethod | null;
  payment_method?: PaymentMethod | null; // For Supabase compatibility
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
  dishId: string;
  dish_id?: string; // For Supabase compatibility
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
  parentId?: string;
  parent_id?: string; // For Supabase compatibility
  is_active?: boolean;
  deletedAt?: string | null;
  deleted_at?: string | null; // For Supabase compatibility
  availableOnDigitalMenu?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  categoryName?: string; // For category resolution fallback
  image?: string;
  image_url?: string; // For Supabase compatibility
  disponivel?: boolean;
  available?: boolean; // For Supabase compatibility
  taxCode?: string;
  taxPercentage?: number;
  tax_rate?: number; // For Supabase compatibility
  precoCusto?: number;
  tempo_preparo?: string;
  availableOnDigitalMenu?: boolean;
  controlaEstoque?: boolean;
  quantidadeEstoque?: number;
  quantidadeMinima?: number;
  quantidadeMaxima?: number;
  unidadeMedida?: string;
  fornecedorPadraoId?: string;
  stockItemId?: string;
  deletedAt?: string | null;
  deleted_at?: string | null; // For Supabase compatibility
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
export type Fornecedor = AnyRecord;
export type SystemSettings = {
  restaurantName: string;
  appLogoUrl?: string;
  currency: string;
  taxRate: number;
  phone?: string;
  address?: string;
  nif?: string;
  commercialReg?: string;
  agtCertificate?: string;
  invoiceSeries: string;
  retencaoFonte: number;
  regimeIVA: string;
  motivoIsencao?: string;
  openDrawerCode?: string;
  kdsEnabled: boolean;
  isSidebarCollapsed: boolean;
  apiToken: string;
  webhookEnabled: boolean;
  qrMenuUrl?: string;
  qrMenuCloudUrl?: string;
  qrMenuShortCode?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrMenuLogo?: string;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
    autoSync: boolean;
  };
  adminPin?: string;
  [key: string]: any;
};
export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};
export type StockItem = AnyRecord;
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
export type PayrollRecord = AnyRecord;
export type DailySalesAnalytics = AnyRecord;
export type MenuAnalytics = AnyRecord;

export interface Analytics {
  totalCustomers: number;
  retentionRate: number;
  menu: Array<{ dishName: string; sold: number }>;
}
export type Delivery = AnyRecord;
export type Reservation = AnyRecord;
export type Employee = AnyRecord;
export type AttendanceRecord = AnyRecord;
export type MenuAccessLog = AnyRecord;
export type OfflineAction = AnyRecord;
export type Revenue = AnyRecord;
export type Settings = AnyRecord;
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
