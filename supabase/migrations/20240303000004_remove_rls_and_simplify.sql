-- =============================================
-- REMOVER RLS E SIMPLIFICAR PERMISSÕES
-- =============================================

-- Remover RLS de todas as tabelas para simplificar
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies existentes
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON payroll;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON dishes;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON menu_categories;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON settings;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON roles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON deliveries;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON revenues;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON stock_items;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON attendance_records;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON daily_analytics;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON audit_logs;

-- Criar policies simples de leitura para todos (sem autenticação)
CREATE POLICY "Allow all reads" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON payroll FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON dishes FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON roles FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON cash_shifts FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON deliveries FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON revenues FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON stock_items FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON daily_analytics FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON audit_logs FOR SELECT USING (true);

-- Criar policies de INSERT/UPDATE/DELETE para todos (sem autenticação)
CREATE POLICY "Allow all inserts" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON employees FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON orders FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON expenses FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON payroll FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON payroll FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON dishes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON dishes FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON dishes FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON menu_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON menu_categories FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON menu_categories FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON restaurant_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON restaurant_tables FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON restaurant_tables FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON reservations FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON reservations FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON settings FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON roles FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON roles FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON suppliers FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON order_items FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON cash_shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON cash_shifts FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON cash_shifts FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON deliveries FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON deliveries FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON revenues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON revenues FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON revenues FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON transactions FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON stock_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON stock_items FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON stock_items FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON attendance_records FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON daily_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON daily_analytics FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON daily_analytics FOR DELETE USING (true);

CREATE POLICY "Allow all inserts" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON audit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON audit_logs FOR DELETE USING (true);

-- Reabilitar RLS apenas nas tabelas principais (se necessário)
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
