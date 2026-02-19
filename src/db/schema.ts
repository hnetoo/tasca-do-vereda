import { pgTable, uuid, text, boolean, real, timestamp, integer, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Menu & Products ---
export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  parentId: uuid('parent_id'),
  isAvailableOnDigitalMenu: boolean('is_available_on_digital_menu').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nif: text('nif'),
  contact: text('contact'),
  email: text('email'),
  address: text('address'),
  category: text('category'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dishes = pgTable('dishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  costPrice: real('cost_price').default(0),
  categoryId: uuid('category_id').references(() => menuCategories.id),
  imageUrl: text('image_url'),
  taxCode: text('tax_code').default('NOR'),
  taxPercentage: real('tax_percentage').default(14),
  preparationTime: integer('preparation_time'),
  isActive: boolean('is_active').default(true),
  available: boolean('available').default(true),
  isAvailableOnDigitalMenu: boolean('is_available_on_digital_menu').default(true),
  trackStock: boolean('track_stock').default(false),
  stockQuantity: real('stock_quantity').default(0),
  minStockQuantity: real('min_stock_quantity').default(0),
  maxStockQuantity: real('max_stock_quantity'),
  unit: text('unit').default('unidade'),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});



// --- Orders ---
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: text('table_id'),
  status: text('status').notNull().default('ABERTO'),
  total: real('total').default(0),
  taxTotal: real('tax_total').default(0),
  userId: uuid('user_id'),
  userName: text('user_name'),
  customerNif: text('customer_nif'),
  customerId: text('customer_id'),
  shiftId: text('shift_id'),
  subAccountName: text('sub_account_name'),
  invoiceNumber: text('invoice_number'),
  hash: text('hash'),
  previousHash: text('previous_hash'),
  signature: text('signature'),
  jwsPayload: jsonb('jws_payload'),
  isSyncedAgt: integer('is_synced_agt').default(0),
  agtSubmissionUuid: text('agt_submission_uuid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  closedAt: timestamp('closed_at'),
  notes: text('notes'),
  paymentMethod: text('payment_method'),
  splitPayments: jsonb('split_payments').$type<{ method: string; amount: number }[]>(),
  customerName: text('customer_name'),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  dishId: uuid('dish_id').references(() => dishes.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  taxAmount: real('tax_amount').default(0),
  taxPercentage: real('tax_percentage').default(14),
  taxCode: text('tax_code').default('NOR'),
  notes: text('notes'),
  status: text('status').default('PENDENTE'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- HR / Employees ---
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  pin: text('pin'),
  phone: text('phone'),
  email: text('email'),
  nif: text('nif'),
  address: text('address'),
  salary: real('salary'),
  isActive: boolean('is_active').default(true),
  admissionDate: date('admission_date'),
  socialSecurityNumber: text('social_security_number'),
  bankAccount: text('bank_account'),
  bi: text('bi'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id),
  date: date('date').notNull(),
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  clockInMethod: text('clock_in_method'),
  clockOutMethod: text('clock_out_method'),
  totalHours: real('total_hours'),
  isLate: boolean('is_late'),
  lateMinutes: integer('late_minutes'),
  overtimeHours: real('overtime_hours'),
  isAbsence: boolean('is_absence'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- Finance ---
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  description: text('description'),
  category: text('category'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});



export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  date: date('date').notNull(),
  category: text('category'),
  paymentMethod: text('payment_method'),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  notes: text('notes'),
  status: text('status').default('PENDENTE'), // PAGO, PENDENTE
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const revenues = pgTable('revenues', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: real('amount').notNull(),
  date: date('date').notNull(),
  category: text('category'),
  description: text('description'),
  paymentMethod: text('payment_method'),
  orderId: uuid('order_id').references(() => orders.id), // Changed type and added reference
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const stockItems = pgTable('stock_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  quantity: real('quantity').default(0),
  unit: text('unit').default('un'),
  minThreshold: real('min_threshold').default(5),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payrollRecords = pgTable('payroll_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').references(() => employees.id),
  amount: real('amount').notNull(),
  date: date('date').notNull(),
  month: integer('month'),
  year: integer('year'),
  status: text('status'),
  netSalary: real('net_salary'),
  baseSalary: real('base_salary'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cashShifts = pgTable('cash_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => employees.id), // Changed type and added reference
  userName: text('user_name'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  openingBalance: real('opening_balance'),
  closingBalance: real('closing_balance'),
  expectedBalance: real('expected_balance'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Operations ---
export const restaurantTables = pgTable('restaurant_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').notNull(),
  name: text('name'),
  zone: text('zone').default('INTERIOR'), // INTERIOR, EXTERIOR, BALCAO
  seats: integer('seats').default(4),
  status: text('status').default('LIVRE'), // LIVRE, OCUPADA, RESERVADA
  x: real('x').default(0),
  y: real('y').default(0),
  width: integer('width').default(1),
  height: integer('height').default(1),
  shape: text('shape'),
  rotation: integer('rotation').default(0),
  groupId: text('group_id'),
  label: text('label'),
  color: text('color'),
  userId: text('user_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull(),
  details: text('details'),
  userId: uuid('user_id'),
  timestamp: timestamp('timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const schema = {
  menuCategories,
  suppliers,
  dishes,
  orders,
  orderItems,
  employees,
  attendanceRecords,
  transactions,
  expenses,
  revenues,
  stockItems,
  payrollRecords,
  cashShifts,
  restaurantTables,
  auditLogs,
};

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  dishes: many(dishes),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  dishes: many(dishes),
  expenses: many(expenses),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [dishes.categoryId],
    references: [menuCategories.id],
  }),
  orderItems: many(orderItems),
  supplier: one(suppliers, {
    fields: [dishes.supplierId],
    references: [suppliers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
  revenues: many(revenues),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
  payrollRecords: many(payrollRecords),
  cashShifts: many(cashShifts),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [expenses.supplierId],
    references: [suppliers.id],
  }),
}));

export const revenuesRelations = relations(revenues, ({ one }) => ({
  order: one(orders, {
    fields: [revenues.orderId],
    references: [orders.id],
  }),
}));

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [payrollRecords.employeeId],
    references: [employees.id],
  }),
}));

export const cashShiftsRelations = relations(cashShifts, ({ one }) => ({
  employee: one(employees, {
    fields: [cashShifts.userId],
    references: [employees.id],
  }),
}));
