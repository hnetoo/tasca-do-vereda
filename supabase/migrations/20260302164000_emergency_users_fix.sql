-- Migration emergencial para garantir usuários criados
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f emergency_users_fix.sql

-- Verificar se tabela users existe e tem dados
DO $$
BEGIN
    -- Verificar se tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela users não existe, criando...';
        
        -- Criar tabela users básica
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            pin VARCHAR(10) NOT NULL DEFAULT '1234',
            role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            permissions JSONB DEFAULT '{}',
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
    
    -- Limpar usuários existentes para evitar conflitos
    DELETE FROM users;
    
    -- Inserir usuários padrão
    INSERT INTO users (name, email, pin, role, status, permissions) VALUES
    ('Administrador', 'admin@tasca.com', '1234', 'ADMIN', 'active', '{"all": true}'),
    ('Owner', 'owner@tasca.com', '1234', 'OWNER', 'active', '{"owner": true}'),
    ('Caixa', 'caixa@tasca.com', '1234', 'CAIXA', 'active', '{"pos": true, "orders": true}'),
    ('Garçom', 'garcom@tasca.com', '1234', 'GARCOM', 'active', '{"orders": true, "tables": true}'),
    ('Cozinha', 'cozinha@tasca.com', '1234', 'COZINHA', 'active', '{"kitchen": true, "orders": true}');
    
    -- Verificar resultado
    DECLARE user_count INTEGER;
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE 'Usuários criados: %', user_count;
    
    -- Mostrar usuários criados
    RAISE NOTICE '=== USUÁRIOS CRIADOS ===';
    FOR user_record IN SELECT name, email, pin, role, status FROM users ORDER BY role LOOP
        RAISE NOTICE 'Nome: %, Email: %, PIN: %, Role: %, Status: %', 
            user_record.name, user_record.email, user_record.pin, user_record.role, user_record.status;
    END LOOP;
    
    RAISE NOTICE '=== USE ESTAS CREDENCIAIS ===';
    RAISE NOTICE 'ADMIN: PIN 1234';
    RAISE NOTICE 'OWNER: PIN 1234';
    RAISE NOTICE 'CAIXA: PIN 1234';
    RAISE NOTICE 'GARÇOM: PIN 1234';
    RAISE NOTICE 'COZINHA: PIN 1234';
    
END $$;
