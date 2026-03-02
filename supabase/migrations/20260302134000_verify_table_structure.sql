-- Verificar estrutura completa das tabelas principais
-- Analisar se estão em conformidade com a API

-- Tabela Orders
SELECT 
    'orders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Tabela Dishes
SELECT 
    'dishes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'dishes'
ORDER BY ordinal_position;

-- Tabela Menu Categories
SELECT 
    'menu_categories' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'menu_categories'
ORDER BY ordinal_position;

-- Tabela Customers
SELECT 
    'customers' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- Tabela Employees
SELECT 
    'employees' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees'
ORDER BY ordinal_position;

-- Tabela Expenses
SELECT 
    'expenses' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Tabela Revenues
SELECT 
    'revenues' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'revenues'
ORDER BY ordinal_position;

-- Tabela Cash Shifts
SELECT 
    'cash_shifts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'cash_shifts'
ORDER BY ordinal_position;

-- Tabela Restaurant Tables
SELECT 
    'restaurant_tables' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'restaurant_tables'
ORDER BY ordinal_position;

-- Tabela Transactions
SELECT 
    'transactions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Tabela Order Items
SELECT 
    'order_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;
