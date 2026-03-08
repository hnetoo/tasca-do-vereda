-- CORREÇÃO DE PERFORMANCE: CRIAR ÍNDICES EM FKs FALTANTES
-- Cria índices automaticamente para colunas de chave estrangeira que não os possuem.

DO $$
DECLARE
    r RECORD;
    idx_exists BOOLEAN;
    idx_name TEXT;
    created_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== 🚀 OTIMIZANDO BANCO DE DADOS: CRIANDO ÍNDICES ===';

    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
    LOOP
        -- Verifica se existe índice (primeira coluna)
        SELECT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_attribute a ON a.attrelid = c.oid
            WHERE c.relname = r.table_name
              AND a.attname = r.column_name
              AND a.attnum = i.indkey[0]
        ) INTO idx_exists;

        IF NOT idx_exists THEN
            idx_name := 'idx_' || r.table_name || '_' || r.column_name;
            
            -- Encurtar nome se for muito longo (limite postgres é 63 bytes)
            IF length(idx_name) > 60 THEN
                idx_name := 'idx_' || r.table_name || '_' || substring(md5(r.column_name) from 1 for 8);
            END IF;

            RAISE NOTICE '🔨 Criando índice % em %.% ...', idx_name, r.table_name, r.column_name;
            
            BEGIN
                EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%I)', idx_name, r.table_name, r.column_name);
                created_count := created_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '   ❌ Erro ao criar índice: %', SQLERRM;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE '=== CONCLUÍDO: % índices criados. ===', created_count;
END $$;