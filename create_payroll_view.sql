-- Create payroll view instead of generated column
-- This avoids syntax errors and provides better flexibility

-- Drop existing view if it exists
DROP VIEW IF EXISTS payroll_with_totals;

-- Create view with calculated net_total
CREATE VIEW payroll_with_totals AS
SELECT 
    id,
    staff_id,
    funcionario,
    staff_name,
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
    created_at,
    -- Calculated net_total (this replaces the problematic generated column)
    (base_salary + COALESCE(overtime_pay, 0) + COALESCE(bonuses, 0) - COALESCE(deductions, 0)) AS net_total
FROM payroll;

-- Test the view
SELECT 
    id,
    funcionario,
    base_salary,
    overtime_pay,
    bonuses,
    deductions,
    net_total
FROM payroll_with_totals 
LIMIT 5;

-- Grant permissions on the view
GRANT SELECT ON payroll_with_totals TO authenticated;
GRANT SELECT ON payroll_with_totals TO anon;

-- Alternative: Create a simpler view without complex calculations
CREATE VIEW payroll_simple AS
SELECT 
    id,
    staff_id,
    funcionario,
    staff_name,
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
FROM payroll;

-- Show view information
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('payroll', 'payroll_with_totals', 'payroll_simple')
ORDER BY table_name, ordinal_position;
