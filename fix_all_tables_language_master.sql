-- CORREÇÃO MESTRE DE IDIOMA (GLOBAL)
-- Este script percorre TODAS as tabelas do banco de dados e normaliza
-- nomes de colunas de Português para Inglês automaticamente.

DO $$
DECLARE
    r RECORD;
    pt_term TEXT;
    en_term TEXT;
    -- Lista Mestre de Traduções [Português, Inglês]
    pairs TEXT[][] := ARRAY[
        ['nome', 'name'],
        ['preco', 'price'],
        ['descricao', 'description'],
        ['telefone', 'phone'],
        ['telemovel', 'phone'],
        ['endereco', 'address'],
        ['morada', 'address'],
        ['estado', 'status'],
        ['situacao', 'status'],
        ['imagem', 'image_url'],
        ['foto', 'image_url'],
        ['categoria_id', 'category_id'],
        ['disponivel', 'available'],
        ['ativo', 'is_active'],
        ['salario', 'salary'],
        ['vencimento', 'salary'],
        ['salario_base', 'base_salary'],
        ['cargo', 'role'],
        ['funcao', 'role'],
        ['data', 'date'],
        ['criado_em', 'created_at'],
        ['atualizado_em', 'updated_at'],
        ['usuario_id', 'user_id'],
        ['cliente_id', 'customer_id'],
        ['mesa_id', 'table_id'],
        ['quantidade', 'quantity'],
        ['total_liquido', 'net_total'],
        ['observacoes', 'notes'],
        ['notas', 'notes'],
        ['tipo', 'type'],
        ['subsidios', 'subsidies'],
        ['descontos', 'deductions'],
        ['imposto', 'tax'],
        ['iva', 'tax'],
        ['nif', 'tax_id']
    ];
    pair TEXT[];
    t_name TEXT;
    col_exists BOOLEAN;
    target_exists BOOLEAN;
    ops_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== 🛠️ INICIANDO CORREÇÃO MESTRE DE IDIOMA (PT -> EN) ===';

    -- Loop em todas as tabelas do schema public
    FOR r IN 
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

            -- Verificar se a coluna em Português existe nesta tabela
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = t_name AND column_name = pt_term
            ) INTO col_exists;

            IF col_exists THEN
                -- Verificar se a coluna destino em Inglês JÁ existe
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = t_name AND column_name = en_term
                ) INTO target_exists;

                IF target_exists THEN
                    -- CASO 1: Ambas existem. Copiar dados (Merge) para não perder nada
                    RAISE NOTICE '🔄 Tabela %: Mesclando dados de "%" para "%"...', t_name, pt_term, en_term;
                    -- Copia apenas se o destino estiver nulo ou vazio
                    EXECUTE format('UPDATE %I SET %I = %I WHERE %I IS NULL', t_name, en_term, pt_term, en_term);
                    ops_count := ops_count + 1;
                ELSE
                    -- CASO 2: Apenas PT existe. Renomear a coluna.
                    RAISE NOTICE '✏️ Tabela %: Renomeando coluna "%" para "%"...', t_name, pt_term, en_term;
                    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', t_name, pt_term, en_term);
                    ops_count := ops_count + 1;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '=== ✅ CONCLUÍDO. % operações realizadas. ===', ops_count;
END $$;