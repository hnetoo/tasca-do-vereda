-- Disable RLS on all tables and grant full permissions
-- This will disable Row Level Security and grant full permissions

-- Disable RLS on all tables
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to anon and authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON dishes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dishes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON dishes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON dishes;
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON menu_categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON menu_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON menu_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenues;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON revenues;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON revenues;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON revenues;
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;
