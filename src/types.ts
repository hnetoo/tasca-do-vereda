export type AnyRecord = any;

export type Profile = AnyRecord;
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
export type AuditLog = AnyRecord;
export type OfflineQueue = AnyRecord;

export interface DailyAnalytics {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProductCost: number;
}

export interface PedidoPayload {
  eventType: 'INSERT' | 'UPDATE';
  new: { 
    id: string; 
    status: string; 
    kitchen_status: string; 
    payment_status: string; 
    delivery_status: string; 
    table_id: number; 
    created_at: string; 
    updated_at: string; 
    [key: string]: unknown 
  };
  old: { id: string; status: string; [key: string]: unknown };
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

export interface StoreState {
  // Auth Slice
  isAuthenticated: boolean;
  login: (pin: string, userId?: string, rememberMe?: boolean) => Promise<boolean>;
  users: User[];
  
  // Operational Slice (assumed)
  settings: SystemSettings;
  isInitialized: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;

  // Analytics Slice
  dailyAnalyticsData: DailyAnalyticsPayload['new'] | null;
  setDailyAnalyticsData: (data: DailyAnalyticsPayload['new'] | null) => void;
  supabaseSyncStatus: SupabaseSyncStatus;
  
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
  id: string;
  restaurantName?: string;
  appLogoUrl?: string;
  qrMenuTitle?: string;
  qrMenuSubtitle?: string;
  qrMenuLogo?: string;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    key: string;
  };
  [key: string]: unknown;
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
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
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
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  failureCount: number;
  lastTriggered?: Date;
}

export interface BiometricDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  type: 'FINGERPRINT' | 'FACIAL' | 'CARD';
  status: 'CONNECTED' | 'DISCONNECTED';
  lastSync?: Date;
  syncInterval?: number;
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
}

export interface BiometricClockEvent {
  externalBioId: string;
  type: string;
  clockTime: string | Date;
  temperature?: number;
  deviceId?: string;
}

export type Revenue = AnyRecord;

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
