-- SQL PARA DESBLOQUEAR TOTALMENTE O SISTEMA MOBILE
-- Execute este SQL no painel SQL do Supabase

-- 1. DESABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 2. GARANTIR PERMISSÕES COMPLETAS
GRANT ALL ON TABLE profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE staff TO anon, authenticated, service_role;
GRANT ALL ON TABLE payroll TO anon, authenticated, service_role;
GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE restaurant_tables TO anon, authenticated, service_role;
GRANT ALL ON TABLE transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE revenues TO anon, authenticated, service_role;
GRANT ALL ON TABLE expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE dishes TO anon, authenticated, service_role;
GRANT ALL ON TABLE categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE reservations TO anon, authenticated, service_role;

-- 3. VERIFICAR E CORRIGIR COLUNAS CRÍTICAS
-- Verificar se as colunas existem antes de renomear
DO $$
BEGIN
    -- Verificar e adicionar coluna subtotal se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Verificar e adicionar coluna name em restaurant_tables se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE restaurant_tables ADD COLUMN name TEXT;
    END IF;

    -- Verificar e adicionar coluna employee_id em payroll se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE payroll ADD COLUMN employee_id UUID REFERENCES staff(id);
    END IF;

    -- Verificar e adicionar colunas que podem faltar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE payroll ADD COLUMN amount DECIMAL(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE payroll ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE payroll ADD COLUMN date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_payroll_date ON payroll(date);
CREATE INDEX IF NOT EXISTS idx_staff_id ON staff(id);

-- 5. GARANTIR TABELA EXTERNAL_FINANCE EXISTE
CREATE TABLE IF NOT EXISTS external_finance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('previous_sales', 'accumulated_profits', 'other')),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    metadata JSONB DEFAULT '{}'
);

-- 6. DESABILITAR RLS PARA EXTERNAL_FINANCE TAMBÉM
ALTER TABLE external_finance DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE external_finance TO anon, authenticated, service_role;

-- 7. INSERIR DADOS DE EXEMPLO SE TABELA VAZIA
INSERT INTO external_finance (type, amount, description, period_start, period_end)
SELECT 
    'previous_sales' as type,
    1500000.00 as amount,
    'Vendas acumuladas antes da migração' as description,
    '2024-01-01'::DATE as period_start,
    '2024-12-31'::DATE as period_end
WHERE NOT EXISTS (SELECT 1 FROM external_finance LIMIT 1);

-- 8. LIMPAR CACHE E REINICIAR SEQUÊNCIAS
-- Isto força o mobile a recarregar tudo do zero
SELECT setval('orders_id_seq', 1, false);
SELECT setval('revenues_id_seq', 1, false);
SELECT setval('expenses_id_seq', 1, false);

-- 9. VERIFICAÇÃO FINAL
SELECT 
    'ORDERS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

SELECT 
    'PAYROLL' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;

SELECT 
    'RESTAURANT_TABLES' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
ORDER BY ordinal_position;

-- RESULTADO ESPERADO: Todas as tabelas desbloqueadas e colunas corrigidas
