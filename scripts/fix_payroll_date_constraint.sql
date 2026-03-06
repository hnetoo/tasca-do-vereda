-- CORRIGIR PROBLEMA DE DATA NA TABELA PAYROLL_RECORDS
-- Execute este script no painel SQL do Supabase

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
    AND column_name IN ('date', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNA 'date' (PROVAVELMENTE NÃO NECESSÁRIA)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
    AND column_name = 'date';

-- 3. VERIFICAR REGISTROS COM DATA NULL
SELECT 
    id,
    staff_id,
    staff_name,
    reference_month,
    created_at,
    updated_at,
    "date"
FROM payroll_records 
WHERE "date" IS NULL
LIMIT 10;

-- 4. OPÇÃO 1: REMOVER COLUNA 'date' SE FOR REDUNDANTE
-- Se existir coluna 'date' e for redundante com 'created_at', podemos removê-la
DO $$
BEGIN
    -- Verificar se a coluna 'date' existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
        AND column_name = 'date'
        AND table_schema = 'public'
    ) THEN
        -- Remover coluna 'date' se for redundante
        ALTER TABLE payroll_records DROP COLUMN IF EXISTS "date";
        RAISE NOTICE 'Coluna "date" removida da tabela payroll_records';
    END IF;
END $$;

-- 5. OPÇÃO 2: SE NECESSÁRIO MANTER 'date', ATUALIZAR REGISTROS EXISTENTES
-- (Descomente se precisar manter a coluna 'date')
/*
UPDATE payroll_records 
SET "date" = COALESCE(
    "date", 
    TO_CHAR(created_at, 'YYYY-MM-DD')::date,
    CURRENT_DATE
)
WHERE "date" IS NULL;

-- Garantir que a coluna tenha valor padrão
ALTER TABLE payroll_records 
ALTER COLUMN "date" SET DEFAULT CURRENT_DATE;

-- Garantir que não seja nula (se necessário)
ALTER TABLE payroll_records 
ALTER COLUMN "date" SET NOT NULL;
*/

-- 6. LIMPAR REGISTROS DE TESTE ANTERIORES
DELETE FROM payroll_records 
WHERE staff_id = 'test_staff_001';

-- 7. TESTAR INSERÇÃO COM ESTRUTURA CORRETA
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
    '{"bonus": 10000.00, "observacoes": "Registro de teste para verificar schema"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 8. VERIFICAR SE O REGISTRO FOI INSERIDO CORRETAMENTE
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
    metadata,
    created_at,
    updated_at
FROM payroll_records 
WHERE staff_id = 'test_staff_001';

-- 9. VERIFICAR ESTRUTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. LIMPAR REGISTRO DE TESTE
DELETE FROM payroll_records WHERE staff_id = 'test_staff_001';

-- RESULTADO ESPERADO:
-- Sem erros de null constraint na coluna "date"
-- Inserção deve funcionar normalmente
-- Estrutura deve estar correta e funcional
