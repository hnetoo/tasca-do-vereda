-- TEST POSTGRESQL CONNECTION - Corrigido para Supabase/PostgreSQL
-- Execute no Supabase SQL Editor

-- 1. VERIFICAR CONEXÃO
SELECT 'POSTGRESQL_CONNECTION_TEST' as test_name,
       'SUCCESS' as status,
       NOW() as timestamp,
       version() as sql_version;

-- 2. VERIFICAR TABELAS DO SISTEMA
SELECT 'SYSTEM_TABLES' as section,
       table_name,
       table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%employee%' 
        OR table_name ILIKE '%payroll%'
        OR table_name ILIKE '%user%'
        OR table_name ILIKE '%escala%'
    )
ORDER BY table_name;

-- 3. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 'USERS_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS DOS USUÁRIOS
SELECT 'USERS_DATA' as section,
       COUNT(*) as total_users,
       MAX(created_at) as latest_user
FROM users;

-- 5. VERIFICAR TABELA EMPLOYEES
SELECT 'EMPLOYEES_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR DADOS DOS EMPLOYEES
SELECT 'EMPLOYEES_DATA' as section,
       COUNT(*) as total_employees,
       MAX(created_at) as latest_hire
FROM employees;

-- 7. VERIFICAR LIGAÇÕES ENTRE TABELAS
SELECT 'TABLE_RELATIONSHIPS' as section,
       'users' as main_table,
       'employees' as related_table,
       'user_id' as possible_link;

-- 8. TESTAR QUERY DE LOGIN
SELECT 'LOGIN_TEST' as section,
       COUNT(*) as active_admins
FROM users 
WHERE status = 'active' 
    AND role = 'admin';

-- 9. VERIFICAR TABELA PAYROLL
SELECT 'PAYROLL_CHECK' as section,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'payroll_records' 
           AND table_schema = 'public'
       ) THEN 'EXISTS' ELSE 'NOT_EXISTS' END as status;

-- 10. RESUMO FINAL
SELECT 'CONNECTION_SUMMARY' as section,
       'POSTGRESQL_CONNECTED' as connection_status,
       'QUERIES_EXECUTED' as test_result,
       NOW() as completed_at;
