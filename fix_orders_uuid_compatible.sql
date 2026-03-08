-- FIX ORDERS UUID-COMPATIBLE - Respeita tipos exatos do Supabase
-- ID é UUID, não pode ser TEXT

-- Step 1: Verificar tipo exato da coluna id
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'id';

-- Step 2: Criar tabela com tipos corretos se não existir
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL DEFAULT '',
    table_id UUID,  -- UUID se referenciar outra tabela
    status TEXT DEFAULT 'pending',
    total DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    customer_name TEXT DEFAULT '',
    customer_nif TEXT,
    payment_method TEXT,
    sub_account_name TEXT,
    shift_id UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items JSONB DEFAULT '[]'::jsonb
);

-- Step 3: Adicionar colunas se faltar (com tipos corretos)
DO $$
BEGIN
    -- Verificar se id é UUID ou TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'Column id is already UUID type';
    ELSE
        -- Se for TEXT, converter para UUID
        ALTER TABLE orders ALTER COLUMN id TYPE UUID USING id::uuid;
        RAISE NOTICE 'Column id converted to UUID type';
    END IF;
    
    -- Garantir que table_id seja UUID se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'table_id'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE orders ALTER COLUMN table_id TYPE UUID USING table_id::uuid;
        RAISE NOTICE 'Column table_id converted to UUID type';
    END IF;
END $$;

-- Step 4: Teste com UUID válido
INSERT INTO orders (
    id,
    order_number,
    table_id,
    status,
    total,
    tax_total,
    customer_name,
    created_at,
    updated_at,
    items
) VALUES (
    gen_random_uuid(),
    'UUID-TEST-' || extract(epoch from now())::text,
    NULL,  -- table_id nulo para evitar FK
    'pending',
    100.00,
    15.00,
    'UUID Test Customer',
    NOW(),
    NOW(),
    '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Step 5: Limpar teste
DELETE FROM orders WHERE order_number LIKE 'UUID-TEST-%';

-- Step 6: Verificação final
SELECT 
    'UUID-compatible orders fix completed' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'orders';

-- Step 7: Estrutura final para referência
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
