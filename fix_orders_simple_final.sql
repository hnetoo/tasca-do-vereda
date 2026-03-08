-- Fix orders table - SIMPLE VERSION - No DO blocks
-- This resolves: column "items" does not exist

-- Step 1: Add missing items column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add other missing columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id TEXT;

-- Step 3: Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 4: Test insert
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
    '00000000-0000-0000-0000-000000000004', 
    'TEST-004', 
    '00000000-0000-0000-0000-000000000002', 
    'pending', 
    100.00, 
    15.00, 
    'Test Customer', 
    NOW(), 
    NOW(), 
    '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Step 5: Clean up test
DELETE FROM orders WHERE id = '00000000-0000-0000-0000-000000000004';

-- Step 6: Final verification
SELECT 
    'orders table fix completed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'orders';
