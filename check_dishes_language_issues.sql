-- DIAGNÓSTICO DE COLUNAS DE PRATOS (PORTUGUÊS vs INGLÊS)
-- Verifica as tabelas 'dishes' e 'menu_items' para identificar inconsistências

-- 1. Listar estrutura atual das tabelas de pratos
SELECT 
    table_name,
    ordinal_position, 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('dishes', 'menu_items')
ORDER BY table_name, ordinal_position;

-- 2. Verificação automática de pares comuns (PT -> EN)
DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Verificar para ambas as tabelas possíveis
    FOR t_name IN SELECT unnest(ARRAY['dishes', 'menu_items']) LOOP
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name) THEN
            RAISE NOTICE '=== ANALISANDO TABELA: % ===', t_name;

            -- Verificar Nome vs Name
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'nome') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'name') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "nome" (PT) mas falta "name" (EN).', t_name;
                END IF;
            END IF;

            -- Verificar Preço vs Price
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'preco') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'price') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "preco" (PT) mas falta "price" (EN).', t_name;
                END IF;
            END IF;

            -- Verificar Descrição vs Description
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'descricao') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'description') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "descricao" (PT) mas falta "description" (EN).', t_name;
                END IF;
            END IF;

            -- Verificar Disponível vs Available
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'disponivel') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'available') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "disponivel" (PT) mas falta "available" (EN).', t_name;
                END IF;
            END IF;
            
            -- Verificar Categoria
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'categoria_id') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'category_id') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "categoria_id" (PT) mas falta "category_id" (EN).', t_name;
                END IF;
            END IF;

        ELSE
            RAISE NOTICE 'ℹ️ Tabela % não existe neste banco de dados.', t_name;
        END IF;
        
    END LOOP;

    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;