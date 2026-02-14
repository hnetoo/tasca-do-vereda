export type AnyRecord = any;

export type User = AnyRecord;
export type Profile = AnyRecord;
export type Product = AnyRecord;
export type Category = AnyRecord;
export type Customer = AnyRecord;
export type Order = AnyRecord;
export type OrderItem = AnyRecord;
export type Payment = AnyRecord;
export type Expense = AnyRecord;
export type FixedExpense = AnyRecord;
export type Supplier = AnyRecord;
export type Table = AnyRecord;
export type AuditLog = AnyRecord;
export type OfflineQueue = AnyRecord;

export type MenuCategory = AnyRecord;
export type Dish = AnyRecord;
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
export type CashShift = AnyRecord;
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

export type IntegrationLog = AnyRecord;

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

export type DashboardSummary = Record<string, any>;

export type StoreState = Record<string, any>;

export type FullApplicationState = StoreState
