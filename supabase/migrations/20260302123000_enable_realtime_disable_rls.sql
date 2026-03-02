-- Configurar todas as tabelas para Realtime e remover RLS
-- Habilitar Realtime para todas as tabelas principais (se ainda não estiverem)
DO $$
BEGIN
    -- Orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
    
    -- Dishes
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dishes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
    END IF;
    
    -- Menu Categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
    END IF;
    
    -- Expenses
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
    END IF;
    
    -- Revenues
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'revenues'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE revenues;
    END IF;
    
    -- Employees
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE employees;
    END IF;
    
    -- Cash Shifts
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cash_shifts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts;
    END IF;
    
    -- Restaurant Tables
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'restaurant_tables'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
    END IF;
    
    -- Customers
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'customers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE customers;
    END IF;
    
    -- Transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
    END IF;
END $$;

-- Desabilitar RLS para todas as tabelas (acesso total)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for all users" ON orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON orders;

DROP POLICY IF EXISTS "Enable read access for all users" ON dishes;
DROP POLICY IF EXISTS "Enable insert for all users" ON dishes;
DROP POLICY IF EXISTS "Enable update for all users" ON dishes;
DROP POLICY IF EXISTS "Enable delete for all users" ON dishes;

DROP POLICY IF EXISTS "Enable read access for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable update for all users" ON menu_categories;
DROP POLICY IF EXISTS "Enable delete for all users" ON menu_categories;

DROP POLICY IF EXISTS "Enable insert for all users" ON expenses;
DROP POLICY IF EXISTS "Enable update for all users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for all users" ON expenses;

DROP POLICY IF EXISTS "Enable insert for all users" ON revenues;
DROP POLICY IF EXISTS "Enable update for all users" ON revenues;
DROP POLICY IF EXISTS "Enable delete for all users" ON revenues;

DROP POLICY IF EXISTS "Enable insert for all users" ON employees;
DROP POLICY IF EXISTS "Enable update for all users" ON employees;
DROP POLICY IF EXISTS "Enable delete for all users" ON employees;

DROP POLICY IF EXISTS "Enable insert for all users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable update for all users" ON cash_shifts;
DROP POLICY IF EXISTS "Enable delete for all users" ON cash_shifts;

DROP POLICY IF EXISTS "Enable insert for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable update for all users" ON restaurant_tables;
DROP POLICY IF EXISTS "Enable delete for all users" ON restaurant_tables;

DROP POLICY IF EXISTS "Enable insert for all users" ON customers;
DROP POLICY IF EXISTS "Enable update for all users" ON customers;
DROP POLICY IF EXISTS "Enable delete for all users" ON customers;

DROP POLICY IF EXISTS "Enable insert for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete for all users" ON transactions;

-- Conceder permissões totais em todas as tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Conceder permissões de usage no schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Forçar refresh das permissões
ALTER TABLE orders OWNER TO postgres;
ALTER TABLE dishes OWNER TO postgres;
ALTER TABLE menu_categories OWNER TO postgres;
ALTER TABLE expenses OWNER TO postgres;
ALTER TABLE revenues OWNER TO postgres;
ALTER TABLE employees OWNER TO postgres;
ALTER TABLE cash_shifts OWNER TO postgres;
ALTER TABLE restaurant_tables OWNER TO postgres;
ALTER TABLE customers OWNER TO postgres;
ALTER TABLE transactions OWNER TO postgres;

-- Analisar tabelas para atualizar estatísticas
ANALYZE orders;
ANALYZE dishes;
ANALYZE menu_categories;
ANALYZE expenses;
ANALYZE revenues;
ANALYZE employees;
ANALYZE cash_shifts;
ANALYZE restaurant_tables;
ANALYZE customers;
ANALYZE transactions;
