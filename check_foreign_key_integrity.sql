-- DIAGNÓSTICO DE INTEGRIDADE DE CHAVES ESTRANGEIRAS (FOREIGN KEYS)
-- Este script verifica a saúde das relações entre tabelas após renomeações.

DO $$
DECLARE
    r RECORD;
    orphan_count INTEGER;
    ref_table TEXT;
    target_col TEXT;
BEGIN
    RAISE NOTICE '=== 🕵️ INICIANDO VERIFICAÇÃO DE INTEGRIDADE DE FKs ===';

    -- 1. Listar FKs oficialmente definidas
    RAISE NOTICE '--- 🔗 Chaves Estrangeiras Definidas (Oficiais) ---';
    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE '✅ DEFINIDA: % (%) -> % (%)', r.table_name, r.column_name, r.foreign_table_name, r.foreign_column_name;
    END LOOP;

    -- 2. Verificar potenciais FKs perdidas (colunas *_id sem constraint)
    RAISE NOTICE '--- ⚠️ Potenciais FKs Faltando (Colunas *_id sem vínculo) ---';
    FOR r IN 
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu
          ON c.table_name = kcu.table_name 
          AND c.column_name = kcu.column_name
        WHERE c.table_schema = 'public'
          AND c.column_name LIKE '%_id'
          AND kcu.constraint_name IS NULL
          AND c.table_name NOT IN ('audit_logs', 'transactions', 'daily_analytics') -- Ignorar tabelas de log/analytics
    LOOP
        RAISE NOTICE '❓ ALERTA: Tabela "%" tem coluna "%" mas NÃO é uma Foreign Key.', r.table_name, r.column_name;
    END LOOP;

    -- 3. Verificar integridade de dados (Orphans) para relações críticas
    -- Isso verifica se os dados estão consistentes, mesmo sem FK definida
    RAISE NOTICE '--- 🔍 Verificando Registros Órfãos (Dados Quebrados) ---';
    
    -- 3.1 PAYROLL -> STAFF/EMPLOYEES
    -- Tenta detectar qual tabela de funcionários existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
        ref_table := 'staff';
    ELSE
        ref_table := 'employees';
    END IF;

    -- Verifica staff_id ou employee_id
    FOREACH target_col IN ARRAY ARRAY['staff_id', 'employee_id'] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name = target_col) THEN
            -- Usa cast ::text para evitar erros de UUID vs VARCHAR
            EXECUTE format('SELECT COUNT(*) FROM payroll p WHERE p.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I s WHERE s.id::text = p.%I::text)', target_col, ref_table, target_col) INTO orphan_count;
            
            IF orphan_count > 0 THEN
                RAISE NOTICE '❌ ERRO CRÍTICO EM PAYROLL: % registros com % inválido (não existe em %).', orphan_count, target_col, ref_table;
            ELSE
                RAISE NOTICE '✅ PAYROLL: Integridade de % OK.', target_col;
            END IF;
        END IF;
    END LOOP;

    -- 3.2 ORDERS -> RESTAURANT_TABLES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') AND 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables') THEN
       
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'table_id') THEN
            EXECUTE 'SELECT COUNT(*) FROM orders o WHERE o.table_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM restaurant_tables t WHERE t.id::text = o.table_id::text)' INTO orphan_count;
            IF orphan_count > 0 THEN
                RAISE NOTICE '❌ ERRO CRÍTICO EM ORDERS: % pedidos com table_id inválido.', orphan_count;
            ELSE
                RAISE NOTICE '✅ ORDERS: Integridade de table_id OK.';
            END IF;
        END IF;
    END IF;

    -- 3.3 DISHES -> CATEGORIES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories') THEN
        ref_table := 'menu_categories';
    ELSE
        ref_table := 'categories'; -- Fallback para nome antigo
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') AND 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ref_table) THEN
       
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dishes' AND column_name = 'category_id') THEN
            EXECUTE format('SELECT COUNT(*) FROM dishes d WHERE d.category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I c WHERE c.id::text = d.category_id::text)', ref_table) INTO orphan_count;
            IF orphan_count > 0 THEN
                RAISE NOTICE '❌ ERRO CRÍTICO EM DISHES: % pratos com category_id inválido (não existe em %).', orphan_count, ref_table;
            ELSE
                RAISE NOTICE '✅ DISHES: Integridade de category_id OK.';
            END IF;
        END IF;
    END IF;

    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;