-- CHECK USERS TABLE STRUCTURE - ENCONTRAR TABELA DE UTILIZADORES CORRETA
-- Execute este script para encontrar o nome REAL da tabela de utilizadores

-- 1. VERIFICAR TODAS AS TABELAS POSSÍVEIS DE UTILIZADORES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%user%' 
        OR table_name ILIKE '%profile%' 
        OR table_name ILIKE '%account%' 
        OR table_name ILIKE '%auth%'
        OR table_name ILIKE '%staff%'
        OR table_name ILIKE '%employee%'
    )
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA USERS (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        PERFORM 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela users encontrada';
        
        -- Mostrar estrutura da tabela users
        RAISE NOTICE 'Estrutura da tabela users:';
        
        -- Usar PERFORM para descartar resultados ou armazenar em variável
        DECLARE
            col_info RECORD;
        BEGIN
            FOR col_info IN 
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    character_maximum_length,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                    AND table_schema = 'public'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '  Coluna: % | Tipo: % | Nulo: % | Tamanho: % | Default: %', 
                    col_info.column_name, 
                    col_info.data_type, 
                    col_info.is_nullable, 
                    col_info.character_maximum_length, 
                    col_info.column_default;
            END LOOP;
        END;
        
    ELSE
        RAISE NOTICE '❌ Tabela users NÃO encontrada';
    END IF;
END $$;

-- 3. VERIFICAR ESTRUTURA DA TABELA PROFILES (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        PERFORM 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela profiles encontrada';
        
        -- Mostrar estrutura da tabela profiles
        RAISE NOTICE 'Estrutura da tabela profiles:';
        
        DECLARE
            col_info RECORD;
        BEGIN
            FOR col_info IN 
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    character_maximum_length,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'profiles' 
                    AND table_schema = 'public'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '  Coluna: % | Tipo: % | Nulo: % | Tamanho: % | Default: %', 
                    col_info.column_name, 
                    col_info.data_type, 
                    col_info.is_nullable, 
                    col_info.character_maximum_length, 
                    col_info.column_default;
            END LOOP;
        END;
        
    ELSE
        RAISE NOTICE '❌ Tabela profiles NÃO encontrada';
    END IF;
END $$;

-- 4. VERIFICAR ESTRUTURA DA TABELA STAFF_ACCOUNTS (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        PERFORM 1 FROM information_schema.tables 
        WHERE table_name = 'staff_accounts' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela staff_accounts encontrada';
        
        -- Mostrar estrutura da tabela staff_accounts
        RAISE NOTICE 'Estrutura da tabela staff_accounts:';
        
        DECLARE
            col_info RECORD;
        BEGIN
            FOR col_info IN 
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    character_maximum_length,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'staff_accounts' 
                    AND table_schema = 'public'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '  Coluna: % | Tipo: % | Nulo: % | Tamanho: % | Default: %', 
                    col_info.column_name, 
                    col_info.data_type, 
                    col_info.is_nullable, 
                    col_info.character_maximum_length, 
                    col_info.column_default;
            END LOOP;
        END;
        
    ELSE
        RAISE NOTICE '❌ Tabela staff_accounts NÃO encontrada';
    END IF;
END $$;

-- 5. VERIFICAR QUAIS TABELAS TÊM COLUNA PIN
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND column_name = 'pin'
ORDER BY table_name;

-- 6. VERIFICAR QUAIS TABELAS TÊM COLUNAS DE AUTENTICAÇÃO
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND column_name IN ('pin', 'password', 'senha', 'email', 'username', 'login')
ORDER BY table_name, column_name;

-- 7. TESTAR QUERY EXATA USADA NO LOGIN (COM PIN STRING)
DO $$
BEGIN
    RAISE NOTICE '🔍 Testando query exata do login...';
    
    DECLARE
        test_count INTEGER;
        pin_type TEXT;
    BEGIN
        -- Verificar tipo da coluna pin
        SELECT data_type INTO pin_type
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pin'
        AND table_schema = 'public';
        
        -- Testar query com string
        IF pin_type IN ('numeric', 'integer', 'bigint', 'smallint') THEN
            -- Se for numérico, converter PIN para número
            PERFORM COUNT(*) INTO test_count
            FROM users 
            WHERE pin = '1234'::numeric 
            AND role = 'admin' 
            AND status = 'active';
            
            RAISE NOTICE '📊 Query com PIN numérico (1234): % resultados', test_count;
        ELSE
            -- Se for string, usar string diretamente
            PERFORM COUNT(*) INTO test_count
            FROM users 
            WHERE pin = '1234' 
            AND role = 'admin' 
            AND status = 'active';
            
            RAISE NOTICE '📊 Query com PIN string (1234): % resultados', test_count;
        END IF;
    END;
END $$;

-- 8. LIMPAR CACHE DO SUPABASE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- RESULTADO ESPERADO:
-- ✅ Lista completa de tabelas possíveis
-- ✅ Estrutura detalhada de cada tabela
-- ✅ Identificação da tabela correta de utilizadores
-- ✅ Verificação de colunas de autenticação
