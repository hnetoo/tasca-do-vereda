-- Fix RLS policies to allow anonymous read access for the dashboard
-- This is necessary because we removed Supabase Auth, so the client connects as 'anon'.

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT TO anon USING (true);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT TO anon USING (true);

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
CREATE POLICY "Enable read access for all users" ON employees FOR SELECT TO anon USING (true);

-- Restaurant Tables (Correct name)
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON restaurant_tables;
CREATE POLICY "Enable read access for all users" ON restaurant_tables FOR SELECT TO anon USING (true);

-- Grant SELECT permission to anon role
GRANT SELECT ON TABLE orders TO anon;
GRANT SELECT ON TABLE transactions TO anon;
GRANT SELECT ON TABLE employees TO anon;
GRANT SELECT ON TABLE restaurant_tables TO anon;
