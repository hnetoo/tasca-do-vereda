-- SOLUÇÃO DEFINITIVA PARA PAYROLL_RECORDS
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

-- 2. REMOVER TODAS AS COLUNAS REDUNDANTES E PROBLEMÁTICAS DE UMA VEZ
DO $$
DECLARE
    col_name TEXT;
BEGIN
    -- Remover coluna 'amount' se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'amount'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE payroll_records DROP COLUMN IF EXISTS "amount"';
        RAISE NOTICE 'Coluna "amount" removida';
    END IF;
    
    -- Remover coluna 'date' se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'date'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE payroll_records DROP COLUMN IF EXISTS "date"';
        RAISE NOTICE 'Coluna "date" removida';
    END IF;
    
    -- Remover coluna 'salary' se existir (redundante)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'salary'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE payroll_records DROP COLUMN IF EXISTS "salary"';
        RAISE NOTICE 'Coluna "salary" removida';
    END IF;
    
    -- Remover coluna 'total' se existir (redundante)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'total'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE payroll_records DROP COLUMN IF EXISTS "total"';
        RAISE NOTICE 'Coluna "total" removida';
    END IF;
END $$;

-- 3. GARANTIR COLUNAS CORRETAS COM VALORES PADRÃO
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

-- 4. CORRIGER NOMES DE COLUNAS ANTIGOS
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
        RAISE NOTICE 'employee_id renomeado para staff_id';
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
        RAISE NOTICE 'name renomeado para staff_name';
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
        RAISE NOTICE 'month renomeado para reference_month';
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
        RAISE NOTICE 'status renomeado para status_pagamento';
    END IF;
END $$;

-- 5. ATUALIZAR REGISTROS EXISTENTES COM VALORES PADRÃO
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

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
DROP INDEX IF EXISTS idx_payroll_records_staff_id;
CREATE INDEX idx_payroll_records_staff_id ON payroll_records(staff_id);

DROP INDEX IF EXISTS idx_payroll_records_reference_month;
CREATE INDEX idx_payroll_records_reference_month ON payroll_records(reference_month);

DROP INDEX IF EXISTS idx_payroll_records_status_pagamento;
CREATE INDEX idx_payroll_records_status_pagamento ON payroll_records(status_pagamento);

DROP INDEX IF EXISTS idx_payroll_records_metadata_gin;
CREATE INDEX idx_payroll_records_metadata_gin ON payroll_records USING GIN (metadata);

-- 7. LIMPAR TODOS OS REGISTROS DE TESTE
DELETE FROM payroll_records 
WHERE staff_id LIKE 'test_%' 
   OR staff_name ILIKE '%test%'
   OR staff_name ILIKE '%teste%';

-- 8. TESTAR INSERÇÃO DEFINITIVA
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
    'test_definitive',
    'Funcionario Teste Definitivo',
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
        "observacoes": "Teste definitivo com schema limpo"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 9. VERIFICAR INSERÇÃO
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
WHERE staff_id = 'test_definitive';

-- 10. VERIFICAR ESTRUTURA FINAL
SELECT 
    'COLUNA: ' || column_name as info,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. VERIFICAR SE NÃO EXISTEM MAIS COLUNAS PROBLEMÁTICAS
SELECT 
    'COLUNA PROBLEMÁTICA: ' || column_name as warning,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
    AND column_name IN ('amount', 'date', 'salary', 'total')
ORDER BY column_name;

-- 12. LIMPAR REGISTRO DE TESTE
DELETE FROM payroll_records WHERE staff_id = 'test_definitive';

-- RESULTADO FINAL ESPERADO:
-- ✅ Nenhuma coluna redundante ou problemática
-- ✅ Schema limpo e funcional
-- ✅ JSONB funcionando perfeitamente
-- ✅ Inserção e consulta funcionando
-- ✅ Sem erros de constraint
