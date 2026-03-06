-- CORRIGIR ESTRUTURA DA TABELA PAYROLL_RECORDS
-- Execute este script no painel SQL do Supabase

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ADICIONAR COLUNAS QUE FALTAM (SE NÃO EXISTIREM)
ALTER TABLE payroll_records 
ADD COLUMN IF NOT EXISTS staff_id TEXT,
ADD COLUMN IF NOT EXISTS staff_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS subsidies DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS deductions DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS net_total DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reference_month TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. CORRIGER NOME DA COLUNA SE EXISTIR COM NOME DIFERENTE
-- Verificar se existe coluna com nome similar e renomear
DO $$
BEGIN
    -- Se existir 'employee_id' mas não 'staff_id', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'employee_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'staff_id'
    ) THEN
        ALTER TABLE payroll_records RENAME COLUMN employee_id TO staff_id;
    END IF;
    
    -- Se existir 'name' mas não 'staff_name', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'staff_name'
    ) THEN
        ALTER TABLE payroll_records RENAME COLUMN name TO staff_name;
    END IF;
    
    -- Se existir 'amount' mas não 'base_salary', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'amount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'base_salary'
    ) THEN
        ALTER TABLE payroll_records RENAME COLUMN amount TO base_salary;
    END IF;
    
    -- Se existir 'month' mas não 'reference_month', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'month'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'reference_month'
    ) THEN
        ALTER TABLE payroll_records RENAME COLUMN month TO reference_month;
    END IF;
    
    -- Se existir 'status' mas não 'status_pagamento', renomear
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'status_pagamento'
    ) THEN
        ALTER TABLE payroll_records RENAME COLUMN status TO status_pagamento;
    END IF;
END $$;

-- 4. ATUALIZAR REGISTROS EXISTENTES COM VALORES PADRÃO
UPDATE payroll_records 
SET 
    staff_id = COALESCE(staff_id, 'temp_' || id::text),
    staff_name = COALESCE(staff_name, 'Funcionario'),
    base_salary = COALESCE(base_salary, 0.00),
    subsidies = COALESCE(subsidies, 0.00),
    deductions = COALESCE(deductions, 0.00),
    net_total = COALESCE(net_total, base_salary + COALESCE(subsidies, 0) - COALESCE(deductions, 0)),
    reference_month = COALESCE(reference_month, TO_CHAR(created_at, 'YYYY-MM')),
    status_pagamento = COALESCE(status_pagamento, 'pendente'),
    metadata = COALESCE(metadata, '{}'::jsonb)
WHERE staff_id IS NULL OR staff_name = '' OR reference_month = '';

-- 5. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_id ON payroll_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_reference_month ON payroll_records(reference_month);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status_pagamento ON payroll_records(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_payroll_records_metadata_gin ON payroll_records USING GIN (metadata);

-- 6. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. TESTAR INSERÇÃO DE REGISTRO
INSERT INTO payroll_records (
    staff_id,
    staff_name,
    base_salary,
    subsidies,
    deductions,
    net_total,
    reference_month,
    status_pagamento,
    metadata
) VALUES (
    'test_staff_001',
    'Funcionario Teste',
    150000.00,
    5000.00,
    8000.00,
    147000.00,
    '2026-03',
    'pendente',
    '{
        "bonus": 10000.00,
        "observacoes": "Registro de teste para verificar schema"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 8. VERIFICAR SE O REGISTRO FOI INSERIDO
SELECT 
    id,
    staff_id,
    staff_name,
    base_salary,
    subsidies,
    deductions,
    net_total,
    reference_month,
    status_pagamento,
    metadata
FROM payroll_records 
WHERE staff_id = 'test_staff_001';

-- 9. LIMPAR REGISTRO DE TESTE
DELETE FROM payroll_records WHERE staff_id = 'test_staff_001';

-- RESULTADO ESPERADO:
-- Todas as colunas necessárias devem existir sem erros
-- O sistema deve conseguir inserir e consultar registros normalmente
