-- CHECK EMPLOYEES TABLE STRUCTURE - PRIORIDADE 1
-- Execute este script para verificar o nome REAL da coluna PIN

-- 1. VERIFICAR ESTRUTURA COMPLETA DA TABELA EMPLOYEES
SELECT 
    column_name,
    data_type,
    is_nullable,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNA 'pin' NA TABELA EMPLOYEES
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'pin'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna PIN encontrada na tabela employees';
        
        -- Mostrar tipo de dados da coluna pin
        DECLARE
            pin_type TEXT;
        BEGIN
            SELECT data_type INTO pin_type
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND column_name = 'pin'
            AND table_schema = 'public';
            
            RAISE NOTICE '📊 Tipo de dados da coluna pin: %', pin_type;
        END;
        
    ELSE
        RAISE NOTICE '❌ Coluna PIN NÃO encontrada na tabela employees';
        RAISE NOTICE 'Colunas encontradas: %', 
            (SELECT string_agg(column_name, ', ') 
             FROM information_schema.columns 
             WHERE table_name = 'employees' 
             AND table_schema = 'public');
    END IF;
END $$;

-- 3. VERIFICAR DADOS EXISTENTES NA TABELA EMPLOYEES
SELECT 
    id,
    name,
    email,
    role,
    CASE 
        WHEN pin IS NOT NULL THEN 
            CASE 
                WHEN data_type = 'numeric' OR data_type = 'integer' THEN pin::text
                ELSE '***' || RIGHT(pin::text, 1)
            END
        ELSE 'NULL'
    END as pin_masked,
    status,
    created_at,
    last_login
FROM employees, 
     (SELECT data_type FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pin' AND table_schema = 'public') as pin_info
ORDER BY created_at DESC
LIMIT 5;

-- 4. TESTAR QUERY EXATA USADA NO LOGIN (COM PIN STRING)
DO $$
BEGIN
    RAISE NOTICE '🔍 Testando query com PIN como STRING...';
    
    DECLARE
        test_count INTEGER;
        pin_type TEXT;
    BEGIN
        -- Verificar tipo da coluna pin
        SELECT data_type INTO pin_type
        FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'pin'
        AND table_schema = 'public';
        
        -- Testar query com string
        IF pin_type IN ('numeric', 'integer', 'bigint', 'smallint') THEN
            -- Se for numérico, converter PIN para número
            EXECUTE 'SELECT COUNT(*) FROM employees WHERE pin = $1 AND role = $2 AND status = $3'
            INTO test_count
            USING '1234'::numeric, 'admin', 'active';
            
            RAISE NOTICE '📊 Query com PIN numérico (1234): % resultados', test_count;
        ELSE
            -- Se for string, usar string diretamente
            EXECUTE 'SELECT COUNT(*) FROM employees WHERE pin = $1 AND role = $2 AND status = $3'
            INTO test_count
            USING '1234', 'admin', 'active';
            
            RAISE NOTICE '📊 Query com PIN string (1234): % resultados', test_count;
        END IF;
    END;
END $$;

-- 5. VERIFICAR SE HÁ OUTRAS TABELAS DE USUÁRIOS
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('users', 'employees', 'staff', 'funcionarios')
    AND column_name IN ('pin', 'password', 'senha')
ORDER BY table_name, ordinal_position;

-- 6. LIMPAR CACHE DO SUPABASE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- RESULTADO ESPERADO:
-- ✅ Estrutura completa da tabela employees
-- ✅ Nome exato da coluna de PIN
-- ✅ Tipo de dados da coluna PIN
-- ✅ Teste de query com tipo correto
-- ✅ Verificação de outras tabelas possíveis
