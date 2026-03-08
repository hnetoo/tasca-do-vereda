-- SHOW ORDERS TABLE STRUCTURE - Verificar exatamente o que existe
-- Isso vai mostrar por que o "id does not exist" está acontecendo

-- Step 1: Verificar se a tabela existe
SELECT 
    'Table exists' as status,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'orders';

-- Step 2: Verificar estrutura COMPLETA da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 3: Verificar constraints (chaves estrangeiras)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    tc.column_name,
    tc.foreign_table_name,
    tc.foreign_column_name
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'orders'
ORDER BY tc.constraint_name;

-- Step 4: Verificar índices
SELECT 
    indexname,
    indexdef,
    schemaname,
    tablename
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;

-- Step 5: Mostrar dados amostra
SELECT 
    'Sample data' as info,
    id,
    order_number,
    table_id,
    status,
    total,
    created_at
FROM orders 
LIMIT 5;

-- Step 6: Verificar se tem colunas específicas que o código espera
SELECT 
    'Has id column' as has_id,
    'Has order_number column' as has_order_number,
    'Has table_id column' as has_table_id,
    'Has status column' as has_status,
    'Has total column' as has_total,
    'Has items column' as has_items,
    'Has created_at column' as has_created_at,
    'Has updated_at column' as has_updated_at
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('id', 'order_number', 'table_id', 'status', 'total', 'items', 'created_at', 'updated_at')
GROUP BY 
    CASE 
        WHEN column_name = 'id' THEN 'Has id column'
        WHEN column_name = 'order_number' THEN 'Has order_number column'
        WHEN column_name = 'table_id' THEN 'Has table_id column'
        WHEN column_name = 'status' THEN 'Has status column'
        WHEN column_name = 'total' THEN 'Has total column'
        WHEN column_name = 'items' THEN 'Has items column'
        WHEN column_name = 'created_at' THEN 'Has created_at column'
        WHEN column_name = 'updated_at' THEN 'Has updated_at column'
    END
ORDER BY 
    CASE 
        WHEN column_name = 'id' THEN 1
        WHEN column_name = 'order_number' THEN 2
        WHEN column_name = 'table_id' THEN 3
        WHEN column_name = 'status' THEN 4
        WHEN column_name = 'total' THEN 5
        WHEN column_name = 'items' THEN 6
        WHEN column_name = 'created_at' THEN 7
        WHEN column_name = 'updated_at' THEN 8
        ELSE 9
    END;
