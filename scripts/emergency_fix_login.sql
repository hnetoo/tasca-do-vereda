-- EMERGENCY FIX - RESOLVER PROBLEMA DE LOGIN AGORA
-- Execute este script IMEDIATAMENTE para resolver o problema

-- 1. VERIFICAR SE TABELA USERS EXISTE E MOSTRAR DADOS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela users encontrada';
        
        -- Mostrar todos os dados da tabela users
        RAISE NOTICE '📊 Dados completos da tabela users:';
        
        DECLARE
            user_record RECORD;
            counter INTEGER := 0;
        BEGIN
            FOR user_record IN 
                SELECT * FROM users ORDER BY created_at DESC
            LOOP
                counter := counter + 1;
                RAISE NOTICE '👤 Usuário %: ID=%, Nome=%, PIN=%, Role=%, Status=%', 
                    counter, 
                    user_record.id, 
                    user_record.name, 
                    COALESCE(user_record.pin, 'NULL'),
                    user_record.role,
                    user_record.status;
            END LOOP;
            
            IF counter = 0 THEN
                RAISE NOTICE '❌ NENHUM USUÁRIO ENCONTRADO NA TABELA USERS';
            ELSE
                RAISE NOTICE '✅ Total de % usuários encontrados', counter;
            END IF;
        END;
        
    ELSE
        RAISE NOTICE '❌ Tabela users NÃO encontrada';
        
        -- Verificar quais tabelas existem
        DECLARE
            table_rec RECORD;
        BEGIN
            RAISE NOTICE '📋 Tabelas encontradas no schema public:';
            FOR table_rec IN 
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name ILIKE '%user%' 
                OR table_name ILIKE '%auth%' 
                OR table_name ILIKE '%staff%'
                OR table_name ILIKE '%employee%'
                ORDER BY table_name
            LOOP
                RAISE NOTICE '  📁 %', table_rec.table_name;
            END LOOP;
        END;
    END IF;
END $$;

-- 2. TESTAR QUERY EXATA DO LOGIN COM PIN 1234
DO $$
BEGIN
    RAISE NOTICE '🔍 Testando query exata do login...';
    
    DECLARE
        test_count INTEGER;
        user_record RECORD;
    BEGIN
        -- Contar quantos usuários com PIN 1234
        SELECT COUNT(*) INTO test_count
        FROM users 
        WHERE pin = '1234' 
        AND role = 'admin' 
        AND status = 'active';
        
        RAISE NOTICE '📊 Usuários com PIN=1234, role=admin, status=active: %', test_count;
        
        IF test_count > 0 THEN
            -- Mostrar detalhes dos usuários encontrados
            RAISE NOTICE '👥 Detalhes dos usuários encontrados:';
            counter := 0;
            FOR user_record IN 
                SELECT * FROM users 
                WHERE pin = '1234' 
                AND role = 'admin' 
                AND status = 'active'
                ORDER BY created_at
            LOOP
                counter := counter + 1;
                RAISE NOTICE '  %️⃣ ID=%, Nome=%, Email=%, Criado=%', 
                    counter,
                    user_record.id,
                    user_record.name,
                    COALESCE(user_record.email, 'SEM EMAIL'),
                    user_record.created_at;
            END LOOP;
        ELSE
            RAISE NOTICE '❌ NENHUM USUÁRIO ENCONTRADO COM ESSES CRITÉRIOS';
            
            -- Tentar encontrar usuários com PIN 1234 (ignorando role/status)
            SELECT COUNT(*) INTO test_count
            FROM users WHERE pin = '1234';
            
            RAISE NOTICE '📊 Usuários com PIN=1234 (qualquer role/status): %', test_count;
            
            IF test_count > 0 THEN
                RAISE NOTICE '👥 Usuários com PIN 1234:';
                FOR user_record IN 
                    SELECT * FROM users WHERE pin = '1234' ORDER BY created_at
                LOOP
                    RAISE NOTICE '  📍 ID=%, Nome=%, Role=%, Status=%', 
                        user_record.id,
                        user_record.name,
                        user_record.role,
                        user_record.status;
                END LOOP;
            END IF;
        END IF;
    END;
END $$;

-- 3. CRIAR USUÁRIO ADMIN SE NÃO EXISTIR
DO $$
BEGIN
    DECLARE
        admin_count INTEGER;
    BEGIN
        -- Verificar se existe algum admin
        SELECT COUNT(*) INTO admin_count
        FROM users 
        WHERE role = 'admin' 
        AND status = 'active';
        
        IF admin_count = 0 THEN
            RAISE NOTICE '⚠️ NENHUM ADMIN ATIVO ENCONTRADO - CRIANDO ADMIN PADRÃO';
            
            -- Inserir admin padrão
            INSERT INTO users (
                id,
                name,
                email,
                pin,
                role,
                status,
                created_at,
                updated_at,
                permissions
            ) VALUES (
                gen_random_uuid(),
                'Admin Principal',
                'admin@tasca.vereda',
                '1234',
                'admin',
                'active',
                NOW,
                NOW,
                '{"all": true}'
            );
            
            RAISE NOTICE '✅ Admin padrão criado com PIN 1234';
        ELSE
            RAISE NOTICE '✅ % admin(s) ativos encontrados', admin_count;
        END IF;
    END;
END $$;

-- 4. LIMPAR CACHE E RECARREGAR SCHEMA
DO $$
BEGIN
    RAISE NOTICE '🔄 Limpando cache do Supabase...';
    
    NOTIFY pgrst, 'reload_schema';
    NOTIFY pgrst, 'reload_config';
    
    RAISE NOTICE '✅ Cache limpo e schema recarregado';
END $$;

-- 5. VERIFICAÇÃO FINAL
DO $$
BEGIN
    DECLARE
        final_count INTEGER;
    BEGIN
        -- Contagem final de admins ativos
        SELECT COUNT(*) INTO final_count
        FROM users 
        WHERE pin = '1234' 
        AND role = 'admin' 
        AND status = 'active';
        
        RAISE NOTICE '🎯 RESULTADO FINAL:';
        RAISE NOTICE '📊 Admins ativos com PIN 1234: %', final_count;
        
        IF final_count > 0 THEN
            RAISE NOTICE '✅ LOGIN DEVE FUNCIONAR AGORA!';
            RAISE NOTICE '🔑 Use: PIN = 1234, Role = Admin';
        ELSE
            RAISE NOTICE '❌ PROBLEMA AINDA PERSISTE';
            RAISE NOTICE '🔧 Verifique os logs acima para detalhes';
        END IF;
    END;
END $$;

-- RESULTADO ESPERADO:
-- ✅ Diagnóstico completo da tabela users
-- ✅ Verificação de usuários com PIN 1234
-- ✅ Criação automática de admin se necessário
-- ✅ Cache limpo e schema recarregado
-- ✅ Login funcional com PIN 1234
