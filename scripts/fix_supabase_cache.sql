-- LIMPAR CACHE DO SUPABASE E ATUALIZAR SCHEMA
-- Execute este script no painel SQL do Supabase

-- 1. VERIFICAR SE A COLUNA updated_at EXISTE EM restaurant_tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
    AND table_schema = 'public'
    AND column_name = 'updated_at';

-- 2. REMOVER COLUNA updated_at SE EXISTIR (NÃO É NECESSÁRIA)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurant_tables DROP COLUMN IF EXISTS "updated_at";
        RAISE NOTICE 'Coluna updated_at removida de restaurant_tables';
    END IF;
END $$;

-- 3. VERIFICAR ESTRUTURA ATUAL DE restaurant_tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. GARANTIR QUE A COLUNA label EXISTA E ESTEJA CORRETA
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '';

-- 5. ATUALIZAR REGISTROS COM label VAZIO
UPDATE restaurant_tables 
SET label = COALESCE(NULLIF(label, ''), 'Mesa ' || number::text)
WHERE label = '' OR label IS NULL;

-- 6. LIMPAR CACHE DO SUPABASE (FORÇAR ATUALIZAÇÃO DO SCHEMA)
-- Estas funções forçam o Supabase a recarregar o schema
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- 7. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. VERIFICAR DADOS ATUAIS (APENAS COLUNAS QUE EXISTEM)
SELECT 
    id,
    label,
    number,
    status,
    created_at
FROM restaurant_tables 
ORDER BY number ASC
LIMIT 10;

-- 9. VERIFICAR SE A COLUNA seats EXISTE ANTES DE USAR
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'seats'
        AND table_schema = 'public'
    ) THEN
        -- Se seats existe, mostrar dados com seats
        RAISE NOTICE 'Coluna seats encontrada, incluindo na consulta';
    ELSE
        -- Se seats não existe, adicionar a coluna
        ALTER TABLE restaurant_tables 
        ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 4;
        RAISE NOTICE 'Coluna seats adicionada';
    END IF;
END $$;

-- 10. VERIFICAR DADOS COM seats (AGORA DEVE EXISTIR)
SELECT 
    id,
    label,
    number,
    seats,
    status,
    created_at
FROM restaurant_tables 
ORDER BY number ASC
LIMIT 5;

-- 11. TESTAR INSERÇÃO COM label (APENAS SE seats EXISTIR)
DO $$
BEGIN
    -- Verificar se todas as colunas necessárias existem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name IN ('label', 'seats', 'status', 'x', 'y', 'zone', 'shape', 'rotation', 'color', 'is_active')
        AND table_schema = 'public'
        GROUP BY column_name
        HAVING COUNT(*) = 10
    ) THEN
        INSERT INTO restaurant_tables (
            label,
            number,
            seats,
            status,
            x,
            y,
            zone,
            shape,
            rotation,
            color,
            is_active
        ) VALUES (
            'Mesa Teste Cache',
            999,
            4,
            'AVAILABLE',
            0,
            0,
            'INTERIOR',
            'RECTANGLE',
            0,
            '#3B82F6',
            true
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Registro de teste inserido com sucesso';
    ELSE
        RAISE NOTICE 'Algumas colunas necessárias não existem, pulando teste de inserção';
    END IF;
END $$;

-- 12. VERIFICAR INSERÇÃO
SELECT 
    id,
    label,
    number,
    status
FROM restaurant_tables 
WHERE label = 'Mesa Teste Cache';

-- 13. LIMPAR REGISTRO DE TESTE
DELETE FROM restaurant_tables WHERE label = 'Mesa Teste Cache';

-- 14. VERIFICAR ESTRUTURA FINAL
SELECT 
    'COLUNA: ' || column_name as info,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- RESULTADO ESPERADO:
-- ✅ Coluna updated_at removida se existia
-- ✅ Coluna label garantida
-- ✅ Coluna seats adicionada se não existia
-- ✅ Cache do Supabase limpo
-- ✅ Schema atualizado
-- ✅ Testes de inserção funcionando
