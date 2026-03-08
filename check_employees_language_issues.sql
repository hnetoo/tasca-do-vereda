-- DIAGNÓSTICO DE COLUNAS DE FUNCIONÁRIOS (PORTUGUÊS vs INGLÊS)
-- Verifica as tabelas 'employees' e 'staff' para identificar inconsistências

-- 1. Listar estrutura atual das tabelas de funcionários
SELECT 
    table_name,
    ordinal_position, 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('employees', 'staff')
ORDER BY table_name, ordinal_position;

-- 2. Verificação automática de pares comuns (PT -> EN)
DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Verificar para ambas as tabelas possíveis
    FOR t_name IN SELECT unnest(ARRAY['employees', 'staff']) LOOP
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name) THEN
            RAISE NOTICE '=== ANALISANDO TABELA: % ===', t_name;

            -- Verificar Nome vs Name
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'nome') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'name') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "nome" (PT) mas falta "name" (EN).', t_name;
                ELSE
                    RAISE NOTICE 'ℹ️ Info em %: Existem ambas "nome" e "name".', t_name;
                END IF;
            END IF;

            -- Verificar Telefone vs Phone
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'telefone') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'phone') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "telefone" (PT) mas falta "phone" (EN).', t_name;
                END IF;
            END IF;

            -- Verificar Cargo vs Role
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name IN ('cargo', 'funcao')) THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'role') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna de cargo em PT mas falta "role" (EN).', t_name;
                END IF;
            END IF;

            -- Verificar Ativo vs Is_Active
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'ativo') THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'is_active') THEN
                    RAISE NOTICE '⚠️ PERIGO em %: Existe coluna "ativo" (PT) mas falta "is_active" (EN).', t_name;
                END IF;
            END IF;
            
        ELSE
            RAISE NOTICE 'ℹ️ Tabela % não existe neste banco de dados.', t_name;
        END IF;
        
    END LOOP;

    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;