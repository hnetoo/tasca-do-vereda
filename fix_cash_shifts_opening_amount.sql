-- Fix cash_shifts schema - Add missing 'opening_amount' column
-- This resolves the error: Could not find the 'opening_amount' column of 'cash_shifts' in the schema cache

-- Step 1: Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'cash_shifts' 
ORDER BY ordinal_position;

-- Step 2: Add missing 'opening_amount' column if it doesn't exist
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cash_shifts'
    ) THEN
        -- Check if column exists and add it if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'cash_shifts' 
            AND column_name = 'opening_amount'
        ) THEN
            ALTER TABLE cash_shifts ADD COLUMN opening_amount DECIMAL(12,2) DEFAULT 0;
            RAISE NOTICE 'Column opening_amount added successfully to cash_shifts table';
        ELSE
            RAISE NOTICE 'Column opening_amount already exists in cash_shifts table';
        END IF;
    ELSE
        RAISE NOTICE 'Table cash_shifts does not exist - creating it';
        
        -- Create table if it doesn't exist
        CREATE TABLE cash_shifts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            opening_balance DECIMAL(12,2) DEFAULT 0,
            closing_balance DECIMAL(12,2) DEFAULT 0,
            opening_amount DECIMAL(12,2) DEFAULT 0,
            notes TEXT DEFAULT '',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Step 3: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'cash_shifts' 
AND column_name = 'opening_amount';

-- Step 4: Show complete table structure after fix
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'cash_shifts' 
ORDER BY ordinal_position;

-- Step 5: Final verification
SELECT 
    'cash_shifts opening_amount fix completed successfully' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'cash_shifts';

-- Step 6: Show sample data (if any)
SELECT 
    id,
    user_id,
    status,
    opening_balance,
    opening_amount,
    notes,
    created_at
FROM cash_shifts 
LIMIT 3;
