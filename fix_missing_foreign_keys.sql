-- RECRIAÇÃO AUTOMÁTICA DE FOREIGN KEYS FALTANDO
-- Este script tenta identificar colunas *_id que não têm chave estrangeira
-- e cria a restrição apropriada, limpando dados órfãos se necessário.

DO $do$
DECLARE
    r RECORD;
    target_table TEXT;
    fk_constraint_name TEXT;
    orphan_count INTEGER;
    fk_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== 🔗 INICIANDO RECRIAÇÃO DE FOREIGN KEYS ===';

    -- Loop por todas as colunas que terminam em _id nas tabelas do schema public
    FOR r IN 
        SELECT 
            c.table_name, 
            c.column_name,
            c.is_nullable
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name LIKE '%_id'
          AND c.table_name NOT IN ('audit_logs', 'transactions', 'daily_analytics', 'external_finance') -- Ignorar tabelas de log/analytics
    LOOP
        -- 1. Verificar se já existe FK para esta coluna
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.key_column_usage kcu
            JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
            WHERE kcu.table_name = r.table_name 
              AND kcu.column_name = r.column_name
              AND tc.constraint_type = 'FOREIGN KEY'
        ) INTO fk_exists;

        IF NOT fk_exists THEN
            target_table := NULL;

            -- 2. Tentar adivinhar a tabela de destino baseada no nome da coluna
            CASE r.column_name
                WHEN 'category_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
                        target_table := 'menu_categories';
                    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
                        target_table := 'categories';
                    END IF;
                
                WHEN 'table_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables') THEN
                        target_table := 'restaurant_tables';
                    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
                        target_table := 'tables';
                    END IF;

                WHEN 'staff_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
                        target_table := 'staff';
                    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
                        target_table := 'employees';
                    END IF;

                WHEN 'employee_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
                        target_table := 'employees';
                    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
                        target_table := 'staff';
                    END IF;

                WHEN 'user_id' THEN
                    -- Assume employees para user_id neste sistema, baseado no schema
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
                        target_table := 'employees';
                    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
                        target_table := 'staff';
                    END IF;

                WHEN 'dish_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN
                        target_table := 'dishes';
                    END IF;

                WHEN 'order_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
                        target_table := 'orders';
                    END IF;
                
                WHEN 'shift_id' THEN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_shifts') THEN
                        target_table := 'cash_shifts';
                    END IF;

                ELSE
                    -- Ignorar outros desconhecidos
                    target_table := NULL;
            END CASE;

            -- 3. Se encontrou uma tabela destino válida
            IF target_table IS NOT NULL THEN
                RAISE NOTICE '🛠️ Processando: %.% -> % (id)', r.table_name, r.column_name, target_table;

                -- 3.1 Verificar e limpar dados órfãos (se a coluna for nullable)
                EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I IS NOT NULL AND %I::text NOT IN (SELECT id::text FROM %I)', r.table_name, r.column_name, r.column_name, target_table) INTO orphan_count;

                IF orphan_count > 0 THEN
                    IF r.is_nullable = 'YES' THEN
                        RAISE NOTICE '   🧹 Limpando % registros órfãos em %.% (Setando NULL)...', orphan_count, r.table_name, r.column_name;
                        EXECUTE format('UPDATE %I SET %I = NULL WHERE %I IS NOT NULL AND %I::text NOT IN (SELECT id::text FROM %I)', r.table_name, r.column_name, r.column_name, r.column_name, target_table);
                    ELSE
                        RAISE NOTICE '   ⚠️ ALERTA: % registros órfãos encontrados em %.% mas a coluna NÃO aceita NULL. Pulando criação de FK para evitar erro.', orphan_count, r.table_name, r.column_name;
                        CONTINUE; -- Pula para a próxima iteração
                    END IF;
                END IF;

                -- 3.2 Criar a Constraint
                fk_constraint_name := 'fk_' || r.table_name || '_' || r.column_name;
                
                -- Verificar se o nome da constraint já existe
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints tc WHERE tc.constraint_name = fk_constraint_name) THEN
                    fk_constraint_name := fk_constraint_name || '_' || floor(random() * 1000)::text;
                END IF;

                BEGIN
                    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(id)', r.table_name, fk_constraint_name, r.column_name, target_table);
                    RAISE NOTICE '   ✅ FK criada com sucesso: %', fk_constraint_name;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '   ❌ Erro ao criar FK: %', SQLERRM;
                END;
            ELSE
                RAISE NOTICE '   ℹ️ Nenhuma tabela destino óbvia encontrada para %.%', r.table_name, r.column_name;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE '=== FIM DA RECRIAÇÃO ===';
END $do$;