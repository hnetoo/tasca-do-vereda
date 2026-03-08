-- SCRIPT DE LIMPEZA: REMOVER COLUNAS DUPLICADAS SEGURAS
-- Este script remove automaticamente colunas em português que são duplicatas
-- exatas de colunas em inglês (onde todos os dados são idênticos).

DO $do$
DECLARE
    t_name TEXT;
    pt_term TEXT;
    en_term TEXT;
    pairs TEXT[][];
    pair TEXT[];
    mismatch_count INTEGER;
    dropped_count INTEGER := 0;
BEGIN
    -- Lista de pares [Português, Inglês] para verificar duplicação
    pairs := ARRAY[
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

    RAISE NOTICE '=== INICIANDO LIMPEZA DE COLUNAS DUPLICADAS SEGURAS ===';

    -- Loop através de todas as tabelas do schema public
    FOR r IN 
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE' 
        ORDER BY table_name 
    LOOP
        t_name := r.table_name;
        
        -- Loop em cada par de tradução
        FOREACH pair SLICE 1 IN ARRAY pairs LOOP
            pt_term := pair[1];
            en_term := pair[2];

            -- Verificar se AMBAS as colunas (PT e EN) existem na tabela
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = pt_term) AND
               EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = en_term) THEN
                
                -- A expressão 'IS DISTINCT FROM' trata NULLs corretamente e garante que os dados são idênticos.
                EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I IS DISTINCT FROM %I', t_name, pt_term, en_term) INTO mismatch_count;

                IF mismatch_count = 0 THEN
                    -- Se não há divergências, é seguro remover a coluna em português.
                    BEGIN
                        RAISE NOTICE 'Removendo coluna duplicada segura "%" da tabela "%"...', pt_term, t_name;
                        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', t_name, pt_term);
                        dropped_count := dropped_count + 1;
                    EXCEPTION
                        WHEN dependent_objects_still_exist THEN
                            RAISE WARNING 'FALHA AO REMOVER: A coluna "%" em "%" nao pode ser removida pois outros objetos (views, colunas geradas, etc.) dependem dela. Corrija as dependencias para usar a coluna "%" e tente novamente.', pt_term, t_name, en_term;
                    END;
                ELSE
                    RAISE NOTICE 'AVISO: Tabela "%" tem colunas "%" e "%" com % dados diferentes. A remocao nao e segura e foi ignorada.', t_name, pt_term, en_term, mismatch_count;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '---------------------------------------------------';
    IF dropped_count = 0 THEN
        RAISE NOTICE 'Nenhuma coluna duplicada segura foi encontrada para remover.';
    ELSE
        RAISE NOTICE 'Limpeza concluida. % colunas duplicadas seguras foram removidas.', dropped_count;
    END IF;
    RAISE NOTICE '=== FIM DA LIMPEZA ===';
END $do$;