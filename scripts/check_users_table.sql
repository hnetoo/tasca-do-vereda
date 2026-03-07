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
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela users encontrada';
        
        SELECT 
            column_name,
            data_type,
            is_nullable,
            character_maximum_length,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
            AND table_schema = 'public'
        ORDER BY ordinal_position;
        
    ELSE
        RAISE NOTICE '❌ Tabela users NÃO encontrada';
    END IF;
END $$;

-- 3. VERIFICAR ESTRUTURA DA TABELA PROFILES (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela profiles encontrada';
        
        SELECT 
            column_name,
            data_type,
            is_nullable,
            character_maximum_length,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
            AND table_schema = 'public'
        ORDER BY ordinal_position;
        
    ELSE
        RAISE NOTICE '❌ Tabela profiles NÃO encontrada';
    END IF;
END $$;

-- 4. VERIFICAR ESTRUTURA DA TABELA STAFF_ACCOUNTS (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'staff_accounts' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela staff_accounts encontrada';
        
        SELECT 
            column_name,
            data_type,
            is_nullable,
            character_maximum_length,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'staff_accounts' 
            AND table_schema = 'public'
        ORDER BY ordinal_position;
        
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

-- 7. LIMPAR CACHE DO SUPABASE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- RESULTADO ESPERADO:
-- ✅ Lista completa de tabelas possíveis
-- ✅ Estrutura detalhada de cada tabela
-- ✅ Identificação da tabela correta de utilizadores
-- ✅ Verificação de colunas de autenticação
