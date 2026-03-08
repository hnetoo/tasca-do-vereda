-- CORREÇÃO AUTOMÁTICA DE COLUNAS DE PRATOS (PT -> EN)
-- Este script normaliza as tabelas 'dishes' e 'menu_items' para inglês
-- Renomeia colunas se o destino não existir, ou copia dados se ambos existirem.

DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Iterar sobre as tabelas possíveis
    FOR t_name IN SELECT unnest(ARRAY['dishes', 'menu_items']) LOOP
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name) THEN
            RAISE NOTICE '=== CORRIGINDO TABELA: % ===', t_name;

            -- 1. NAME (Nome -> Name)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'nome') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'name') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN nome TO name', t_name);
                    RAISE NOTICE '✅ Coluna "nome" renomeada para "name" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET name = nome WHERE name IS NULL OR name = ''''', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "nome" para "name" em %', t_name;
                END IF;
            END IF;

            -- 2. PRICE (Preco -> Price)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'preco') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'price') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN preco TO price', t_name);
                    RAISE NOTICE '✅ Coluna "preco" renomeada para "price" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET price = preco WHERE price IS NULL OR price = 0', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "preco" para "price" em %', t_name;
                END IF;
            END IF;

            -- 3. DESCRIPTION (Descricao -> Description)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'descricao') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'description') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN descricao TO description', t_name);
                    RAISE NOTICE '✅ Coluna "descricao" renomeada para "description" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET description = descricao WHERE description IS NULL OR description = ''''', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "descricao" para "description" em %', t_name;
                END IF;
            END IF;

            -- 4. AVAILABLE (Disponivel -> Available)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'disponivel') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'available') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN disponivel TO available', t_name);
                    RAISE NOTICE '✅ Coluna "disponivel" renomeada para "available" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET available = disponivel', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "disponivel" para "available" em %', t_name;
                END IF;
            END IF;

            -- 5. CATEGORY_ID (Categoria_id -> Category_id)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'categoria_id') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'category_id') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN categoria_id TO category_id', t_name);
                    RAISE NOTICE '✅ Coluna "categoria_id" renomeada para "category_id" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET category_id = categoria_id WHERE category_id IS NULL', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "categoria_id" para "category_id" em %', t_name;
                END IF;
            END IF;
            
            -- 6. IMAGE_URL (Imagem -> Image_url)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'imagem') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'image_url') THEN
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN imagem TO image_url', t_name);
                    RAISE NOTICE '✅ Coluna "imagem" renomeada para "image_url" em %', t_name;
                ELSE
                    EXECUTE format('UPDATE %I SET image_url = imagem WHERE image_url IS NULL OR image_url = ''''', t_name);
                    RAISE NOTICE 'ℹ️ Dados copiados de "imagem" para "image_url" em %', t_name;
                END IF;
            END IF;

        ELSE
            RAISE NOTICE 'ℹ️ Tabela % não encontrada (ignorado).', t_name;
        END IF;
    END LOOP;
END $$;