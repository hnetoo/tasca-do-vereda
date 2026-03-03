-- Adicionar colunas que faltam na tabela payroll_records existente
DO $$
BEGIN
    -- Verificar se a coluna payment_date existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'payment_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payroll_records ADD COLUMN payment_date DATE;
        RAISE NOTICE 'Column payment_date added to payroll_records';
    END IF;
    
    -- Verificar outras colunas importantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'employee_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payroll_records ADD COLUMN employee_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Column employee_name added to payroll_records';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payroll_records ADD COLUMN status TEXT DEFAULT 'PENDING';
        RAISE NOTICE 'Column status added to payroll_records';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payroll_records ADD COLUMN notes TEXT;
        RAISE NOTICE 'Column notes added to payroll_records';
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON payroll_records(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);

-- Criar índice payment_date apenas se a coluna existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'payment_date'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payroll_records_payment_date ON payroll_records(payment_date);
        RAISE NOTICE 'Index payment_date created';
    END IF;
END $$;

-- Garantir permissões totais
GRANT ALL ON payroll_records TO anon;
GRANT ALL ON payroll_records TO authenticated;
GRANT ALL ON payroll_records TO service_role;
