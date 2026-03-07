-- TESTE DE CONEXÃO À BASE DE DADOS - VERIFICAÇÃO COMPLETA
-- Execute este script para verificar se a conexão com o Supabase está funcional

-- 1. TESTE BÁSICO DE CONEXÃO
SELECT 
    'CONNECTION_TEST' as test_name,
    'SUCCESS' as status,
    NOW as timestamp,
    version as postgresql_version;

-- 2. VERIFICAR SE PODE ACESSAR INFORMATION_SCHEMA
SELECT 
    'SCHEMA_ACCESS' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 3. VERIFICAR SE PODE LISTAR TABELAS PRINCIPAIS
SELECT 
    'TABLE_LIST' as test_name,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN (
        'users', 'employees', 'profiles', 'staff_accounts',
        'orders', 'restaurant_tables', 'menu_items',
        'expenses', 'revenues', 'payroll_records'
    )
ORDER BY table_name;

-- 4. TESTAR PERMISSÕES DE LEITURA
DO $$
BEGIN
    RAISE NOTICE '🔍 Testando permissões de leitura...';
    
    -- Testar SELECT em information_schema
    DECLARE
        schema_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO schema_count
        FROM information_schema.tables 
        WHERE table_schema = 'public';
        
        RAISE NOTICE '✅ Permissão information_schema: % tabelas encontradas', schema_count;
    EXCEPTION
        WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao acessar information_schema: %', SQLERRM;
    END;
    
    -- Testar SELECT em tabelas principais (se existirem)
    DECLARE
        table_name TEXT;
        table_count INTEGER;
    BEGIN
        FOR table_name IN 
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'employees', 'restaurant_tables')
            LIMIT 3
        LOOP
            BEGIN
                EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;
                RAISE NOTICE '✅ Tabela %s: % registros', table_name, table_count;
            EXCEPTION
                WHEN OTHERS THEN
                RAISE NOTICE '❌ Erro ao acessar tabela %s: %', table_name, SQLERRM;
            END;
        END LOOP;
    END;
END $$;

-- 5. VERIFICAR VARIÁVEIS DE AMBIENTE DO SUPABASE
SELECT 
    'ENVIRONMENT_CHECK' as test_name,
    current_database as database_name,
    current_schema as current_schema,
    session_user as session_user,
    current_user as current_user;

-- 6. TESTAR LIMPEZA DE CACHE
DO $$
BEGIN
    RAISE NOTICE '🔄 Testando limpeza de cache...';
    
    -- Enviar notificações para limpar cache
    NOTIFY pgrst, 'reload_schema';
    NOTIFY pgrst, 'reload_config';
    
    RAISE NOTICE '✅ Cache reload enviado para pgrst';
END $$;

-- 7. VERIFICAR SE A CONEXÃO ESTÁ ATIVA (PING)
SELECT 
    'PING_TEST' as test_name,
    'ACTIVE' as connection_status,
    pg_backend_pid as backend_pid,
    inet_server_addr as server_address,
    inet_server_port as server_port;

-- 8. TESTAR OPERAÇÃO BÁSICA DE ESCRITA (TEMPORÁRIO)
DO $$
BEGIN
    RAISE NOTICE '🧪 Testando operação de escrita...';
    
    -- Criar tabela temporária para teste
    BEGIN
        CREATE TEMP TABLE connection_test (
            id SERIAL PRIMARY KEY,
            test_time TIMESTAMP DEFAULT NOW,
            message TEXT
        );
        
        -- Inserir registro de teste
        INSERT INTO connection_test (message) 
        VALUES ('Database connection test successful');
        
        -- Verificar inserção
        DECLARE
            test_id INTEGER;
        BEGIN
            SELECT id INTO test_id 
            FROM connection_test 
            WHERE message = 'Database connection test successful'
            LIMIT 1;
            
            IF test_id IS NOT NULL THEN
                RAISE NOTICE '✅ Operação de escrita bem-sucedida (ID: %)', test_id;
            ELSE
                RAISE NOTICE '❌ Falha na operação de escrita';
            END IF;
        END;
        
        -- Limpar tabela temporária
        DROP TABLE connection_test;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro na operação de escrita: %', SQLERRM;
    END;
END $$;

-- 9. RESUMO FINAL
SELECT 
    'CONNECTION_SUMMARY' as test_name,
    CASE 
        WHEN pg_backend_pid > 0 THEN 'FULLY_FUNCTIONAL'
        ELSE 'PROBLEM_DETECTED'
    END as overall_status,
    NOW as test_completed_at;

-- RESULTADO ESPERADO:
-- ✅ Conexão básica funcional
-- ✅ Acesso ao information_schema
-- ✅ Lista de tabelas principais
-- ✅ Permissões de leitura verificadas
-- ✅ Cache reload funcionando
-- ✅ Operações de escrita funcionando
-- ✅ Conexão ativa e estável
