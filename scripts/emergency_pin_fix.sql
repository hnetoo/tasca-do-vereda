-- EMERGENCY PIN FIX - VERIFICAR ESTRUTURA DA TABELA USERS
-- Execute este script imediatamente no Supabase para diagnosticar o problema de PIN

-- 1. VERIFICAR ESTRUTURA COMPLETA DA TABELA USERS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNNA 'pin' NA TABELA USERS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pin'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna PIN encontrada na tabela users';
        
        -- Mostrar exemplos de dados para verificação
        PERFORM dblink_connect_u('dbname=supabasedb');
        RAISE NOTICE 'Verificando dados existentes...';
        
    ELSE
        RAISE NOTICE '❌ Coluna PIN NÃO encontrada na tabela users';
        RAISE NOTICE 'Colunas encontradas: %', 
            (SELECT string_agg(column_name, ', ') 
             FROM information_schema.columns 
             WHERE table_name = 'users' 
             AND table_schema = 'public');
    END IF;
END $$;

-- 3. VERIFICAR SE EXISTE COLUNA 'status' (usada no login)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna status encontrada na tabela users';
    ELSE
        RAISE NOTICE '❌ Coluna status NÃO encontrada - isso pode causar erro no login';
        -- Adicionar coluna status se não existir
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        RAISE NOTICE '🔧 Coluna status adicionada automaticamente';
    END IF;
END $$;

-- 4. VERIFICAR DADOS EXISTENTES NA TABELA
SELECT 
    id,
    name,
    email,
    role,
    status,
    CASE 
        WHEN pin IS NOT NULL THEN '***' || RIGHT(pin, 1)
        ELSE 'NULL'
    END as pin_masked,
    created_at,
    last_login
FROM users 
ORDER BY created_at DESC
LIMIT 5;

-- 5. TESTAR QUERY EXATA USADA NO LOGIN (COM LOG DETALHADO)
DO $$
BEGIN
    RAISE NOTICE '🔍 Testando query exata do login...';
    
    -- Simular a query do login com PIN '1234' e role 'admin'
    DECLARE
        test_result RECORD;
        test_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM users 
        WHERE pin = '1234' 
        AND role = 'admin' 
        AND status = 'active';
        
        RAISE NOTICE '📊 Query result count: %', test_count;
        
        IF test_count > 0 THEN
            SELECT * INTO test_result
            FROM users 
            WHERE pin = '1234' 
            AND role = 'admin' 
            AND status = 'active'
            LIMIT 1;
            
            RAISE NOTICE '✅ Usuário encontrado: ID=%, Name=%', test_result.id, test_result.name;
        ELSE
            RAISE NOTICE '❌ Nenhum usuário encontrado com PIN=1234, role=admin, status=active';
        END IF;
    END;
END $$;

-- 6. VERIFICAR SE HÁ OUTRA TABELA DE FUNCIONÁRIOS (employees vs users)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('users', 'employees', 'staff')
    AND column_name = 'pin'
ORDER BY table_name, ordinal_position;

-- 7. LIMPAR CACHE DO SUPABASE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- RESULTADO ESPERADO:
-- ✅ Verificação completa da estrutura da tabela users
-- ✅ Confirmação da existência da coluna pin
-- ✅ Teste da query exata usada no login
-- ✅ Diagnóstico completo do problema de PIN
