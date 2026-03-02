-- Verificar estrutura real da tabela employees
-- Compara com a interface do frontend

-- Estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_employees FROM employees;

-- Interface esperada no frontend:
-- interface Employee {
--   id: string;
--   name: string;
--   email: string;
--   phone: string;
--   address: string;
--   position: string;
--   department: string;
--   salary: number;
--   hireDate: string;
--   status: 'active' | 'inactive' | 'on_leave';
--   bankAccount: string;
--   nif: string;
--   role: string;
-- }

-- Verificar se as colunas correspondem à interface
SELECT 
    'id' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'id' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'id'

UNION ALL

SELECT 
    'name' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'name' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'name'

UNION ALL

SELECT 
    'email' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'email' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'email'

UNION ALL

SELECT 
    'phone' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'phone' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'phone'

UNION ALL

SELECT 
    'address' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'address' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'address'

UNION ALL

SELECT 
    'position' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'position' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'position'

UNION ALL

SELECT 
    'department' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'department' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'department'

UNION ALL

SELECT 
    'salary' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'salary' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'salary'

UNION ALL

SELECT 
    'hire_date' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'hire_date' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'hire_date'

UNION ALL

SELECT 
    'status' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'status' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'status'

UNION ALL

SELECT 
    'bank_account' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'bank_account' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'bank_account'

UNION ALL

SELECT 
    'nif' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'nif' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'nif'

UNION ALL

SELECT 
    'role' as expected_field,
    column_name,
    data_type,
    CASE WHEN column_name = 'role' THEN '✅' ELSE '❌' END as matches
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'role'

ORDER BY expected_field;
