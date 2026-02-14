-- SQL Script to initialize DLP tables in Supabase for Tasca do Vereda

-- 1. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    context TEXT
);

-- 2. Backups Metadata Table
CREATE TABLE IF NOT EXISTS public.backups (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    hash TEXT NOT NULL,
    size INTEGER NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB NOT NULL
);

-- 3. Ensure existing tables for Sync
-- (These are usually already created, but including for completeness)

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    parent_id TEXT,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id TEXT REFERENCES public.categories(id),
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    tax_rate INTEGER DEFAULT 14
);

CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id TEXT PRIMARY KEY,
    name TEXT,
    logo_url TEXT,
    currency TEXT,
    phone TEXT,
    address TEXT,
    wifi_name TEXT,
    wifi_password TEXT,
    qr_code_title TEXT,
    qr_code_subtitle TEXT,
    qr_code_short_code TEXT
);

CREATE TABLE IF NOT EXISTS public.dashboard_summary (
    id TEXT PRIMARY KEY,
    total_revenue DECIMAL(15,2),
    total_orders INTEGER,
    active_orders_count INTEGER,
    last_updated TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.active_orders_snapshot (
    id TEXT PRIMARY KEY,
    table_id TEXT,
    status TEXT,
    total DECIMAL(10,2),
    items_count INTEGER,
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 9. Analytics Table (Fix for "already exists" error in Realtime)
-- We check if the table exists to avoid errors.
-- The user reported: "relacionamento 'analytics' já existe em 'supabase_realtime'"
-- This usually happens when the table is already enabled for Realtime.
CREATE TABLE IF NOT EXISTS public.analytics (
    id BIGSERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_data JSONB,
    user_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We don't use DO block for simple CREATE TABLE IF NOT EXISTS
-- The error "relacionamento 'analytics' já existe em 'supabase_realtime'"
-- often means the table is already in the publication.

-- 10. Financial Tables (Suppliers, Stock, Revenues, Expenses)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    nif TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    categoria TEXT
);

CREATE TABLE IF NOT EXISTS public.stock_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'un',
    min_threshold REAL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS public.revenues (
    id TEXT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    category TEXT,
    description TEXT,
    payment_method TEXT
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    category TEXT,
    description TEXT,
    status TEXT
);

-- 11. Tables and Infrastructure
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    status TEXT DEFAULT 'LIVRE',
    current_order_id TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    zone TEXT DEFAULT 'INTERIOR',
    shape TEXT DEFAULT 'SQUARE',
    rotation INTEGER DEFAULT 0,
    groupId TEXT,
    label TEXT,
    color TEXT,
    userId TEXT
);

-- 12. Transactional Data (Orders & Items)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    table_id INTEGER,
    status TEXT DEFAULT 'ABERTO',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    total DECIMAL(15,2) DEFAULT 0,
    tax_total DECIMAL(15,2) DEFAULT 0,
    payment_method TEXT,
    customer_id TEXT,
    shift_id TEXT,
    sub_account_name TEXT,
    invoice_number TEXT,
    hash TEXT
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'PENDENTE'
);

-- 13. HR and Payroll
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    salary DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'ATIVO',
    color TEXT,
    work_days_per_month INTEGER DEFAULT 22,
    daily_work_hours INTEGER DEFAULT 8,
    external_bio_id TEXT,
    bi TEXT,
    nif TEXT
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    total_hours REAL DEFAULT 0,
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INTEGER DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    is_absence BOOLEAN DEFAULT FALSE,
    status TEXT,
    justification TEXT,
    source TEXT DEFAULT 'MANUAL'
);

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    amount DECIMAL(15,2),
    date TIMESTAMPTZ,
    month INTEGER,
    year INTEGER,
    status TEXT,
    net_salary DECIMAL(15,2),
    base_salary DECIMAL(15,2),
    notes TEXT
);

-- 14. Shifts
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    opening_balance DECIMAL(15,2),
    closing_balance DECIMAL(15,2),
    expected_balance DECIMAL(15,2),
    status TEXT
);

-- Enable Row Level Security (RLS) or add indexes as needed
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics(timestamp);

