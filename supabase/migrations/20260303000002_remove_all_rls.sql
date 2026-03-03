-- REMOVER TODAS AS RLS - SEM RESTRIÇÕES
-- Tudo aberto para funcionar sem problemas de segurança

-- Desabilitar RLS apenas nas tabelas que existem
DO $$
BEGIN
    -- Orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own orders" ON orders;
        DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
        DROP POLICY IF EXISTS "Users can update own orders" ON orders;
        DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
        RAISE NOTICE 'Orders RLS removida';
    END IF;
    
    -- Expenses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
        ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
        DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
        RAISE NOTICE 'Expenses RLS removida';
    END IF;
    
    -- Dishes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes' AND table_schema = 'public') THEN
        ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view dishes" ON dishes;
        DROP POLICY IF EXISTS "Users can insert dishes" ON dishes;
        DROP POLICY IF EXISTS "Users can update dishes" ON dishes;
        DROP POLICY IF EXISTS "Users can delete dishes" ON dishes;
        RAISE NOTICE 'Dishes RLS removida';
    END IF;
    
    -- Categories
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view categories" ON categories;
        DROP POLICY IF EXISTS "Users can insert categories" ON categories;
        DROP POLICY IF EXISTS "Users can update categories" ON categories;
        DROP POLICY IF EXISTS "Users can delete categories" ON categories;
        RAISE NOTICE 'Categories RLS removida';
    END IF;
    
    -- Payroll records (não existe, mas vamos verificar por segurança)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_records' AND table_schema = 'public') THEN
        ALTER TABLE payroll_records DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view payroll" ON payroll_records;
        DROP POLICY IF EXISTS "Users can insert payroll" ON payroll_records;
        DROP POLICY IF EXISTS "Users can update payroll" ON payroll_records;
        DROP POLICY IF EXISTS "Users can delete payroll" ON payroll_records;
        RAISE NOTICE 'Payroll records RLS removida';
    END IF;
END $$;

-- Dar permissões totais para todos
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Dar permissões em sequências
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Dar permissões em funções
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
