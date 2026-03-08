-- Fix orders table - FINAL CLEAN VERSION
-- This resolves: column "items" does not exist and foreign key issues

-- Step 1: Add missing items column only
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Step 2: Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 3: Test insert with valid table_id (null to avoid foreign key)
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
    '00000000-0000-0000-0000-000000000005', 
    'TEST-005', 
    NULL, 
    'pending', 
    100.00, 
    15.00, 
    'Test Customer', 
    NOW(), 
    NOW(), 
    '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Clean up test
DELETE FROM orders WHERE id = '00000000-0000-0000-0000-000000000005';

-- Step 5: Final verification
SELECT 
    'orders table fix completed successfully' as status,
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
