-- SQL PARA MAPEAR TODAS AS TABELAS E COLUNAS DO SUPABASE
-- Execute este comando no painel SQL do Supabase para ver a estrutura REAL

-- 1. LISTAR TODAS AS TABELAS DO ESQUEMA PUBLIC
SELECT 
    t.table_name,
    t.table_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 2. VERIFICAR ESTRUTURA DA TABELA ORDERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA RESTAURANT_TABLES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUTURA DA TABELA DISHES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dishes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESTRUTURA DA TABELA CATEGORIES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR ESTRUTURA DA TABELA STAFF
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. VERIFICAR ESTRUTURA DA TABELA PAYROLL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. VERIFICAR ESTRUTURA DA TABELA REVENUES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'revenues' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. VERIFICAR ESTRUTURA DA TABELA EXPENSES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. VERIFICAR CHAVES ESTRANGEIRAS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name AS foreign_key_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- RESULTADO: Lista completa de todas as tabelas e colunas existentes
-- USE ESTA INFORMAÇÃO PARA ALINHAR O CÓDIGO COM A ESTRUTURA REAL
