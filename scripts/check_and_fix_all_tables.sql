-- VERIFICAR E CORRIGIR ESTRUTURA DE TODAS AS TABELAS PRINCIPAIS
-- Execute este script no painel SQL do Supabase

-- 1. VERIFICAR TODAS AS TABELAS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('payroll_records', 'orders', 'restaurant_tables', 'expenses', 'revenues')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. CORRIGIR TABELA ORDERS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_id TEXT,
ADD COLUMN IF NOT EXISTS shift_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Corrigir nomes de colunas se necessário
DO $$
BEGIN
    -- Se existir 'tableName' mas não 'table_id', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tableName'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'table_id'
    ) THEN
        ALTER TABLE orders RENAME COLUMN tableName TO table_id;
    END IF;
END $$;

-- 3. CORRIGIR TABELA RESTAURANT_TABLES
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Corrigir nomes de colunas se necessário
DO $$
BEGIN
    -- Se existir 'name' mas não 'label', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'label'
    ) THEN
        ALTER TABLE restaurant_tables RENAME COLUMN name TO label;
    END IF;
END $$;

-- Atualizar registros existentes
UPDATE restaurant_tables 
SET label = COALESCE(label, 'Mesa ' || number::text)
WHERE label = '' OR label IS NULL;

-- 4. CORRIGIR TABELA EXPENSES
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. CORRIGIR TABELA REVENUES
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. CRIAR ÍNDICES PARA TODAS AS TABELAS
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin ON orders USING GIN (metadata);

-- Restaurant Tables
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_label ON restaurant_tables(label);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_metadata_gin ON restaurant_tables USING GIN (metadata);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_metadata_gin ON expenses USING GIN (metadata);

-- Revenues
CREATE INDEX IF NOT EXISTS idx_revenues_metadata_gin ON revenues USING GIN (metadata);

-- 7. VERIFICAR ESTRUTURA FINAL DE TODAS AS TABELAS
SELECT 
    'TABELA: ' || table_name as tabela_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('payroll_records', 'orders', 'restaurant_tables', 'expenses', 'revenues')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 8. TESTAR INSERÇÃO EM CADA TABELA

-- Testar payroll_records
INSERT INTO payroll_records (
    staff_id,
    staff_name,
    base_salary,
    subsidies,
    deductions,
    net_total,
    reference_month,
    status_pagamento,
    metadata
) VALUES (
    'test_staff_001',
    'Funcionario Teste',
    150000.00,
    5000.00,
    8000.00,
    147000.00,
    '2026-03',
    'pendente',
    '{"bonus": 10000.00, "observacoes": "Teste"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Testar orders
INSERT INTO orders (
    table_id,
    shift_id,
    status,
    total,
    metadata
) VALUES (
    'table_test_001',
    'shift_test_001',
    'OPEN',
    25000.00,
    '{"table_name": "Mesa Teste", "created_via": "POS"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Testar restaurant_tables
INSERT INTO restaurant_tables (
    label,
    number,
    seats,
    status,
    metadata
) VALUES (
    'Mesa Teste 1',
    999,
    4,
    'AVAILABLE',
    '{"special_features": ["teste"], "notes": "Mesa de teste"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Testar expenses
INSERT INTO expenses (
    amount,
    description,
    category,
    date,
    metadata
) VALUES (
    5000.00,
    'Despesa Teste',
    'OUTROS',
    CURRENT_DATE,
    '{"payment_method": "CASH", "receipt_number": "TEST001"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Testar revenues
INSERT INTO revenues (
    amount,
    description,
    date,
    metadata
) VALUES (
    10000.00,
    'Receita Teste',
    CURRENT_DATE,
    '{"source": "OTHER", "notes": "Receita de teste"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 9. VERIFICAR SE OS REGISTROS FORAM INSERIDOS
SELECT 'PAYROLL_RECORDS' as tabela, id, staff_id, staff_name, metadata FROM payroll_records WHERE staff_id = 'test_staff_001'
UNION ALL
SELECT 'ORDERS', id, table_id, status::text, metadata FROM orders WHERE table_id = 'table_test_001'
UNION ALL
SELECT 'RESTAURANT_TABLES', id, label, status, metadata FROM restaurant_tables WHERE label = 'Mesa Teste 1'
UNION ALL
SELECT 'EXPENSES', id, description, category, metadata FROM expenses WHERE description = 'Despesa Teste'
UNION ALL
SELECT 'REVENUES', id, description, 'amount'::text, metadata FROM revenues WHERE description = 'Receita Teste';

-- 10. LIMPAR REGISTROS DE TESTE
DELETE FROM payroll_records WHERE staff_id = 'test_staff_001';
DELETE FROM orders WHERE table_id = 'table_test_001';
DELETE FROM restaurant_tables WHERE label = 'Mesa Teste 1';
DELETE FROM expenses WHERE description = 'Despesa Teste';
DELETE FROM revenues WHERE description = 'Receita Teste';

-- RESULTADO ESPERADO:
-- Todas as colunas devem existir sem erros
-- Todas as inserções devem funcionar
-- Nenhum erro de "column does not exist"
