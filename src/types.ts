// 🏆 SUPABASE SCHEMA TYPES - ESPERHO PERFEITO DO BANCO DE DADOS
// 📋 BASEADO NO ARQUIVO: supabase/migrations/20260306120755_remote_schema.sql
// 🐍 100% SNAKE_CASE - SEM CAMELCASE NOS CAMPOS DO BANCO

export type AnyRecord = any;

// ========================================
// 🍽️ MENU_CATEGORIES
// ========================================
export interface MenuCategoryRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_available_on_digital_menu: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MenuCategory = Partial<MenuCategoryRow> & {
  id: string;
  name: string;
  
  // Campos adicionais para UI (não vão para banco)
  parentId?: string;
  isAvailableOnDigitalMenu?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Category = MenuCategory;

// ========================================
// 🍽️ MENU_ITEMS (DISHES)
// ========================================
export interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost_price: number;
  category_id: string | null;
  supplier_id: string | null;
  image_url: string | null;
  available: boolean;
  is_active: boolean;
  is_available_on_digital_menu: boolean;
  tax_percentage: number;
  tax_code: string;
  preparation_time: number | null;
  track_stock: boolean;
  stock_quantity: number;
  min_stock_quantity: number;
  max_stock_quantity: number | null;
  unit: string;
  user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type Dish = Partial<MenuItemRow> & {
  id: string;
  name: string;
  price: number;
  
  // Campos adicionais para UI (não vão para banco)
  imageUrl?: string;
  categoryId?: string;
  available?: boolean;
  isActive?: boolean;
  isAvailableOnDigitalMenu?: boolean;
  trackStock?: boolean;
  stockQuantity?: number;
  minStockQuantity?: number;
  costPrice?: number;
  preparationTime?: number;
  taxCode?: string;
  taxPercentage?: number;
  supplierId?: string;
  unit?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Product = Dish;

// ========================================
// 🍽️ TABLE ZONES
// ========================================
export interface TableZone {
  id: string;
  name: string;
  color: string;
  tables: string[];
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 📋 ORDERS
// ========================================
export interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  table_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_nif: string | null;
  user_id: string | null;
  user_name: string | null;
  total: number | null;
  tax_total: number | null;
  payment_method: string | null;
  notes: string | null;
  shift_id: string | null;
  sub_account_name: string | null;
  invoice_number: string | null;
  agt_submission_uuid: string | null;
  is_synced_agt: number;
  hash: string | null;
  previous_hash: string | null;
  signature: string | null;
  jws_payload: any;
  split_payments: any;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Order = Partial<OrderRow> & {
  id: string;
  status: string;
  items: any[];
  
  // Campos adicionais para UI (não vão para banco)
  customerName?: string;
  tableId?: string;
  orderNumber?: string;
  customerNif?: string;
  paymentMethod?: string;
  splitPayments?: any;
  payments?: any;
  taxTotal?: number;
  total_amount?: number;
  paidAmount?: number;
  subAccountName?: string;
  invoiceNumber?: string;
  shiftId?: string;
  userId?: string;
  userName?: string;
  customerId?: string;
  isPaid?: boolean;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 📋 ORDER_ITEMS
// ========================================
export interface OrderItemRow {
  id: string;
  order_id: string;
  dish_id: string | null;
  quantity: number;
  unit_price: number;
  tax_percentage: number;
  tax_amount: number;
  tax_code: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export type OrderItem = Partial<OrderItemRow> & {
  id: string;
  quantity: number;
  unit_price: number;
  
  // Campos adicionais para UI (não vão para banco)
  dishId?: string;
  dishName?: string;
  price?: number;
  notes?: string;
  orderId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItemDetail = OrderItem & {
  dish?: Dish;
  product?: Dish;
};

// ========================================
// 🪑 RESTAURANT_TABLES
// ========================================
export interface RestaurantTableRow {
  id: string;
  name: string | null;
  number: number;
  seats: number | null;
  shape: string | null;
  zone: string | null;
  status: string;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  color: string | null;
  label: string | null;
  group_id: string | null;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Table = Partial<RestaurantTableRow> & {
  id: string;
  number: number;
  status: string;
  
  // Campos adicionais para UI (não vão para banco)
  name?: string;
  label?: string;
  zone?: string;
  capacity?: number;
  position?: { x: number; y: number };
  qrCode?: string;
  activeOrderIds?: string[];
};

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'PAYMENT' | 'DIRTY';

// ========================================
// � PERMISSIONS
// ========================================
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

// ========================================
// �👥 EMPLOYEES
// ========================================
export interface EmployeeRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  bi: string | null;
  role: string;
  salary: number | null;
  admission_date: string | null;
  daily_work_hours: number | null;
  work_days_per_month: number | null;
  bank_account: string | null;
  social_security_number: string | null;
  pin: string | null;
  color: string | null;
  external_bio_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Employee = Partial<EmployeeRow> & {
  id: string;
  name: string;
  role: string;
  
  // Campos adicionais para UI (não vão para banco)
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  bi?: string;
  socialSecurityNumber?: string;
  bankAccount?: string;
  isActive?: boolean;
  color?: string;
  workDaysPerMonth?: number;
  dailyWorkHours?: number;
  admissionDate?: string;
  externalBioId?: string | null;
  lastUpdated?: string;
  salary?: number;
  pin?: string | null;
  createdAt?: string;
  updatedAt?: string;
  permissions?: string[];
};

// ========================================
// 💰 EXPENSES
// ========================================
export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string | null;
  status: string;
  notes: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export type Expense = Partial<ExpenseRow> & {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 💰 REVENUES
// ========================================
export interface RevenueRow {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export type Revenue = Partial<RevenueRow> & {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 📦 STOCK_ITEMS
// ========================================
export interface StockItemRow {
  id: string;
  name: string;
  quantity: number | null;
  min_threshold: number | null;
  unit: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export type StockItem = Partial<StockItemRow> & {
  id: string;
  name: string;
  
  // Campos adicionais para UI (não vão para banco)
  quantity?: number;
  minThreshold?: number;
  unit?: string;
  supplierId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// ========================================
// 📅 RESERVATIONS
// ========================================
export interface ReservationRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  guests: number;
  table_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type Reservation = Partial<ReservationRow> & {
  id: string;
  customer_name: string;
  guests: number;
  date: string;
  time: string;
  status: string;
  
  // Campos adicionais para UI (não vão para banco)
  tableId?: string;
  customerPhone?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// ========================================
// 💳 CASH_SHIFTS
// ========================================
export interface CashShiftRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type CashShift = Partial<CashShiftRow> & {
  id: string;
  status: string;
  
  // Campos adicionais para UI (não vão para banco)
  userId?: string;
  userName?: string;
  openingAmount?: number;
  closingAmount?: number;
  openedAt?: string;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 🏢 SETTINGS
// ========================================
export interface SettingsRow {
  id: string;
  restaurant_name: string | null;
  nif: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  currency: string | null;
  tax_percentage: number | null;
  regime_iva: string | null;
  motivo_isencao: string | null;
  agt_certificate: string | null;
  open_drawer_code: string | null;
  created_at: string;
  updated_at: string;
}

export type Settings = Partial<SettingsRow> & {
  id: string;
  
  // Campos adicionais para UI (não vão para banco)
  restaurantName?: string;
  nif?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  currency?: string;
  taxPercentage?: number;
  regimeIVA?: string;
  motivoIsencao?: string;
  agtCertificate?: string;
  openDrawerCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 📊 PAYROLL_RECORDS
// ========================================
export interface PayrollRecordRow {
  id: string;
  employee_id: string | null;
  month: number | null;
  year: number | null;
  date: string;
  amount: number;
  base_salary: number | null;
  net_salary: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  payment_date: string | null;
  employee_name: string;
}

export type PayrollRecord = Partial<PayrollRecordRow> & {
  id: string;
  date: string;
  amount: number;
  employee_name: string;
  
  // Campos adicionais para UI (não vão para banco)
  employeeId?: string;
  month?: number;
  year?: number;
  baseSalary?: number;
  netSalary?: number;
  status?: string;
  notes?: string;
  paymentDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 📊 ATTENDANCE_RECORDS
// ========================================
export interface AttendanceRecordRow {
  id: string;
  employee_id: string | null;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  late_minutes: number | null;
  overtime_hours: number | null;
  is_absence: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clock_in_method: string | null;
  clock_out_method: string | null;
}

export type AttendanceRecord = Partial<AttendanceRecordRow> & {
  id: string;
  date: string;
  
  // Campos adicionais para UI (não vão para banco)
  employeeId?: string;
  clockIn?: Date | string | null;
  clockOut?: Date | string | null;
  lateMinutes?: number;
  overtimeHours?: number;
  isAbsence?: boolean;
  notes?: string;
  clockInMethod?: string | null;
  clockOutMethod?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

// ========================================
// 📋 PROFILES (USERS)
// ========================================
export interface ProfileRow {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  active: boolean | null;
  permissions: any;
}

export type User = Partial<ProfileRow> & {
  id: string;
  role: string;
  
  // Campos adicionais para UI (não vão para banco)
  email?: string;
  name?: string;
  active?: boolean;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
};

// ========================================
// 📢 NOTIFICATIONS
// ========================================
export interface NotificationRow {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export type Notification = Partial<NotificationRow> & {
  id: string;
  title: string;
  message: string;
  
  // Campos adicionais para UI (não vão para banco)
  userId?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

// ========================================
// 📋 AUDIT_LOGS
// ========================================
export interface AuditLogRow {
  id: string;
  action: string;
  user_id: string | null;
  details: any;
  created_at: string;
}

export type AuditLog = Partial<AuditLogRow> & {
  id: string;
  action: string;
  
  // Campos adicionais para UI (não vão para banco)
  userId?: string;
  metadata?: any;
  createdAt?: string | Date;
};

// ========================================
// 🔑 API_KEYS
// ========================================
export interface ApiKeyRow {
  id: string;
  name: string;
  key_hash: string;
  created_at: string;
  last_used: string | null;
  status: string;
  scopes: any;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  created_at: Date | string;
  lastUsed?: Date | string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | string;
  scopes: string[];
}

// ========================================
// 📊 INTEGRATION_LOGS
// ========================================
export interface IntegrationLogRow {
  id: string;
  service: string;
  event: string;
  status: string;
  request_data?: any;
  response_data?: any;
  error_message?: string;
  created_at: string;
}

export type IntegrationLog = IntegrationLogRow;

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  created_at?: Date | string;
  lastTriggered?: Date | string;
  failureCount?: number;
  status?: 'ACTIVE' | 'DISABLED' | string;
}

// ========================================
// 📱 MOBILE SESSIONS
// ========================================
export interface MobileSession {
  id: string;
  userId: string;
  token: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  created_at: Date | string;
  expiresAt: Date | string;
  lastActive: Date | string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | string;
}

// ========================================
// 📺 CUSTOMER DISPLAY
// ========================================
export interface CustomerDisplayEvent {
  id: string;
  type: 'ORDER_UPDATE' | 'PAYMENT' | 'NOTIFICATION' | 'PAYMENT_STARTED' | 'PAYMENT_COMPLETED' | 'SHOW_ORDER';
  message: string;
  data?: any;
  timestamp: string;
  created_at?: string;
}

// ========================================
// 🎯 TIPOS DE PAGAMENTO
// ========================================
export type PaymentMethod = 'NUMERARIO' | 'TPA' | 'TRANSFERENCIA' | 'QR_CODE' | 'SPLIT';

// ========================================
// 💳 ORDER_PAYMENT
// ========================================
export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  timestamp: string;
}

// ========================================
// 📋 STATUS TYPES
// ========================================
export type OrderStatus = 'ABERTO' | 'CONCLUIDO' | 'CANCELADO' | 'FECHADO';
export type ShiftStatus = 'OPEN' | 'CLOSED';

// ========================================
// 🔄 OFFLINE QUEUE
// ========================================
export type OfflineQueue = AnyRecord;

// ========================================
// 🔧 INTEGRATION TYPES
// ========================================
export interface Integration {
  id: string;
  name: string;
  type: string;
  config: any;
  status?: 'CONNECTED' | 'DISCONNECTED' | string;
  lastSync?: Date | string | null;
  syncInterval?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface BiometricClockEvent {
  id: string;
  deviceId: string;
  externalBioId: string;
  clockTime: Date | string;
  type: 'IN' | 'OUT';
  userId?: string;
  created_at?: Date | string;
}

// ========================================
// 🏭 SUPPLIERS
// ========================================
export interface SupplierRow {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  nif?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 🔍 INTEGRITY ISSUE
// ========================================
export interface IntegrityIssue {
  id: string;
  type: 'missing' | 'duplicate' | 'invalid';
  field: string;
  value?: any;
  expected?: any;
  message: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
}

// ========================================
// �👥 CUSTOMERS
// ========================================
export interface Customer {
  id: string;
  name: string;
  nif?: string;
  phone?: string;
  email?: string;
  address?: string;
  points?: number;
  balance?: number;
  visits?: number;
  lastVisit?: Date | string;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 🚚 DELIVERY
// ========================================
export interface Delivery {
  id: string;
  order_id: string;
  driver_name: string;
  status: 'pendente' | 'em_rota' | 'entregue' | 'cancelada';
  address: string;
  customer_name: string;
  customer_phone: string;
  start_time: Date;
  end_time?: Date;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 🔐 BIOMETRIC DEVICE
// ========================================
export interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'facial' | 'iris' | 'ZKTECO';
  status: 'active' | 'inactive' | 'error' | 'OFFLINE';
  lastSync?: string | null;
  ipAddress?: string;
  port?: number;
  location?: string;
  apiKey?: string;
  syncInterval?: number;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 🤖 AI MONTHLY REPORT
// ========================================
export interface AIMonthlyReport {
  month: string;
  year: number;
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recommendations: string[];
  strategicAdvice?: string;
  operationalEfficiency?: string;
  sentiment?: string;
  topSellingItem?: string;
  trends: {
    revenue: Array<{ date: string; amount: number }>;
    orders: Array<{ date: string; count: number }>;
  };
  insights: string[];
}

// ========================================
// 🤖 AI ANALYSIS TYPES
// ========================================
export interface AIAnalysisResult {
  summary?: string;
  recommendation?: string;
  trend?: 'up' | 'down' | 'stable';
  insights: string[];
  recommendations: string[];
  performance: {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    topDishes: string[];
  };
  trends: {
    hourly: Array<{ hour: number; revenue: number }>;
    daily: Array<{ date: string; revenue: number }>;
  };
}

export interface PedidoPayload {
  [key: string]: any;
}

export interface DailyAnalyticsPayload {
  [key: string]: any;
}

// ========================================
// 🎯 CORRECTION TYPES
// ========================================
export type PaymentCorrection = any;

// ========================================
// 📱 QR SCANNER TYPES
// ========================================
export interface QRScanResult {
  success: boolean;
  data?: QRScanData;
  error?: string;
}

export interface QRScanData {
  table_id?: string;
  session_id?: string;
  menu_url?: string;
  timestamp?: string;
  rawValue?: string;
}

// ========================================
// 📱 MENU ACCESS LOG
// ========================================
export interface MenuAccessLog {
  id: string;
  table_id: string;
  session_id: string;
  access_time: string;
  timestamp?: string;
  duration?: number;
  pages_viewed?: number;
  items_viewed?: number;
  type?: string;
  created_at?: string;
}

export interface MenuAccessAggregatedStats {
  date: string;
  total_accesses: number;
  unique_tables: number;
  avg_duration: number;
  total_pages_viewed: number;
  total_items_viewed: number;
  peak_hour: string;
}

// ========================================
// 🏢 SYSTEM SETTINGS
// ========================================
export interface SystemSettings {
  restaurantName?: string;
  nif?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  currency?: string;
  taxPercentage?: number;
  regimeIVA?: string;
  motivoIsencao?: string;
  agtCertificate?: string;
  openDrawerCode?: string;
}

// ========================================
// 📦 FORNECEDOR (SUPPLIER)
// ========================================
export interface Fornecedor {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  nif?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// ========================================
// 🆔 UUID TYPE
// ========================================
export type UUID = string;

// ========================================
// 📊 ANALYTICS TYPES
// ========================================
export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  activeOrders: number;
}

export interface DailyAnalytics {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalProfit?: number; // Adicionado para compatibilidade
  orderCount?: number; // Adicionado para compatibilidade  
  paymentMethods?: Record<string, number>;
}

export interface MenuAnalytics {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

// ========================================
// 🏆 REGRA FINAL: CÓDIGO É ESPELHO DO BANCO
// ========================================
/*
📋 CHECKLIST OBRIGATÓRIO:
✅ Usar snake_case em TODOS os campos do banco
✅ NÃO enviar created_at/updated_at (Supabase usa DEFAULT NOW())
✅ NÃO inventar campos que não existem no schema
✅ Verificar schema antes de codar
✅ Adaptar código ao banco, não banco ao código

🔥 EXEMPLOS:
✅ CORRETO: customer_name, table_id, order_number, tax_total
❌ ERRADO: customerName, tableId, orderNumber, taxTotal

🚀 RESULTADO:
Zero erros de 'column does not exist'
Código 100% compatível com Supabase
Sistema resiliente a mudanças de schema
*/
