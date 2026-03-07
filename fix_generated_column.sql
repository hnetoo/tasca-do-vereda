-- Fix generated column net_total with correct PostgreSQL syntax
-- This script fixes the syntax error for the GENERATED ALWAYS AS column

-- First, drop the existing problematic column if it exists
DO $$
BEGIN
    -- Check if column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'net_total'
    ) THEN
        ALTER TABLE payroll DROP COLUMN net_total;
    END IF;
END $$;

-- Add the generated column with correct syntax
ALTER TABLE payroll 
ADD COLUMN net_total NUMERIC GENERATED ALWAYS AS (
    (base_salary + COALESCE(overtime_pay, 0) + COALESCE(bonuses, 0) - COALESCE(deductions, 0))
) STORED;

-- Verify the column was created correctly
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
AND column_name = 'net_total';

-- Test the generated column with existing data
SELECT 
    id,
    staff_id,
    funcionario,
    base_salary,
    overtime_pay,
    bonuses,
    deductions,
    net_total  -- This should now work correctly
FROM payroll 
LIMIT 5;
