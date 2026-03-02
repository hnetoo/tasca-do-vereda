-- Adicionar colunas que faltam na tabela employees
-- Para compatibilidade com a interface do frontend

-- Verificar se as colunas existem antes de adicionar
DO $$
BEGIN
    -- Adicionar coluna position se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'position'
    ) THEN
        ALTER TABLE employees ADD COLUMN position TEXT;
    END IF;
    
    -- Adicionar coluna department se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'department'
    ) THEN
        ALTER TABLE employees ADD COLUMN department TEXT;
    END IF;
    
    -- Adicionar coluna address se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'address'
    ) THEN
        ALTER TABLE employees ADD COLUMN address TEXT;
    END IF;
    
    -- Adicionar coluna bank_account se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'bank_account'
    ) THEN
        ALTER TABLE employees ADD COLUMN bank_account TEXT;
    END IF;
    
    -- Adicionar coluna nif se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'nif'
    ) THEN
        ALTER TABLE employees ADD COLUMN nif TEXT;
    END IF;
    
    -- Adicionar coluna hire_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'hire_date'
    ) THEN
        ALTER TABLE employees ADD COLUMN hire_date DATE;
    END IF;
    
    -- Adicionar coluna base_salary se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'base_salary'
    ) THEN
        ALTER TABLE employees ADD COLUMN base_salary DECIMAL(10,2);
    END IF;
    
    -- Adicionar coluna net_salary se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'net_salary'
    ) THEN
        ALTER TABLE employees ADD COLUMN net_salary DECIMAL(10,2);
    END IF;
    
    -- Adicionar coluna is_active se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Adicionar coluna permissions se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE employees ADD COLUMN permissions JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE employees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'status'
    ) THEN
        ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Adicionar dados de teste (apenas se as colunas existirem)
DO $$
BEGIN
    -- Verificar se todas as colunas necessárias existem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name IN ('position', 'department', 'address', 'bank_account', 'nif', 'hire_date', 'status')
        GROUP BY column_name
        HAVING COUNT(*) = 7
    ) THEN
        -- Inserir dados de teste
        INSERT INTO employees (
            id,
            name,
            email,
            phone,
            address,
            position,
            department,
            salary,
            base_salary,
            net_salary,
            hire_date,
            status,
            is_active,
            role,
            bank_account,
            nif,
            permissions,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'João Silva',
            'joao@restaurante.com',
            '+244 923 456 789',
            'Luanda, Rua Principal 123',
            'Chef de Cozinha',
            'Cozinha',
            250000,
            250000,
            220000,
            '2023-01-15',
            'active',
            true,
            'chef',
            '0055.0000.1234.5678',
            '123456789',
            '{"kitchen": true, "inventory": false}',
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
        
        INSERT INTO employees (
            id,
            name,
            email,
            phone,
            address,
            position,
            department,
            salary,
            base_salary,
            net_salary,
            hire_date,
            status,
            is_active,
            role,
            bank_account,
            nif,
            permissions,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Maria Santos',
            'maria@restaurante.com',
            '+244 912 345 678',
            'Luanda, Avenida Comercial 456',
            'Garçom',
            'Salão',
            180000,
            180000,
            160000,
            '2023-03-20',
            'active',
            true,
            'waiter',
            '0055.0000.8765.4321',
            '987654321',
            '{"orders": true, "payments": true}',
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employees'
ORDER BY ordinal_position;

-- Verificar dados
SELECT COUNT(*) as total_employees FROM employees;
