-- Migration para verificar e popular tabelas de dishes e categories
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f migration_check_dishes_categories.sql

-- Verificar se as tabelas existem
SELECT 'dishes' as table_name, 
       COUNT(*) as record_count,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'dishes' 
  AND table_schema = 'public'
GROUP BY table_name, column_name, data_type, is_nullable
ORDER BY ordinal_position;

SELECT 'categories' as table_name,
       COUNT(*) as record_count,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' 
  AND table_schema = 'public'
GROUP BY table_name, column_name, data_type, is_nullable
ORDER BY ordinal_position;

-- Verificar registros existentes
SELECT 'Dishes' as section, COUNT(*) as total_records FROM dishes;
SELECT 'Categories' as section, COUNT(*) as total_records FROM categories;

-- Se não houver registros, inserir dados básicos
DO $$
BEGIN
    -- Inserir categorias básicas se não existirem
    IF (SELECT COUNT(*) FROM categories) = 0 THEN
        INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Entradas', 'Pratos de entrada e petiscos', NOW(), NOW()),
        (gen_random_uuid(), 'Pratos Principais', 'Pratos principais do cardápio', NOW(), NOW()),
        (gen_random_uuid(), 'Sobremesas', 'Doces e sobremesas', NOW(), NOW()),
        (gen_random_uuid(), 'Bebidas', 'Refrigerantes, sucos e bebidas', NOW(), NOW()),
        (gen_random_uuid(), 'Café', 'Cafés e chás', NOW(), NOW());
        
        RAISE NOTICE 'Categorias básicas inseridas com sucesso';
    END IF;
    
    -- Inserir pratos básicos se não existirem
    IF (SELECT COUNT(*) FROM dishes) = 0 THEN
        INSERT INTO dishes (id, name, description, price, category_id, created_at, updated_at) 
        SELECT 
            gen_random_uuid(),
            'Prato Exemplo ' || generate_series(1, 10),
            'Descrição do prato exemplo ' || generate_series(1, 10),
            (random() * 5000 + 1000)::integer, -- Preço entre 1000 e 6000 Kz
            id,
            NOW(),
            NOW()
        FROM categories 
        LIMIT 5;
        
        RAISE NOTICE 'Pratos básicos inseridos com sucesso';
    END IF;
END $$;

-- Verificar resultado final
SELECT 'Final Check' as section, 
       (SELECT COUNT(*) FROM categories) as categories_count,
       (SELECT COUNT(*) FROM dishes) as dishes_count;

-- Exibir alguns dados inseridos
SELECT 'Sample Categories' as section, id, name, description FROM categories LIMIT 3;
SELECT 'Sample Dishes' as section, id, name, price, category_id FROM dishes LIMIT 3;
