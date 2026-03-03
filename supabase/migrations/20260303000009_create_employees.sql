-- Criar tabela employees para gestão de funcionários
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    pin_code TEXT,
    role TEXT DEFAULT 'waiter', -- admin, manager, waiter, kitchen
    address TEXT,
    phone TEXT,
    admission_date DATE,
    salary DECIMAL(12,2),
    status TEXT DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que faltam se não existirem
DO $$
BEGIN
    -- Verificar se a coluna pin_code existe, se não, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'pin_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE employees ADD COLUMN pin_code TEXT;
        RAISE NOTICE 'Column pin_code added to employees';
    END IF;
END $$;

-- Criar índices apenas se as colunas existirem
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Criar índice pin_code apenas se a coluna existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'pin_code'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_employees_pin_code ON employees(pin_code);
        RAISE NOTICE 'Index pin_code created';
    END IF;
END $$;

-- Dar permissões totais
GRANT ALL ON employees TO anon;
GRANT ALL ON employees TO authenticated;
GRANT ALL ON employees TO service_role;
