-- DIAGNÓSTICO DE LIMPEZA DE SCHEMA: COLUNAS DUPLICADAS E OBSOLETAS
-- Este script varre o banco de dados em busca de:
-- 1. Colunas duplicadas (versões em PT e EN na mesma tabela).
-- 2. Colunas de nome redundantes (ex: 'staff_name' quando 'staff_id' existe).
-- 3. Colunas que estão completamente vazias (100% NULL).

DO $$
DECLARE
    r RECORD;
    t_name TEXT;
    c_name TEXT;
    pt_term TEXT;
    en_term TEXT;
    -- Lista de pares [Português, Inglês] para verificar duplicação
    pairs TEXT[][] := ARRAY[
        ['nome', 'name'], ['preco', 'price'], ['descricao', 'description'],
        ['telefone', 'phone'], ['telemovel', 'phone'], ['endereco', 'address'],
        ['morada', 'address'], ['estado', 'status'], ['situacao', 'status'],
        ['imagem', 'image_url'], ['foto', 'image_url'], ['categoria_id', 'category_id'],
        ['disponivel', 'available'], ['ativo', 'is_active'], ['salario', 'salary'],
        ['vencimento', 'salary'], ['salario_base', 'base_salary'], ['cargo', 'role'],
        ['funcao', 'role'], ['data', 'date'], ['criado_em', 'created_at'],
        ['atualizado_em', 'updated_at'], ['usuario_id', 'user_id'], ['cliente_id', 'customer_id'],
        ['mesa_id', 'table_id'], ['quantidade', 'quantity'], ['total_liquido', 'net_total'],
        ['observacoes', 'notes'], ['notas', 'notes'], ['tipo', 'type'],
        ['subsidios', 'subsidies'], ['descontos', 'deductions'], ['imposto', 'tax'],
        ['iva', 'tax'], ['nif', 'tax_id'], ['funcionario', 'staff_name']
    ];
    pair TEXT[];
    mismatch_count INTEGER;
    null_count BIGINT;
    total_count BIGINT;
    issue_found BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== 🧹 INICIANDO DIAGNÓSTICO DE LIMPEZA DO SCHEMA ===';

    -- PARTE 1: Verificar colunas duplicadas (PT vs EN)
    RAISE NOTICE '--- 1. Verificando Colunas Duplicadas (Português vs. Inglês) ---';
    FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name LOOP
        t_name := r.table_name;
        FOREACH pair SLICE 1 IN ARRAY pairs LOOP
            pt_term := pair[1];
            en_term := pair[2];

            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = pt_term) AND
               EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = en_term) THEN
                
                issue_found := TRUE;
                EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I::text != %I::text', t_name, pt_term, en_term) INTO mismatch_count;

                IF mismatch_count = 0 THEN
                    RAISE NOTICE '🚮 DUPLICAÇÃO SEGURA: Tabela "%" tem "%" e "%". Os dados são idênticos. Sugestão: DROP COLUMN %I;', t_name, pt_term, en_term, pt_term;
                ELSE
                    RAISE NOTICE '⚠️ DUPLICAÇÃO PERIGOSA: Tabela "%" tem "%" e "%", mas % registros têm dados diferentes. Requer migração manual antes de apagar.', t_name, pt_term, en_term, mismatch_count;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- PARTE 2: Verificar colunas de nome redundantes (ex: 'staff_name' vs 'staff_id')
    RAISE NOTICE '--- 2. Verificando Colunas de Nome Redundantes ---';
    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND column_name LIKE '%_id'
        ORDER BY table_name, column_name
    LOOP
        t_name := r.table_name;
        c_name := r.column_name;
        pt_term := replace(c_name, '_id', '_name');

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = pt_term) THEN
            issue_found := TRUE;
            RAISE NOTICE 'ℹ️ REDUNDÂNCIA: Tabela "%" tem "%" (FK) e "%" (nome). O nome pode ser obtido via JOIN. Sugestão: Avaliar se a coluna "%" pode ser removida.', t_name, c_name, pt_term, pt_term;
        END IF;
    END LOOP;

    -- PARTE 3: Verificar colunas 100% NULAS
    RAISE NOTICE '--- 3. Verificando Colunas Completamente Vazias (100%% NULL) ---';
    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND is_nullable = 'YES'
          AND table_name NOT LIKE 'pg_%' AND table_name NOT LIKE 'sql_%'
          AND column_name NOT IN ('deleted_at', 'updated_at', 'payment_date', 'end_time', 'closed_at', 'notes', 'description', 'image_url', 'address', 'email', 'phone')
        ORDER BY table_name, column_name
    LOOP
        t_name := r.table_name;
        c_name := r.column_name;

        EXECUTE format('SELECT COUNT(*), COUNT(CASE WHEN %I IS NULL THEN 1 END) FROM %I', c_name, t_name) INTO total_count, null_count;
        
        IF total_count > 0 AND total_count = null_count THEN
            issue_found := TRUE;
            RAISE NOTICE '🗑️ OBSOLETA?: Tabela "%", coluna "%" está 100%% NULA em % registros. É uma forte candidata a remoção.', t_name, c_name, total_count;
        END IF;
    END LOOP;

    RAISE NOTICE '---------------------------------------------------';
    IF NOT issue_found THEN
        RAISE NOTICE '✅ Nenhuma coluna duplicada ou obsoleta óbvia foi encontrada.';
    ELSE
        RAISE NOTICE '🏁 Diagnóstico concluído. Analise os avisos acima para limpar o schema.';
    END IF;
    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;