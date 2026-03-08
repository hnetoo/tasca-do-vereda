-- Fix existing orders table - Add missing columns
-- This resolves: column "items" of relation "orders" does not exist

-- Step 1: Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 2: Add missing items column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'items'
    ) THEN
        ALTER TABLE orders ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Column items added to orders table';
    ELSE
        RAISE NOTICE 'Column items already exists in orders table';
    END IF;
END $$;

-- Step 3: Add other missing columns if needed
DO $$
BEGIN
    -- Check and add missing columns one by one
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Column order_number added to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Column status added to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total'
    ) THEN
        ALTER TABLE orders ADD COLUMN total DECIMAL(12,2) DEFAULT 0;
        RAISE NOTICE 'Column total added to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'tax_total'
    ) THEN
        ALTER TABLE orders ADD COLUMN tax_total DECIMAL(12,2) DEFAULT 0;
        RAISE NOTICE 'Column tax_total added to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_name TEXT DEFAULT '';
        RAISE NOTICE 'Column customer_name added to orders table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'table_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN table_id TEXT;
        RAISE NOTICE 'Column table_id added to orders table';
    END IF;
END $$;

-- Step 4: Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 5: Test insert with existing table
DO $$
BEGIN
    DECLARE test_order_id TEXT := '00000000-0000-0000-0000-000000000003';
    
    -- Check if test record exists first
    IF NOT EXISTS (
        SELECT 1 FROM orders WHERE id = test_order_id
    ) THEN
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
            test_order_id, 
            'TEST-003', 
            '00000000-0000-0000-0000-000000000002', 
            'pending', 
            100.00, 
            15.00, 
            'Test Customer', 
            NOW(), 
            NOW(), 
            '[]'::jsonb
        );
        
        RAISE NOTICE 'Test order inserted successfully with ID: %', test_order_id;
        
        -- Clean up test record
        DELETE FROM orders WHERE id = test_order_id;
        
        RAISE NOTICE 'Test order cleaned up successfully';
    ELSE
        RAISE NOTICE 'Test order already exists, skipping insert test';
    END IF;
END $$;

-- Step 6: Final verification
SELECT 
    'orders existing table fix completed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'orders';
