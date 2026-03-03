-- =============================================
-- REMOVER TRIGGERS EXISTENTES E REPRODUZIR COM NOMES DIFERENTES
-- =============================================

-- Remover triggers existentes para evitar conflitos
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_dishes_updated_at ON dishes;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Recriar função de atualização com nome diferente
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recriar triggers com nomes únicos
CREATE TRIGGER employees_timestamp_update BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER dishes_timestamp_update BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER orders_timestamp_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER expenses_timestamp_update BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER payroll_timestamp_update BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER reservations_timestamp_update BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER settings_timestamp_update BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
