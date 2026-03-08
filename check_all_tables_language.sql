-- DIAGNÓSTICO GLOBAL DE IDIOMA (TODAS AS TABELAS)
-- Este script verifica todas as tabelas do banco de dados em busca de colunas
-- com nomes comuns em português e verifica se a contraparte em inglês existe.

DO $$
DECLARE
    r RECORD;
    pt_term TEXT;
    en_term TEXT;
    -- Lista de pares [Português, Inglês] para verificar
    -- Adicione mais pares aqui conforme necessário
    pairs TEXT[][] := ARRAY[
        ['nome', 'name'],
        ['preco', 'price'],
        ['descricao', 'description'],
        ['telefone', 'phone'],
        ['endereco', 'address'],
        ['estado', 'status'],
        ['situacao', 'status'],
        ['imagem', 'image_url'],
        ['foto', 'image_url'],
        ['categoria_id', 'category_id'],
        ['disponivel', 'available'],
        ['ativo', 'is_active'],
        ['salario', 'salary'],
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
        ['tipo', 'type']
    ];
    pair TEXT[];
    found_issues BOOLEAN := FALSE;
    issue_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== 🔍 INICIANDO VARREDURA GLOBAL DE IDIOMA (PT -> EN) ===';

    -- Loop através de todas as tabelas base no esquema public
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        -- Para cada tabela, verificar contra a lista de termos proibidos
        FOREACH pair SLICE 1 IN ARRAY pairs LOOP
            pt_term := pair[1];
            en_term := pair[2];

            -- Verificar se a coluna em PT existe
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = pt_term) THEN
                found_issues := TRUE;
                issue_count := issue_count + 1;
                
                -- Verificar se a coluna em EN TAMBÉM existe (o que indica duplicação ou migração incompleta)
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.table_name AND column_name = en_term) THEN
                    RAISE NOTICE '⚠️  TABELA "%": Conflito! Existem "%" (PT) e "%" (EN). Verificar sincronia de dados.', r.table_name, pt_term, en_term;
                ELSE
                    RAISE NOTICE '🔴 TABELA "%": Encontrado "%" (PT). Sugestão: Renomear para "%" (EN).', r.table_name, pt_term, en_term;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '---------------------------------------------------';
    IF NOT found_issues THEN
        RAISE NOTICE '✅ Nenhuma coluna comum em português foi encontrada. O schema parece limpo!';
    ELSE
        RAISE NOTICE '❌ Diagnóstico concluído. Encontrados % problemas potenciais.', issue_count;
    END IF;
    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;