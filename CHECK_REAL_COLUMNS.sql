-- SQL PARA VERIFICAR AS COLUNAS REAIS DAS TABELAS NO SUPABASE
-- Execute este comando no painel SQL do Supabase para ver a estrutura REAL

-- 1. VERIFICAR ESTRUTURA DA TABELA PAYROLL_RECORDS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE A TABELA PAYROLL (diferente de payroll_records) EXISTE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
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

-- 4. VERIFICAR ESTRUTURA DA TABELA ORDERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESTRUTURA DA TABELA MENU_CATEGORIES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'menu_categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- RESULTADO: Lista completa de todas as colunas existentes
-- USE ESTA INFORMAÇÃO PARA ALINHAR O CÓDIGO COM A ESTRUTURA REAL
