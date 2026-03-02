-- Verificação completa da base de dados Tasca do Vereda
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f verify_complete_database.sql

-- =====================================================
-- VERIFICAÇÃO DE TODAS AS TABELAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO COMPLETA DA BASE DE DADOS ===';
    RAISE NOTICE 'Data: %', NOW();
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE '';
END $$;

-- Lista todas as tabelas
SELECT '=== TODAS AS TABELAS ===' as section;
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name LIKE 'pg_%' THEN 'System Table'
        WHEN table_name = 'users' THEN 'Authentication'
        WHEN table_name IN ('orders', 'order_items') THEN 'Orders'
        WHEN table_name IN ('dishes', 'menu_categories') THEN 'Menu'
        WHEN table_name IN ('revenues', 'expenses') THEN 'Finance'
        WHEN table_name IN ('employees', 'payroll_records') THEN 'HR'
        WHEN table_name IN ('restaurant_tables') THEN 'Restaurant'
        WHEN table_name IN ('stock_items', 'suppliers') THEN 'Inventory'
        ELSE 'Other'
    END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY category, table_name;

-- =====================================================
-- VERIFICAÇÃO DE ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================

-- Tabela users
SELECT '=== ESTRUTURA - TABELA USERS ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados na tabela users
SELECT '=== DADOS - TABELA USERS ===' as section;
SELECT 
    id,
    name,
    email,
    pin,
    role,
    status,
    created_at
FROM users 
ORDER BY role, name;

-- =====================================================
-- VERIFICAÇÃO DE MENU
-- =====================================================

-- Categorias
SELECT '=== ESTRUTURA - MENU_CATEGORIES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'menu_categories' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - MENU_CATEGORIES ===' as section;
SELECT id, name, sort_order, is_active
FROM menu_categories 
ORDER BY sort_order;

-- Pratos
SELECT '=== ESTRUTURA - DISHES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dishes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - DISHES ===' as section;
SELECT id, name, price, category_id, is_active
FROM dishes 
ORDER BY name;

-- =====================================================
-- VERIFICAÇÃO DE PEDIDOS
-- =====================================================

-- Mesas
SELECT '=== ESTRUTURA - RESTAURANT_TABLES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - RESTAURANT_TABLES ===' as section;
SELECT id, number, name, status
FROM restaurant_tables 
ORDER BY number;

-- Pedidos
SELECT '=== ESTRUTURA - ORDERS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - ORDERS ===' as section;
SELECT 
    id, 
    order_number, 
    table_id, 
    status, 
    total, 
    created_at
FROM orders 
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- VERIFICAÇÃO FINANCEIRA
-- =====================================================

-- Despesas
SELECT '=== ESTRUTURA - EXPENSES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - EXPENSES ===' as section;
SELECT id, amount, date, description, category, status
FROM expenses 
ORDER BY date DESC
LIMIT 10;

-- Receitas
SELECT '=== ESTRUTURA - REVENUES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'revenues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - REVENUES ===' as section;
SELECT id, amount, date, description, category
FROM revenues 
ORDER BY date DESC
LIMIT 10;

-- =====================================================
-- VERIFICAÇÃO DE RECURSOS HUMANOS
-- =====================================================

-- Funcionários
SELECT '=== ESTRUTURA - EMPLOYEES ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - EMPLOYEES ===' as section;
SELECT id, name, email, position, department, is_active
FROM employees 
ORDER BY name;

-- Folha de pagamento
SELECT '=== ESTRUTURA - PAYROLL_RECORDS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - PAYROLL_RECORDS ===' as section;
SELECT id, employee_id, month, net_salary, status
FROM payroll_records 
ORDER BY month DESC
LIMIT 10;

-- =====================================================
-- VERIFICAÇÃO DE CONFIGURAÇÕES
-- =====================================================

SELECT '=== ESTRUTURA - SETTINGS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'settings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DADOS - SETTINGS ===' as section;
SELECT key, value
FROM settings 
ORDER BY key;

-- =====================================================
-- VERIFICAÇÃO DE ÍNDICES
-- =====================================================

SELECT '=== ÍNDICES DAS TABELAS PRINCIPAIS ===' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'orders', 'order_items', 'dishes', 'menu_categories',
    'restaurant_tables', 'revenues', 'expenses', 'employees', 'payroll_records'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- VERIFICAÇÃO DE TRIGGERS
-- =====================================================

SELECT '=== TRIGGERS AUTOMÁTICOS ===' as section;
SELECT 
    event_object_table,
    trigger_name,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- VERIFICAÇÃO DE RLS (ROW LEVEL SECURITY)
-- =====================================================

SELECT '=== POLÍTICAS RLS ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- CONTAGEM FINAL DE REGISTROS
-- =====================================================

SELECT '=== CONTAGEM FINAL DE REGISTROS ===' as section;

DO $$
DECLARE
    table_record RECORD;
    table_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMO DE REGISTROS POR TABELA ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO table_count;
        RAISE NOTICE '%: % registros', table_record.table_name, table_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO CONCLUÍDA ===';
    RAISE NOTICE 'Data: %', NOW();
END $$;
