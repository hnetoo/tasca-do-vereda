// 🏆 SUPABASE SCHEMA TYPES - ESPERHO PERFEITO DO BANCO DE DADOS
// 📋 BASEADO NO ARQUIVO: supabase/migrations/20260306120755_remote_schema.sql
// 🐍 100% SNAKE_CASE - SEM CAMELCASE NOS CAMPOS DO BANCO

// ========================================
// 🍽️ MENU_CATEGORIES
// ========================================
export interface MenuCategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number | null;
  is_available_on_digital_menu: boolean;
  icon: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export type MenuCategory = Partial<MenuCategoryRow> & {
  id: string;
  name: string;
};

// ========================================
// 🍽️ MENU_ITEMS (DISHES)
// ========================================
export interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  preco_custo: number;
  category: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export type MenuItem = Partial<MenuItemRow> & {
  id: string;
  name: string;
  price: number;
};

// ========================================
// 📋 ORDERS
// ========================================
export interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total: number | null;
  tax_total: number | null;
  table_id: string | null;
  customer_id: string | null;
  user_id: string | null;
  user_name: string | null;
  customer_name: string | null;
  customer_nif: string | null;
  shift_id: string | null;
  notes: string | null;
  payment_method: string | null;
  split_payments: any;
  invoice_number: string | null;
  sub_account_name: string | null;
  is_synced_agt: number;
  agt_submission_uuid: string | null;
  hash: string | null;
  previous_hash: string | null;
  signature: string | null;
  jws_payload: any;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  items: any[];
}

export type Order = Partial<OrderRow> & {
  id: string;
  status: string;
  items: any[];
};

// ========================================
// 📋 ORDER_ITEMS
// ========================================
export interface OrderItemRow {
  id: string;
  order_id: string | null;
  dish_id: string | null;
  quantity: number;
  unit_price: number;
  tax_percentage: number | null;
  tax_amount: number | null;
  tax_code: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
}

export type OrderItem = Partial<OrderItemRow> & {
  id: string;
  quantity: number;
  unit_price: number;
};

// ========================================
// 🪑 RESTAURANT_TABLES
// ========================================
export interface RestaurantTableRow {
  id: string;
  number: number;
  status: string;
  capacity: number | null;
  position_x: number | null;
  position_y: number | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export type RestaurantTable = Partial<RestaurantTableRow> & {
  id: string;
  number: number;
  status: string;
};

// ========================================
// 👥 EMPLOYEES
// ========================================
export interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  bi: string | null;
  social_security_number: string | null;
  bank_account: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  color: string | null;
  work_days_per_month: number | null;
}

export type Employee = Partial<EmployeeRow> & {
  id: string;
  name: string;
  role: string;
};

// ========================================
// 💰 EXPENSES
// ========================================
export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export type Expense = Partial<ExpenseRow> & {
  id: string;
  description: string;
  amount: number;
  date: string;
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
};

// ========================================
// 📅 RESERVATIONS
// ========================================
export interface ReservationRow {
  id: string;
  table_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  guests: number;
  date: string;
  time: string;
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

export type Profile = Partial<ProfileRow> & {
  id: string;
  role: string;
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

export type ApiKey = Partial<ApiKeyRow> & {
  id: string;
  name: string;
  status: string;
};

// ========================================
// 📊 INTEGRATION_LOGS
// ========================================
export interface IntegrationLogRow {
  id: string;
  service: string;
  event: string;
  status: string;
  details: any;
  created_at: string;
}

export type IntegrationLog = Partial<IntegrationLogRow> & {
  id: string;
  service: string;
  event: string;
  status: string;
};

// ========================================
// 🎯 TIPOS DE PAGAMENTO
// ========================================
export type PaymentMethod = 'CASH' | 'TPA' | 'TRANSFERENCIA' | 'QR_CODE' | 'SPLIT';

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
export type TableStatus = 'disponível' | 'ocupada' | 'reservada' | 'manutenção';
export type ShiftStatus = 'OPEN' | 'CLOSED';

// ========================================
// 🏆 REGRA FINAL: CÓDIGO É ESPELHO DO BANCO
// ========================================
/*
📋 CHECKLIST OBRIGATÓRIO:
✅ Usar snake_case em TODOS os campos
✅ NÃO inventar campos que não existem
✅ NÃO enviar created_at/updated_at (Supabase usa DEFAULT NOW())
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
