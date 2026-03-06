-- ADICIONAR COLUNAS JSONB PARA ESTRUTURA FLEXÍVEL
-- Execute este script no painel SQL do Supabase

-- 1. ADICIONAR COLUNA METADATA À TABELA PAYROLL_RECORDS
ALTER TABLE payroll_records 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. ADICIONAR COLUNA METADATA À TABELA ORDERS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. ADICIONAR COLUNA METADATA À TABELA RESTAURANT_TABLES
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. ADICIONAR COLUNA METADATA À TABELA EXPENSES
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. ADICIONAR COLUNA METADATA À TABELA REVENUES
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payroll_records_metadata_gin ON payroll_records USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin ON orders USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_metadata_gin ON restaurant_tables USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_expenses_metadata_gin ON expenses USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_revenues_metadata_gin ON revenues USING GIN (metadata);

-- 7. VERIFICAR SE AS COLUNAS FORAM ADICIONADAS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('payroll_records', 'orders', 'restaurant_tables', 'expenses', 'revenues')
    AND table_schema = 'public'
    AND column_name = 'metadata'
ORDER BY table_name, ordinal_position;

-- EXEMPLOS DE USO:

-- Exemplo 1: Inserir payroll com bónus e subsídios em JSONB
INSERT INTO payroll_records (
    staff_id, 
    staff_name, 
    base_salary, 
    net_total, 
    reference_month, 
    status_pagamento,
    metadata
) VALUES (
    'staff_123',
    'João Silva',
    150000.00,
    165000.00,
    '2026-03',
    'pago',
    '{
        "bonus": 10000.00,
        "subsidios": {
            "alimentacao": 3000.00,
            "transporte": 2000.00
        },
        "deducoes": {
            "irs": 5000.00,
            "seguranca_social": 3000.00
        },
        "hora_extra": {
            "horas": 8,
            "valor_hora": 2500.00,
            "total": 20000.00
        },
        "observacoes": "Bónus por bom desempenho em Março"
    }'::jsonb
);

-- Exemplo 2: Consultar payroll com filtros JSONB
SELECT 
    staff_name,
    base_salary,
    net_total,
    metadata->>'bonus' as bonus,
    metadata->'hora_extra'->>'total' as hora_extra_total,
    metadata->'subsidios'->'alimentacao' as subsidio_alimentacao
FROM payroll_records 
WHERE metadata->>'bonus' IS NOT NULL;

-- Exemplo 3: Atualizar metadata específico
UPDATE payroll_records 
SET metadata = jsonb_set(
    metadata, 
    '{bonus}', 
    '15000.00'::jsonb
)
WHERE staff_id = 'staff_123';

-- BENEFÍCIOS DESTA ABORDAGEM:
-- 1. Flexibilidade total para adicionar campos sem alterar schema
-- 2. Sem erros de "coluna não encontrada"
-- 3. Performance otimizada com índices GIN
-- 4. Queries complexas possíveis com operadores JSONB
-- 5. Estrutura consistente across todas as tabelas
