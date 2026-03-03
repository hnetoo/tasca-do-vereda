-- Criar tabela customers para gestão de clientes
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    nif TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    visits INTEGER DEFAULT 0,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Angola',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que faltam se não existirem
DO $$
BEGIN
    -- Verificar se a coluna points existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'points'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE customers ADD COLUMN points INTEGER DEFAULT 0;
        RAISE NOTICE 'Column points added to customers';
    END IF;
    
    -- Verificar se a coluna balance existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'balance'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE customers ADD COLUMN balance DECIMAL(12,2) DEFAULT 0;
        RAISE NOTICE 'Column balance added to customers';
    END IF;
    
    -- Verificar se a coluna visits existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'visits'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE customers ADD COLUMN visits INTEGER DEFAULT 0;
        RAISE NOTICE 'Column visits added to customers';
    END IF;
END $$;

-- Criar índices apenas se as colunas existirem
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_nif ON customers(nif);

-- Criar índice points apenas se a coluna existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'points'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points);
        RAISE NOTICE 'Index points created';
    END IF;
END $$;

-- Dar permissões totais
GRANT ALL ON customers TO anon;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO service_role;
