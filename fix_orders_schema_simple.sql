-- Fix orders schema - SUPER SIMPLE VERSION
-- This resolves the error: column "id" does not exist

-- Step 1: Create orders table (simple version)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    table_id TEXT,
    status TEXT DEFAULT 'pending',
    total DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    customer_name TEXT DEFAULT '',
    customer_nif TEXT,
    payment_method TEXT,
    sub_account_name TEXT,
    shift_id TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB DEFAULT '[]'::jsonb
);

-- Step 2: Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 3: Test insert
INSERT INTO orders (
    id, 
    order_number, 
    table_id, 
    status, 
    total, 
    tax_total, 
    customer_name, 
    created_at, 
    updated_at, 
    items
) VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'TEST-001', 
    'test-table-id', 
    'pending', 
    100.00, 
    15.00, 
    'Test Customer', 
    NOW(), 
    NOW(), 
    '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Clean up test record
DELETE FROM orders WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Final verification
SELECT 
    'orders schema fix completed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Step 6: Show sample orders
SELECT 
    id,
    order_number,
    table_id,
    status,
    total,
    created_at
FROM orders 
LIMIT 3;
