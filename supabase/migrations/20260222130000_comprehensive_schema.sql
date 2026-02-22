
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- FIX TYPES (Compatibility with previous migrations)
-- =================================================================================
DO $$
BEGIN
    -- Check if menu_categories.id is text and convert to uuid
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_categories' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        -- Drop foreign key constraints temporarily if needed, or rely on CASCADE
        -- Converting text UUID to real UUID should work if format is correct
        BEGIN
            ALTER TABLE public.menu_categories ALTER COLUMN id TYPE uuid USING id::uuid;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert menu_categories.id to UUID: %', SQLERRM;
        END;
        
        -- Parent ID
        BEGIN
            ALTER TABLE public.menu_categories ALTER COLUMN parent_id TYPE uuid USING parent_id::uuid;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert menu_categories.parent_id to UUID: %', SQLERRM;
        END;
    END IF;

    -- Check if dishes.id is text and convert to uuid
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dishes' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        BEGIN
            ALTER TABLE public.dishes ALTER COLUMN id TYPE uuid USING id::uuid;
        EXCEPTION WHEN OTHERS THEN
             RAISE NOTICE 'Could not convert dishes.id to UUID: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.dishes ALTER COLUMN category_id TYPE uuid USING category_id::uuid;
        EXCEPTION WHEN OTHERS THEN
             RAISE NOTICE 'Could not convert dishes.category_id to UUID: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.dishes ALTER COLUMN supplier_id TYPE uuid USING supplier_id::uuid;
        EXCEPTION WHEN OTHERS THEN
             RAISE NOTICE 'Could not convert dishes.supplier_id to UUID: %', SQLERRM;
        END;
    END IF;
END $$;

