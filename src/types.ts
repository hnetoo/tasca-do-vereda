import { InferSelectModel } from 'drizzle-orm';
import { 
  dishes, menuCategories, orders, orderItems, 
  transactions, expenses, employees, attendanceRecords, 
  suppliers, restaurantTables, auditLogs, stockItems,
  payrollRecords, cashShifts, revenues 
} from './db/schema';

export type AnyRecord = any;

export type Dish = typeof dishes.$inferSelect & {
  // Runtime extensions / Missing from Schema
  track_stock?: boolean;
  stock_quantity?: number;
  stock?: number; // Legacy alias
  min_stock_quantity?: number;
  unit?: string;
  supplier_id?: string;

  // Legacy aliases (optional, for compatibility)
  category_id?: string;
  image_url?: string;
  tax_code?: string;
  is_active?: boolean;
  is_available_on_digital_menu?: boolean;
  parent_id?: string; // For recursive categories if needed
};

export type MenuCategory = typeof menuCategories.$inferSelect & {
  // Runtime extensions
  parent_id?: string;
  parentId?: string; // CamelCase alias
  is_available_on_digital_menu?: boolean;
  availableOnDigitalMenu?: boolean; // CamelCase alias
  deletedAt?: string | Date;
  
  // Legacy aliases
  sort_order?: number;
  is_active?: boolean;
};
export type Category = MenuCategory;
export type OrderItem = typeof orderItems.$inferSelect & {
  // Runtime / Local DB extensions
  taxAmount?: number;
  taxPercentage?: number;
  taxCode?: string;
};

export type UUID = string;

export type PaymentMethod = 'CASH' | 'CARD' | 'MULTIBANCO' | 'MBWAY' | 'TRANSFER' | 'OUTRO' | 'NUMERARIO' | 'TPA' | 'TRANSFERENCIA' | 'QR_CODE' | 'CONTA_CORRENTE';

export interface OrderPayment {
  id?: any;
  method: PaymentMethod;
  amount: number;
  date?: string;
  timestamp?: string;
}

export type Order = typeof orders.$inferSelect & {
  items?: (OrderItem & { dish?: Dish; product?: Dish })[];
  payments?: OrderPayment[];
  paymentMethod?: PaymentMethod; // Schema has paymentMethod as text, this types it strictly?
  splitPayments?: { method: PaymentMethod; amount: number }[]; // Schema has jsonb
  timestamp?: string | Date; // Schema has createdAt
  customerName?: string; // Schema has customerName
  orderNumber?: string; // Runtime extension
};

export type Profile = AnyRecord;
export type Customer = AnyRecord;

export type Transaction = typeof transactions.$inferSelect & {
  created_at?: string; // Legacy support
  payment_method?: string; // Legacy support
};

export type Payment = AnyRecord;

export type Expense = typeof expenses.$inferSelect & {
  paymentMethod?: PaymentMethod | string;
  payment_method?: PaymentMethod | string; // Legacy support
  supplier_id?: string; // Legacy support
  created_at?: string; // Legacy support
};

export type FixedExpense = AnyRecord;

export type Supplier = typeof suppliers.$inferSelect;

export type StockItem = typeof stockItems.$inferSelect & {
  // Add any other relevant fields if they appear in useStore or inventory page
  createdAt?: Date;
  updatedAt?: Date;
};

export type Table = typeof restaurantTables.$inferSelect & {
  activeOrderIds?: string[]; // Runtime extension
  seats?: number;
  width?: number;
  height?: number;
  shape?: string;
  rotation?: number;
  groupId?: string;
  label?: string;
  color?: string;
  userId?: string;
};
export type TableZone = 'INTERIOR' | 'EXTERIOR' | 'BALCAO';

export type AuditLog = typeof auditLogs.$inferSelect;
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
  tableId: UUID;
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

export type Employee = typeof employees.$inferSelect & {
  // Add any runtime properties not in DB but used in UI
  color?: string;
  workDaysPerMonth?: number;
  dailyWorkHours?: number;
  externalBioId?: string;
  // Legacy aliases if needed
  [key: string]: any; 
};

export type Role = string;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect & {
  clockInMethod?: string | null;
  clockOutMethod?: string | null;
  // Legacy or computed
  isLate?: boolean;
  lateMinutes?: number;
  overtimeHours?: number;
  isAbsence?: boolean;
  source?: string;
  status?: string;
  notes?: string;
};

export interface WorkShift {
  id: UUID;
  employeeId: UUID;
  date: Date;
  startTime: Date;
  endTime: Date;
  shiftType: string;
  notes?: string;
}

// --- Missing Types for Finance/Analytics ---

export interface DailySalesAnalytics {
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  averageTicket: number;
  date: string;
}

export interface MenuAnalytics {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
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
  action: string;
  entityType?: 'DISH' | 'CATEGORY' | 'ORDER' | 'EMPLOYEE' | 'TABLE' | 'STOCK_ITEM';
  entityId?: UUID;
  type?: 'INVALID_CATEGORY' | 'NO_IMAGE' | 'DUPLICATE_ID' | 'NEGATIVE_PRICE' | 'LOOP_REFERENCE' | 'INTEGRITY_CHECK';
  timestamp?: number;
  isResolved?: boolean;
}

export interface Analytics {
  [key: string]: any;
}

export interface AIAnalysisResult {
  [key: string]: any;
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

export type PaymentCorrection = any;
export type StoreState = any; // Circular dependency avoidance, or define partial

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface SystemSettings {
  id: string;
  restaurantName: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
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
  
  [key: string]: any;
}

export type Fornecedor = Supplier;
export type IntegrationLog = any;

export interface CustomerDisplayEvent {
  type: 'order_update' | 'status_change' | 'new_order' | 'clear_display' | string;
  order?: Order; // Assuming it might carry order information
  message?: string;
  // Add other properties as needed
  [key: string]: any;
}

export interface MenuAccessStats {
  date: string;
  totalAccesses: number;
  uniqueAccesses: number;
  qrCodeScans: number;
  type: string;
  timestamp: string;
  tableId?: string;
  // Adicione outras propriedades relevantes se existirem no contexto da aplicação
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
