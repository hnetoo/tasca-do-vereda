-- Enable Realtime for all critical financial and operational tables
-- This ensures the Owner Dashboard receives instant updates

BEGIN;

-- 1. Enable Realtime Publication for specific tables
-- We check if publication exists, if not create it, if yes add tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE 
            orders, 
            transactions, 
            expenses, 
            revenues, 
            cash_shifts, 
            employees, 
            restaurant_tables,
            order_items;
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            orders, 
            transactions, 
            expenses, 
            revenues, 
            cash_shifts, 
            employees, 
            restaurant_tables,
            order_items;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if table already in publication
END
$$;

-- 2. Ensure RLS is enabled for all these tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. Configure RLS Policies for Transactions
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete for all users" ON transactions;

CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- 4. Configure RLS Policies for Expenses
DROP POLICY IF EXISTS "Enable insert for all users" ON expenses;
DROP POLICY IF EXISTS "Enable update for all users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for all users" ON expenses;
-- Also ensure Read is there (might be redundant but safe)
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;

CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- 5. Configure RLS Policies for Revenues
DROP POLICY IF EXISTS "Enable insert for all users" ON revenues;
DROP POLICY IF EXISTS "Enable update for all users" ON revenues;
DROP POLICY IF EXISTS "Enable delete for all users" ON revenues;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenues;

CREATE POLICY "Enable read access for all users" ON revenues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON revenues FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON revenues FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON revenues FOR DELETE TO anon, authenticated USING (true);

-- 6. Configure RLS Policies for Cash Shifts
DROP POLICY IF EXISTS "Enable insert for all users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable update for all users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable delete for all users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable read access for all users" ON cash_shifts;

CREATE POLICY "Enable read access for all users" ON cash_shifts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON cash_shifts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON cash_shifts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON cash_shifts FOR DELETE TO anon, authenticated USING (true);

-- 7. Configure RLS Policies for Employees
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for all users" ON employees;
DROP POLICY IF EXISTS "Enable update for all users" ON employees;
DROP POLICY IF EXISTS "Enable delete for all users" ON employees;

CREATE POLICY "Enable read access for all users" ON employees FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON employees FOR DELETE TO anon, authenticated USING (true);

-- 8. Configure RLS Policies for Restaurant Tables
DROP POLICY IF EXISTS "Enable read access for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable insert for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable update for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable delete for all users" ON restaurant_tables;

CREATE POLICY "Enable read access for all users" ON restaurant_tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable insert for all users" ON restaurant_tables FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON restaurant_tables FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON restaurant_tables FOR DELETE TO anon, authenticated USING (true);

-- 9. Grant Permissions to Anon/Authenticated Roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMIT;
