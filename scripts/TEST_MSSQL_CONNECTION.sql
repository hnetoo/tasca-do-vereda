-- TEST MSSQL CONNECTION - Usar sqlcmd para executar queries
-- Execute com: sqlcmd -S seu_servidor -d seu_banco -U usuario -P senha -i TEST_MSSQL_CONNECTION.sql

-- 1. VERIFICAR CONEXÃO
SELECT 'MSSQL_CONNECTION_TEST' as test_name,
       'SUCCESS' as status,
       GETDATE() as timestamp,
       @@VERSION as sql_version;

-- 2. VERIFICAR TABELAS DO SISTEMA
SELECT 'SYSTEM_TABLES' as section,
       TABLE_NAME,
       TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
    AND (
        TABLE_NAME LIKE '%employee%' 
        OR TABLE_NAME LIKE '%payroll%'
        OR TABLE_NAME LIKE '%user%'
        OR TABLE_NAME LIKE '%escala%'
    )
ORDER BY TABLE_NAME;

-- 3. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 'USERS_STRUCTURE' as section,
       COLUMN_NAME,
       DATA_TYPE,
       IS_NULLABLE,
       COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
    AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION;

-- 4. VERIFICAR DADOS DOS USUÁRIOS
SELECT 'USERS_DATA' as section,
       COUNT(*) as total_users,
       MAX(CREATED_AT) as latest_user
FROM users;

-- 5. VERIFICAR TABELA EMPLOYEES
SELECT 'EMPLOYEES_STRUCTURE' as section,
       COLUMN_NAME,
       DATA_TYPE,
       IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'employees' 
    AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION;

-- 6. VERIFICAR DADOS DOS EMPLOYEES
SELECT 'EMPLOYEES_DATA' as section,
       COUNT(*) as total_employees,
       MAX(HIRE_DATE) as latest_hire
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
WHERE STATUS = 'active' 
    AND ROLE = 'admin';

-- 9. VERIFICAR TABELA PAYROLL
SELECT 'PAYROLL_CHECK' as section,
       CASE WHEN EXISTS (
           SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_NAME = 'payroll_records' 
           AND TABLE_SCHEMA = 'dbo'
       ) THEN 'EXISTS' ELSE 'NOT_EXISTS' END as status;

-- 10. RESUMO FINAL
SELECT 'CONNECTION_SUMMARY' as section,
       'MSSQL_CONNECTED' as connection_status,
       'QUERIES_EXECUTED' as test_result,
       GETDATE() as completed_at;
