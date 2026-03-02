-- Teste direto da API Supabase para verificar problema 406
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f test_supabase_api.sql

-- Testar se a tabela users existe e tem dados
DO $$
DECLARE
    user_count INTEGER;
    column_record RECORD;
    user_record RECORD;
    test_user RECORD;
    pin_user RECORD;
    admin_user RECORD;
BEGIN
    RAISE NOTICE '=== TESTE DIRETO DA TABELA USERS ===';
    
    -- Verificar se tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabela users existe';
        
        -- Contar registros
        SELECT COUNT(*) INTO user_count FROM users;
        RAISE NOTICE '📊 Total de usuários: %', user_count;
        
        -- Verificar estrutura
        RAISE NOTICE '🔍 Estrutura da tabela:';
        FOR column_record IN 
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (nullable: %)', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.is_nullable;
        END LOOP;
        
        -- Mostrar usuários existentes
        RAISE NOTICE '👥 Usuários existentes:';
        FOR user_record IN 
            SELECT id, name, email, pin, role, status 
            FROM users 
            ORDER BY role, name
        LOOP
            RAISE NOTICE '  ID: % | Nome: % | Email: % | PIN: % | Role: % | Status: %', 
                user_record.id, 
                user_record.name, 
                user_record.email, 
                user_record.pin, 
                user_record.role, 
                user_record.status;
        END LOOP;
        
        -- Testar query específica do login
        RAISE NOTICE '🔐 Testando query específica (PIN=1234, role=ADMIN, status=active):';
        BEGIN
            SELECT * INTO test_user FROM users 
            WHERE pin = '1234' AND role = 'ADMIN' AND status = 'active';
            
            IF test_user IS NOT NULL THEN
                RAISE NOTICE '✅ Usuário encontrado: % (%)', test_user.name, test_user.email;
            ELSE
                RAISE NOTICE '❌ Nenhum usuário encontrado com esses critérios';
                
                -- Tentar outras combinações
                RAISE NOTICE '🔍 Tentando outras combinações:';
                
                -- Verificar se existe usuário com PIN 1234
                SELECT * INTO pin_user FROM users WHERE pin = '1234' LIMIT 1;
                IF pin_user IS NOT NULL THEN
                    RAISE NOTICE '  ✅ Usuário com PIN 1234: % (role: %, status: %)', 
                        pin_user.name, pin_user.role, pin_user.status;
                ELSE
                    RAISE NOTICE '  ❌ Nenhum usuário com PIN 1234';
                END IF;
                
                -- Verificar se existe usuário ADMIN
                SELECT * INTO admin_user FROM users WHERE role = 'ADMIN' LIMIT 1;
                IF admin_user IS NOT NULL THEN
                    RAISE NOTICE '  ✅ Usuário ADMIN: % (PIN: %, status: %)', 
                        admin_user.name, admin_user.pin, admin_user.status;
                ELSE
                    RAISE NOTICE '  ❌ Nenhum usuário ADMIN';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro na query: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '❌ Tabela users não existe';
        
        -- Criar tabela users básica
        RAISE NOTICE '🔧 Criando tabela users básica...';
        EXECUTE '
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                pin VARCHAR(10) NOT NULL DEFAULT ''1234'',
                role VARCHAR(20) NOT NULL DEFAULT ''ADMIN'',
                status VARCHAR(20) NOT NULL DEFAULT ''active'',
                permissions JSONB DEFAULT ''{}'',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela users criada';
        
        -- Inserir usuário padrão
        EXECUTE '
            INSERT INTO users (name, email, pin, role, status, permissions) VALUES
            (''Administrador'', ''admin@tasca.com'', ''1234'', ''ADMIN'', ''active'', ''{"all": true}'')
        ';
        
        RAISE NOTICE '✅ Usuário padrão criado (admin@tasca.com / PIN: 1234 / ADMIN)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTE CONCLUÍDO ===';
END $$;