-- Create a function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =================================================================================
-- 1. EMPLOYEES (Users of the system)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'KITCHEN', 'BAR')),
    pin TEXT, -- Encrypted or hashed PIN
    email TEXT UNIQUE,
    phone TEXT,
    nif TEXT,
    address TEXT,
    social_security_number TEXT,
    admission_date DATE,
    is_active BOOLEAN DEFAULT true,
    salary NUMERIC(10, 2),
    daily_work_hours NUMERIC(4, 2),
    work_days_per_month INTEGER,
    bank_account TEXT,
    bi TEXT,
    color TEXT,
    external_bio_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 2. CUSTOMERS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    nif TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 3. MENU CATEGORIES
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER,
    parent_id UUID REFERENCES public.menu_categories(id),
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 4. SUPPLIERS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    nif TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 5. DISHES (Menu Items)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.menu_categories(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2),
    image_url TEXT,
    preparation_time INTEGER, -- in minutes
    tax_percentage NUMERIC(5, 2),
    tax_code TEXT,
    unit TEXT DEFAULT 'un',
    stock_quantity NUMERIC(10, 3),
    min_stock_quantity NUMERIC(10, 3),
    max_stock_quantity NUMERIC(10, 3),
    track_stock BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'AVAILABLE',
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    available BOOLEAN DEFAULT true, -- redundant with status, but kept for compatibility
    user_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS update_dishes_updated_at ON public.dishes;
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 6. STOCK ITEMS (Inventory)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity NUMERIC(10, 3) DEFAULT 0,
    unit TEXT DEFAULT 'un',
    min_threshold NUMERIC(10, 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_stock_items_updated_at ON public.stock_items;
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 7. RESTAURANT TABLES
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    status TEXT DEFAULT 'LIVRE', -- LIVRE, OCUPADA, RESERVADA, PAGAMENTO
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 100,
    height INTEGER DEFAULT 100,
    shape TEXT DEFAULT 'rectangle',
    rotation INTEGER DEFAULT 0,
    color TEXT DEFAULT '#ffffff',
    zone TEXT DEFAULT 'MAIN',
    group_id TEXT,
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_restaurant_tables_updated_at ON public.restaurant_tables;
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 8. CASH SHIFTS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.employees(id),
    user_name TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    opening_balance NUMERIC(10, 2) DEFAULT 0,
    closing_balance NUMERIC(10, 2),
    expected_balance NUMERIC(10, 2),
    sales_breakdown JSONB, -- For storing detailed sales data per method
    status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_cash_shifts_updated_at ON public.cash_shifts;
CREATE TRIGGER update_cash_shifts_updated_at BEFORE UPDATE ON public.cash_shifts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 9. ORDERS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT,
    customer_id UUID REFERENCES public.customers(id),
    table_id UUID REFERENCES public.restaurant_tables(id),
    shift_id UUID REFERENCES public.cash_shifts(id),
    user_id UUID REFERENCES public.employees(id),
    user_name TEXT,
    status TEXT DEFAULT 'OPEN', -- OPEN, PREPARING, READY, DELIVERED, COMPLETED, CANCELLED
    total NUMERIC(10, 2) DEFAULT 0,
    tax_total NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    payment_method TEXT,
    split_payments JSONB,
    invoice_number TEXT,
    hash TEXT,
    previous_hash TEXT,
    signature TEXT,
    jws_payload JSONB,
    is_synced_agt INTEGER DEFAULT 0,
    agt_submission_uuid TEXT,
    customer_name TEXT,
    customer_nif TEXT,
    sub_account_name TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 10. ORDER ITEMS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES public.dishes(id),
    quantity NUMERIC(10, 3) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    tax_percentage NUMERIC(5, 2),
    tax_code TEXT,
    tax_amount NUMERIC(10, 2),
    notes TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, PREPARING, READY, SERVED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 11. EXPENSES
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    category TEXT,
    payment_method TEXT,
    supplier_id UUID REFERENCES public.suppliers(id),
    notes TEXT,
    status TEXT DEFAULT 'PAID',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 12. REVENUES
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    category TEXT,
    payment_method TEXT,
    order_id UUID REFERENCES public.orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_revenues_updated_at ON public.revenues;
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 13. PAYROLL RECORDS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id),
    amount NUMERIC(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT,
    month INTEGER,
    year INTEGER,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 14. TRANSACTIONS (Consolidated View/Table)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL, -- INCOME, EXPENSE
    category TEXT,
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT,
    order_id UUID REFERENCES public.orders(id),
    shift_id UUID REFERENCES public.cash_shifts(id),
    expense_id UUID REFERENCES public.expenses(id),
    revenue_id UUID REFERENCES public.revenues(id),
    payroll_id UUID REFERENCES public.payroll_records(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 15. DELIVERIES
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id),
    driver_name TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'PENDING',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================================
-- 16. AUDIT LOGS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.employees(id),
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 17. DAILY ANALYTICS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.daily_analytics (
    date DATE PRIMARY KEY,
    total_revenue NUMERIC(10, 2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_ticket NUMERIC(10, 2) DEFAULT 0,
    total_expenses NUMERIC(10, 2) DEFAULT 0,
    net_profit NUMERIC(10, 2) DEFAULT 0,
    total_product_cost NUMERIC(10, 2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 18. NOTIFICATIONS
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.employees(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =================================================================================

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.employees WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('ADMIN', 'OWNER') FROM public.employees WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES
DO $$
DECLARE
    r RECORD;
    t RECORD;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = t.table_name) LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public."' || t.table_name || '"';
        END LOOP;
    END LOOP;
END $$;

-- Policies

-- 1. EMPLOYEES
CREATE POLICY "Admins/Owners can do everything on employees" ON public.employees FOR ALL USING (is_admin_or_owner());
CREATE POLICY "Staff can read employees" ON public.employees FOR SELECT USING (auth.role() = 'authenticated');

-- 2. MENU & STOCK
CREATE POLICY "Public can read menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Public can read dishes" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Admins/Owners can modify menu categories" ON public.menu_categories FOR ALL USING (is_admin_or_owner());
CREATE POLICY "Admins/Owners can modify dishes" ON public.dishes FOR ALL USING (is_admin_or_owner());

CREATE POLICY "Staff can read stock" ON public.stock_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins/Owners can manage stock" ON public.stock_items FOR ALL USING (is_admin_or_owner());

-- 3. ORDERS & ITEMS
CREATE POLICY "Staff can read orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can create orders" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can read order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can create order items" ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Staff can update order items" ON public.order_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can delete order items" ON public.order_items FOR DELETE USING (auth.role() = 'authenticated');

-- 4. TABLES
CREATE POLICY "Staff can read tables" ON public.restaurant_tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can update tables" ON public.restaurant_tables FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins/Owners can manage tables" ON public.restaurant_tables FOR ALL USING (is_admin_or_owner());

-- 5. FINANCIALS
CREATE POLICY "Admins/Owners can manage expenses" ON public.expenses FOR ALL USING (is_admin_or_owner());
CREATE POLICY "Admins/Owners can manage revenues" ON public.revenues FOR ALL USING (is_admin_or_owner());
CREATE POLICY "Admins/Owners can manage payroll" ON public.payroll_records FOR ALL USING (is_admin_or_owner());
CREATE POLICY "Admins/Owners can manage transactions" ON public.transactions FOR ALL USING (is_admin_or_owner());

CREATE POLICY "Staff can manage their own shifts" ON public.cash_shifts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins/Owners can manage all shifts" ON public.cash_shifts FOR ALL USING (is_admin_or_owner());

-- 6. CUSTOMERS & OTHERS
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (is_admin_or_owner());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can read analytics" ON public.daily_analytics FOR SELECT USING (is_admin_or_owner());

CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- =================================================================================
-- REALTIME
-- =================================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['orders', 'order_items', 'restaurant_tables', 'expenses', 'revenues', 'payroll_records', 'transactions', 'cash_shifts', 'stock_items', 'notifications']) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = t) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END $$;

-- =================================================================================
-- FINANCIAL TRIGGERS (Auto-populate transactions)
-- =================================================================================

-- 1. EXPENSES TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_expense()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        amount, type, category, description, date, payment_method, expense_id
    ) VALUES (
        NEW.amount, 'EXPENSE', NEW.category, NEW.description, NEW.created_at, NEW.payment_method, NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_expense_insert ON public.expenses;
CREATE TRIGGER on_expense_insert
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_expense();

-- 2. REVENUES TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_revenue()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        amount, type, category, description, date, payment_method, revenue_id
    ) VALUES (
        NEW.amount, 'INCOME', NEW.category, NEW.description, NEW.created_at, NEW.payment_method, NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_revenue_insert ON public.revenues;
CREATE TRIGGER on_revenue_insert
AFTER INSERT ON public.revenues
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_revenue();

-- 3. PAYROLL TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_payroll()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.transactions (
        amount, type, category, description, date, payment_method, payroll_id
    ) VALUES (
        NEW.amount, 'EXPENSE', 'Salários', 'Pagamento de Salário', NEW.created_at, NEW.payment_method, NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payroll_insert ON public.payroll_records;
CREATE TRIGGER on_payroll_insert
AFTER INSERT ON public.payroll_records
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_payroll();

-- 4. ORDERS TRIGGER (When Completed/Paid)
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if status changed to COMPLETED/PAID/DELIVERED and wasn't before
    -- Or if closed_at is set (preferred indicator of financial closure)
    IF (NEW.status IN ('COMPLETED', 'PAID', 'DELIVERED') AND OLD.status NOT IN ('COMPLETED', 'PAID', 'DELIVERED')) 
       OR (NEW.closed_at IS NOT NULL AND OLD.closed_at IS NULL) THEN
        
        -- Check if transaction already exists to avoid duplicates (optional but safe)
        IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE order_id = NEW.id) THEN
            INSERT INTO public.transactions (
                amount, type, category, description, date, payment_method, order_id, shift_id
            ) VALUES (
                NEW.total, 'INCOME', 'Vendas', 'Pedido #' || COALESCE(NEW.order_number, 'N/A'), NOW(), NEW.payment_method, NEW.id, NEW.shift_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_completion ON public.orders;
CREATE TRIGGER on_order_completion
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.handle_order_completion();

