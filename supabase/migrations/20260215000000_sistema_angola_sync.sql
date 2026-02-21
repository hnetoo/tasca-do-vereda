-- Enable UUID extension (optional for older PG versions, but good practice to have pgcrypto if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT,
    phone TEXT,
    email TEXT,
    nif TEXT,
    address TEXT,
    salary NUMERIC(15,2),
    is_active BOOLEAN DEFAULT true,
    admission_date TIMESTAMP WITH TIME ZONE,
    social_security_number TEXT,
    bank_account TEXT,
    bi TEXT,
    work_days_per_month INTEGER,
    daily_work_hours NUMERIC,
    external_bio_id TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Menu Categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES menu_categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    icon TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    nif TEXT,
    address TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nif TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Restaurant Tables
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    name TEXT,
    seats INTEGER,
    zone TEXT,
    shape TEXT,
    x NUMERIC,
    y NUMERIC,
    width NUMERIC,
    height NUMERIC,
    rotation NUMERIC,
    status TEXT DEFAULT 'AVAILABLE',
    is_active BOOLEAN DEFAULT true,
    group_id UUID,
    color TEXT,
    label TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Stock Items
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    min_threshold NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Settings
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT,
    nif TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_percentage NUMERIC,
    currency TEXT DEFAULT 'Kz',
    timezone TEXT DEFAULT 'Africa/Luanda',
    language TEXT DEFAULT 'pt',
    logo_url TEXT,
    app_logo_url TEXT,
    wifi_name TEXT,
    wifi_password TEXT,
    qr_code_title TEXT,
    qr_code_subtitle TEXT,
    qr_code_short_code TEXT,
    qr_menu_url TEXT,
    qr_menu_cloud_url TEXT,
    admin_pin TEXT,
    open_drawer_code TEXT,
    api_token TEXT,
    agt_certificate TEXT,
    printer_config JSONB,
    backup_config JSONB,
    supabase_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT,
    payment_method TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Dishes
CREATE TABLE dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES menu_categories(id),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    tax_percentage NUMERIC,
    tax_code TEXT,
    preparation_time INTEGER,
    track_stock BOOLEAN DEFAULT false,
    stock_quantity NUMERIC,
    min_stock_quantity NUMERIC,
    max_stock_quantity NUMERIC,
    supplier_id UUID REFERENCES suppliers(id),
    unit TEXT,
    cost_price NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Cash Shifts
CREATE TABLE cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES employees(id),
    user_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(15,2),
    closing_balance NUMERIC(15,2),
    expected_balance NUMERIC(15,2),
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT,
    status TEXT NOT NULL,
    total NUMERIC(15,2),
    tax_total NUMERIC(15,2),
    table_id UUID REFERENCES restaurant_tables(id),
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES employees(id),
    user_name TEXT,
    customer_name TEXT,
    customer_nif TEXT,
    shift_id UUID REFERENCES cash_shifts(id),
    notes TEXT,
    payment_method TEXT,
    split_payments JSONB,
    invoice_number TEXT,
    sub_account_name TEXT,
    is_synced_agt INTEGER DEFAULT 0,
    agt_submission_uuid TEXT,
    hash TEXT,
    previous_hash TEXT,
    signature TEXT,
    jws_payload JSONB,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES dishes(id),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    tax_percentage NUMERIC,
    tax_amount NUMERIC(15,2),
    tax_code TEXT,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_method TEXT,
    clock_out_method TEXT,
    total_hours NUMERIC,
    is_late BOOLEAN,
    late_minutes INTEGER,
    overtime_hours NUMERIC,
    is_absence BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Deliveries
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    driver_name TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    status TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    payment_method TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    notes TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Payroll Records
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    month INTEGER,
    year INTEGER,
    date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    base_salary NUMERIC(15,2),
    net_salary NUMERIC(15,2),
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES restaurant_tables(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Revenues
CREATE TABLE revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    payment_method TEXT,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable all for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON menu_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON restaurant_tables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON stock_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON dishes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON cash_shifts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON attendance_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON deliveries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON payroll_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON reservations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON revenues FOR ALL USING (auth.role() = 'authenticated');

-- Public Access Policies
CREATE POLICY "Allow public read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON dishes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON settings FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
