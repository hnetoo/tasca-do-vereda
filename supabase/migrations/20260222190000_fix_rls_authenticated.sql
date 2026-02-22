-- Fix RLS policies to allow BOTH anonymous and authenticated read access
-- This ensures that logged-in users (Admins/Owners) can also see the dashboard data

-- 1. Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE orders TO anon, authenticated;

-- 2. Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE transactions TO anon, authenticated;

-- 3. Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE expenses TO anon, authenticated;

-- 4. Revenues
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenues;
CREATE POLICY "Enable read access for all users" ON revenues FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE revenues TO anon, authenticated;

-- 5. Cash Shifts
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON cash_shifts;
CREATE POLICY "Enable read access for all users" ON cash_shifts FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE cash_shifts TO anon, authenticated;

-- 6. Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE employees TO anon, authenticated;

-- 7. Restaurant Tables
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON restaurant_tables;
CREATE POLICY "Enable read access for all users" ON restaurant_tables FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON TABLE restaurant_tables TO anon, authenticated;
