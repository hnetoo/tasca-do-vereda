-- Fix payroll table - Add missing 'subsidies' column
-- Resolves error: column payroll.subsidies does not exist
-- Hint: Perhaps you meant to reference the column "payroll.subsidios"

DO $$
BEGIN
    -- 1. Check if 'subsidies' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'subsidies'
    ) THEN
        -- 2. Add the column
        ALTER TABLE payroll ADD COLUMN subsidies DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Column subsidies added to payroll table';
        
        -- 3. If 'subsidios' exists, copy data to 'subsidies' to preserve data
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payroll' 
            AND column_name = 'subsidios'
        ) THEN
            UPDATE payroll SET subsidies = subsidios;
            RAISE NOTICE 'Data copied from subsidios to subsidies';
        END IF;
    ELSE
        RAISE NOTICE 'Column subsidies already exists in payroll table';
    END IF;
END $$;

-- 4. Verify the columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll' AND column_name IN ('subsidies', 'subsidios');