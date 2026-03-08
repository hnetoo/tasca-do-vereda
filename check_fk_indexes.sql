-- DIAGNÓSTICO DE PERFORMANCE: ÍNDICES EM FOREIGN KEYS
-- Verifica se todas as colunas de chave estrangeira possuem índices para otimizar JOINs.

DO $$
DECLARE
    r RECORD;
    idx_exists BOOLEAN;
    missing_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== 🏎️ VERIFICAÇÃO DE PERFORMANCE: ÍNDICES EM FKs ===';

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
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        -- Verifica se existe algum índice onde esta coluna é a PRIMEIRA coluna
        -- (O PostgreSQL usa índices para FKs eficientemente se a coluna for a primeira ou única)
        SELECT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_attribute a ON a.attrelid = c.oid
            WHERE c.relname = r.table_name
              AND a.attname = r.column_name
              AND a.attnum = i.indkey[0] -- Verifica se é a primeira coluna do índice
        ) INTO idx_exists;

        IF NOT idx_exists THEN
            missing_count := missing_count + 1;
            RAISE NOTICE '⚠️  FALTA ÍNDICE: Tabela "%", Coluna "%" (FK: %)', r.table_name, r.column_name, r.constraint_name;
        END IF;
    END LOOP;

    RAISE NOTICE '---------------------------------------------------';
    IF missing_count = 0 THEN
        RAISE NOTICE '✅ Tudo otimizado! Todas as FKs têm índices correspondentes.';
    ELSE
        RAISE NOTICE '❌ Encontrados % índices faltantes. A performance de JOINs pode ser afetada.', missing_count;
        RAISE NOTICE '💡 Execute o script "fix_missing_fk_indexes.sql" para corrigir automaticamente.';
    END IF;
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;