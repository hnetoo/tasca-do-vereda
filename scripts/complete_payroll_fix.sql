-- SOLUÇÃO COMPLETA PARA PAYROLL_RECORDS
-- Execute este script no painel SQL do Supabase

-- 1. VERIFICAR ESTRUTURA COMPLETA ATUAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNA 'date' PROBLEMÁTICA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
    AND column_name = 'date';

-- 3. REMOVER COLUNA 'date' SE EXISTIR (É REDUNDANTE COM created_at)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payroll_records DROP COLUMN IF EXISTS "date";
        RAISE NOTICE 'Coluna "date" removida - era redundante com created_at';
    END IF;
END $$;

-- 4. GARANTIR QUE TODAS AS COLUNAS NECESSÁRIAS EXISTAM
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

-- 5. CORRIGER NOMES DE COLUNAS ANTIGAS
DO $$
BEGIN
    -- employee_id -> staff_id
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
    
    -- name -> staff_name
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
    
    -- amount -> base_salary
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
    
    -- month -> reference_month
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
    
    -- status -> status_pagamento
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

-- 6. ATUALIZAR REGISTROS EXISTENTES COM VALORES PADRÃO
UPDATE payroll_records 
SET 
    staff_id = COALESCE(staff_id, 'temp_' || id::text),
    staff_name = COALESCE(NULLIF(staff_name, ''), 'Funcionario'),
    base_salary = COALESCE(base_salary, 0.00),
    subsidies = COALESCE(subsidies, 0.00),
    deductions = COALESCE(deductions, 0.00),
    net_total = COALESCE(net_total, base_salary + COALESCE(subsidies, 0) - COALESCE(deductions, 0)),
    reference_month = COALESCE(NULLIF(reference_month, ''), TO_CHAR(created_at, 'YYYY-MM')),
    status_pagamento = COALESCE(status_pagamento, 'pendente'),
    metadata = COALESCE(metadata, '{}'::jsonb)
WHERE staff_id IS NULL 
   OR staff_name = '' 
   OR reference_month = ''
   OR metadata IS NULL;

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_id ON payroll_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_reference_month ON payroll_records(reference_month);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status_pagamento ON payroll_records(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_payroll_records_metadata_gin ON payroll_records USING GIN (metadata);

-- 8. LIMPAR REGISTROS DE TESTE ANTERIORES
DELETE FROM payroll_records 
WHERE staff_id LIKE 'test_%' 
   OR staff_name LIKE '%Teste%'
   OR staff_name LIKE '%teste%';

-- 9. TESTAR INSERÇÃO COMPLETA
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
    'test_staff_final',
    'Funcionario Teste Final',
    150000.00,
    5000.00,
    8000.00,
    147000.00,
    '2026-03',
    'pendente',
    '{
        "bonus": 10000.00,
        "hora_extra": {
            "horas": 8,
            "valor_hora": 2500.00,
            "total": 20000.00
        },
        "subsidios": {
            "alimentacao": 3000.00,
            "transporte": 2000.00
        },
        "deducoes": {
            "irs": 5000.00,
            "seguranca_social": 3000.00
        },
        "observacoes": "Teste completo com JSONB"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 10. VERIFICAR INSERÇÃO
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
    metadata->>'bonus' as bonus,
    metadata->'hora_extra'->>'total' as hora_extra_total,
    created_at,
    updated_at
FROM payroll_records 
WHERE staff_id = 'test_staff_final';

-- 11. VERIFICAR ESTRUTURA FINAL
SELECT 
    'COLUNA: ' || column_name as info,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. LIMPAR REGISTRO DE TESTE
DELETE FROM payroll_records WHERE staff_id = 'test_staff_final';

-- RESULTADO ESPERADO:
-- ✅ Sem erros de null constraint
-- ✅ Coluna "date" removida (era redundante)
-- ✅ Todas as colunas necessárias existem
-- ✅ JSONB funcionando
-- ✅ Inserção e consulta funcionando
