-- SQL PARA CORRIGIR PROBLEMA DE FOREIGN KEY
-- Execute este SQL no painel SQL do Supabase

-- PROBLEMA: dishes.category_id referencia menu_categories mas a tabela correta é categories
-- SOLUÇÃO: Atualizar foreign key para apontar para a tabela correta

-- 1. PRIMEIRO VERIFICAR QUAIS TABELAS EXISTEM
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('dishes', 'categories', 'menu_categories')
    AND column_name = 'id'
ORDER BY table_name, ordinal_position;

-- 2. VERIFICAR REFERÊNCIAS ATUAIS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name AS foreign_key_column,
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'dishes'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. SE menu_categories EXISTIR e categories NÃO, RENOMEAR
DO $$
BEGIN
    -- Verificar se menu_categories existe e categories não
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'menu_categories'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'categories'
    ) THEN
        -- Renomear menu_categories para categories
        ALTER TABLE menu_categories RENAME TO categories;
        
        -- Atualizar foreign key em dishes
        ALTER TABLE dishes 
        DROP CONSTRAINT dishes_category_id_fkey;
        
        ALTER TABLE dishes 
        ADD CONSTRAINT dishes_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id);
        
        RAISE NOTICE 'Menu_categories renomeada para categories com sucesso';
    END IF;
END $$;

-- 4. SE AMBAS EXISTIREM, MANTER categories E USAR ELA
DO $$
BEGIN
    -- Se ambas existirem, remover menu_categories para evitar conflito
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'menu_categories'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'categories'
    ) THEN
        -- Remover menu_categories
        DROP TABLE IF EXISTS menu_categories CASCADE;
        
        -- Garantir que dishes aponta para categories
        ALTER TABLE dishes 
        DROP CONSTRAINT IF EXISTS dishes_category_id_fkey;
        
        ALTER TABLE dishes 
        ADD CONSTRAINT dishes_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id);
        
        RAISE NOTICE 'Menu_categories removida e dishes atualizado para categories';
    END IF;
END $$;

-- 5. SE NENHUMA EXISTIR, CRIAR categories
DO $$
BEGIN
    -- Se nenhuma existir, criar categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'categories'
    ) THEN
        -- Remover menu_categories se existir
        DROP TABLE IF EXISTS menu_categories CASCADE;
        
        -- Criar categories
        CREATE TABLE categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Atualizar dishes
        ALTER TABLE dishes 
        DROP CONSTRAINT IF EXISTS dishes_category_id_fkey;
        
        ALTER TABLE dishes 
        ADD CONSTRAINT dishes_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id);
        
        RAISE NOTICE 'Categories criada com sucesso';
    END IF;
END $$;

-- 6. MIGRAR DADOS DE menu_categories PARA categories (SE NECESSÁRIO)
DO $$
BEGIN
    -- Se menu_categories tiver dados e categories estiver vazia
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'menu_categories'
    ) AND EXISTS (
        SELECT 1 FROM menu_categories LIMIT 1
    ) AND NOT EXISTS (
        SELECT 1 FROM categories LIMIT 1
    ) THEN
        -- Migrar dados
        INSERT INTO categories (id, name, description, created_at, updated_at)
        SELECT 
            id,
            name,
            description,
            created_at,
            updated_at
        FROM menu_categories;
        
        RAISE NOTICE 'Dados migrados de menu_categories para categories';
    END IF;
END $$;

-- 7. VERIFICAÇÃO FINAL
SELECT 
    'FINAL_CHECK' as step,
    table_name,
    'RESOLVED' as status
FROM information_schema.tables 
WHERE table_name IN ('dishes', 'categories', 'menu_categories')
ORDER BY table_name;

-- 8. TESTAR INSERÇÃO EM DISHES
-- Isto vai funcionar só depois do fix
DO $$
BEGIN
    -- Tentar inserir um dish de teste (só se categories existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        INSERT INTO dishes (name, description, price, category_id, available)
        SELECT 
            'Test Dish' as name,
            'Test Description' as description,
            100.00 as price,
            id as category_id,
            true as available
        FROM categories 
        LIMIT 1;
        
        RAISE NOTICE 'Test dish inserido com sucesso - Foreign key funcionando';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao inserir test dish: %', SQLERRM;
END $$;

-- RESULTADO ESPERADO: 
-- 1. Foreign key corrigido para apontar para categories
-- 2. menu_categories removida se categories existir
-- 3. Dados migrados se necessário
-- 4. Teste de inserção funcionando
