-- Migration para corrigir estrutura da tabela users
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f fix_users_table_structure.sql

-- Adicionar colunas que faltam na tabela users
DO $$
BEGIN
    -- Adicionar coluna pin se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'pin'
    ) THEN
        ALTER TABLE users ADD COLUMN pin VARCHAR(10) NOT NULL DEFAULT '1234';
        RAISE NOTICE 'Column pin added to users table';
    END IF;
    
    -- Adicionar coluna role se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'ADMIN';
        RAISE NOTICE 'Column role added to users table';
    END IF;
    
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
        RAISE NOTICE 'Column status added to users table';
    END IF;
    
    -- Adicionar coluna permissions se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{}';
        RAISE NOTICE 'Column permissions added to users table';
    END IF;
    
    -- Adicionar coluna last_login se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        RAISE NOTICE 'Column last_login added to users table';
    END IF;
    
    -- Adicionar colunas created_at e updated_at se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Column created_at added to users table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Column updated_at added to users table';
    END IF;
END $$;

-- Inserir usuários padrão se a tabela estiver vazia
INSERT INTO users (name, email, pin, role, status, permissions, created_at, updated_at)
SELECT 
    'Administrador', 
    'admin@tasca.com', 
    '1234', 
    'ADMIN', 
    'active', 
    '{"all": true}', 
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

INSERT INTO users (name, email, pin, role, status, permissions, created_at, updated_at)
SELECT 
    'Owner', 
    'owner@tasca.com', 
    '1234', 
    'OWNER', 
    'active', 
    '{"owner": true}', 
    NOW(), 
    NOW()
WHERE (SELECT COUNT(*) FROM users) = 1;

INSERT INTO users (name, email, pin, role, status, permissions, created_at, updated_at)
SELECT 
    'Caixa', 
    'caixa@tasca.com', 
    '1234', 
    'CAIXA', 
    'active', 
    '{"pos": true, "orders": true}', 
    NOW(), 
    NOW()
WHERE (SELECT COUNT(*) FROM users) = 2;

INSERT INTO users (name, email, pin, role, status, permissions, created_at, updated_at)
SELECT 
    'Garçom', 
    'garcom@tasca.com', 
    '1234', 
    'GARCOM', 
    'active', 
    '{"orders": true, "tables": true}', 
    NOW(), 
    NOW()
WHERE (SELECT COUNT(*) FROM users) = 3;

INSERT INTO users (name, email, pin, role, status, permissions, created_at, updated_at)
SELECT 
    'Cozinha', 
    'cozinha@tasca.com', 
    '1234', 
    'COZINHA', 
    'active', 
    '{"kitchen": true, "orders": true}', 
    NOW(), 
    NOW()
WHERE (SELECT COUNT(*) FROM users) = 4;

-- Verificar estrutura final
SELECT 'Final Structure Check' as section,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public') as column_count;

-- Exibir estrutura final
SELECT 'Final Columns' as section, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Exibir usuários criados
SELECT 'Sample Users' as section, id, name, email, pin, role, status 
FROM users 
ORDER BY created_at;
