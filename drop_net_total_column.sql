-- Drop the problematic net_total column completely
-- This removes the generated column that's causing syntax errors

-- First, check if the column exists
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
AND column_name = 'net_total';

-- Drop the column if it exists
DO $$
BEGIN
    -- Check if column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        AND column_name = 'net_total'
    ) THEN
        ALTER TABLE payroll DROP COLUMN net_total;
        RAISE NOTICE 'Column net_total dropped successfully';
    ELSE
        RAISE NOTICE 'Column net_total does not exist';
    END IF;
END $$;

-- Verify the column was dropped
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
AND column_name = 'net_total';

-- Show remaining columns
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;

-- Test insert without net_total
-- This should now work without any issues
INSERT INTO payroll (
    staff_id, 
    funcionario, 
    reference_month, 
    month, 
    year, 
    base_salary, 
    salario_base, 
    overtime_hours, 
    overtime_rate, 
    overtime_pay, 
    deductions, 
    descontos, 
    bonuses, 
    subsidios, 
    net_salary, 
    status, 
    status_pagamento, 
    payment_date, 
    created_at
) VALUES (
    'test-id', 
    'test-name', 
    '2026-03', 
    '2026-03', 
    2026, 
    150000, 
    150000, 
    0, 
    0, 
    0, 
    0, 
    0, 
    0, 
    150000, 
    'pending', 
    'pendente', 
    NULL, 
    NOW()
);

-- Clean up test record
DELETE FROM payroll WHERE staff_id = 'test-id';

-- Final verification
SELECT 'net_total column removal completed successfully' as status;
