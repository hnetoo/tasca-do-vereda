-- Fix orders schema - Add missing 'id' column and verify structure
-- This resolves the error: column "id" does not exist

-- Step 1: Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 2: Check if table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'orders';

-- Step 3: Create orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'orders'
    ) THEN
        -- Create complete orders table
        CREATE TABLE orders (
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
        
        RAISE NOTICE 'Orders table created successfully';
    ELSE
        RAISE NOTICE 'Orders table already exists';
        
        -- Check if id column exists and add it if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'id'
        ) THEN
            -- Add id column as primary key
            ALTER TABLE orders ADD COLUMN id TEXT PRIMARY KEY;
            RAISE NOTICE 'Column id added to orders table';
        ELSE
            RAISE NOTICE 'Column id already exists in orders table';
        END IF;
        
        -- Check and add other missing columns
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
            AND column_name = 'items'
        ) THEN
            ALTER TABLE orders ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Column items added to orders table';
        END IF;
    END IF;
END $$;

-- Step 4: Show complete table structure after fix
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Step 5: Test insert to verify schema works
DO $$
BEGIN
    DECLARE test_order_id TEXT := gen_random_uuid()::text;
    
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
            'TEST-001', 
            'test-table-id', 
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
    'orders schema fix completed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Step 7: Show sample orders (if any)
SELECT 
    id,
    order_number,
    table_id,
    status,
    total,
    created_at
FROM orders 
LIMIT 3;
