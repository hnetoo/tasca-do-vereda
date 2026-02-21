-- A. Setup
ALTER DATABASE postgres SET timezone TO 'Africa/Luanda';

-- B. Tabelas

-- 1. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'staff',
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.menu_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    nif TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Dishes (Products)
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.menu_categories(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER, -- minutes
    tax_percentage NUMERIC(5,2) DEFAULT 14, -- Angola IVA
    cost_price NUMERIC(15,2) DEFAULT 0,
    track_stock BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_quantity INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'un',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- "Mesa 1", "Balcão"
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED
    zone TEXT DEFAULT 'INTERIOR',
    x_position NUMERIC DEFAULT 0,
    y_position NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    nif TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- waiter, chef, manager
    email TEXT,
    phone TEXT,
    nif TEXT,
    salary NUMERIC(15,2),
    is_active BOOLEAN DEFAULT true,
    pin TEXT, -- for POS access
    admission_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Work Shifts
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN',
    opening_balance NUMERIC(15,2) DEFAULT 0,
    closing_balance NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT, -- Generated sequence or ID
    status TEXT DEFAULT 'PENDING', -- PENDING, PREPARING, READY, SERVED, PAID, CANCELLED
    total_amount NUMERIC(15,2) DEFAULT 0,
    tax_total NUMERIC(15,2) DEFAULT 0,
    table_id UUID REFERENCES public.restaurant_tables(id),
    customer_id UUID REFERENCES public.customers(id),
    user_id UUID REFERENCES auth.users(id), -- Who created/managed
    shift_id UUID REFERENCES public.work_shifts(id),
    payment_status TEXT DEFAULT 'UNPAID',
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES public.dishes(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL, -- quantity * unit_price
    notes TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Transactions (Payments)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id),
    amount NUMERIC(15,2) NOT NULL,
    type TEXT NOT NULL, -- PAYMENT, REFUND
    payment_method TEXT NOT NULL, -- CASH, CARD, MULTICAIXA
    status TEXT DEFAULT 'COMPLETED',
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT,
    supplier_id UUID REFERENCES public.suppliers(id),
    status TEXT DEFAULT 'PAID',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Stock Items (Inventory)
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    quantity NUMERIC(15,3) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    min_threshold NUMERIC(15,3) DEFAULT 5,
    cost_price NUMERIC(15,2) DEFAULT 0,
    supplier_id UUID REFERENCES public.suppliers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id),
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'PRESENT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Permissões (GRANTs)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- D. Segurança (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu Categories (Public Read, Auth Write)
CREATE POLICY "Menu categories are viewable by everyone" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert menu categories" ON public.menu_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update menu categories" ON public.menu_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete menu categories" ON public.menu_categories FOR DELETE TO authenticated USING (true);

-- Dishes (Public Read, Auth Write)
CREATE POLICY "Dishes are viewable by everyone" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert dishes" ON public.dishes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update dishes" ON public.dishes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete dishes" ON public.dishes FOR DELETE TO authenticated USING (true);

-- General Authenticated Access for other tables
CREATE POLICY "Authenticated users can do everything on restaurant_tables" ON public.restaurant_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on work_shifts" ON public.work_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on transactions" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on stock_items" ON public.stock_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on attendance_records" ON public.attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything on notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- E. Realtime
-- Add tables to publication (check if publication exists first, but default supabase has it)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_categories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'dishes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_tables') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'work_shifts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_shifts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
