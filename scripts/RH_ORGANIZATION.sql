-- RH ORGANIZATION - Ligar Tabelas Existentes sem Criar Novas
-- Usa tabelas existentes e estabelece lógica de ligação

-- 1. VERIFICAR TABELAS EXISTENTES DO SISTEMA
SELECT 'TABELAS_EXISTENTES' as section,
       table_name,
       table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%employee%' 
        OR table_name ILIKE '%payroll%'
        OR table_name ILIKE '%escala%'
        OR table_name ILIKE '%user%'
        OR table_name ILIKE '%profile%'
    )
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA EMPLOYEES
SELECT 'EMPLOYEES_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA PAYROLL (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payroll_records' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabela payroll_records encontrada';
        
        SELECT 'PAYROLL_STRUCTURE' as section,
               column_name,
               data_type,
               is_nullable,
               column_default
        FROM information_schema.columns 
        WHERE table_name = 'payroll_records' 
            AND table_schema = 'public'
        ORDER BY ordinal_position;
    ELSE
        RAISE NOTICE '❌ Tabela payroll_records NÃO encontrada';
    END IF;
END $$;

-- 4. VERIFICAR SE EXISTE TABELA DE ESCALAS
DO $$
BEGIN
    -- Procurar possíveis nomes de tabela de escalas
    DECLARE
        escala_table TEXT;
    BEGIN
        SELECT table_name INTO escala_table
        FROM information_schema.tables 
        WHERE table_schema = 'public'
            AND (
                table_name ILIKE '%escala%'
                OR table_name ILIKE '%schedule%'
                OR table_name ILIKE '%shift%'
            )
        LIMIT 1;
        
        IF escala_table IS NOT NULL THEN
            RAISE NOTICE '✅ Tabela de escalas encontrada: %', escala_table;
            
            SELECT 'ESCALA_STRUCTURE' as section,
                   column_name,
                   data_type,
                   is_nullable
            FROM information_schema.columns 
            WHERE table_name = escala_table 
                AND table_schema = 'public'
            ORDER BY ordinal_position;
        ELSE
            RAISE NOTICE '❌ Tabela de escalas NÃO encontrada';
        END IF;
    END;
END $$;

-- 5. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 'USERS_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR LIGAÇÃO ATUAL ENTRE TABELAS
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando ligações atuais entre tabelas...';
    
    -- Verificar se employees tem employee_id (para ligar com payroll)
    DECLARE
        has_employee_id BOOLEAN := FALSE;
        has_payroll_employee_id BOOLEAN := FALSE;
        has_escala_employee_id BOOLEAN := FALSE;
    BEGIN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND column_name = 'id'
            AND table_schema = 'public'
        ) INTO has_employee_id;
        
        -- Verificar se payroll_records tem employee_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payroll_records' 
            AND column_name ILIKE '%employee%'
            AND table_schema = 'public'
        ) INTO has_payroll_employee_id;
        
        -- Verificar se tabela de escalas tem employee_id
        DECLARE
            escala_table TEXT;
        BEGIN
            SELECT table_name INTO escala_table
            FROM information_schema.tables 
            WHERE table_schema = 'public'
                AND (
                    table_name ILIKE '%escala%'
                    OR table_name ILIKE '%schedule%'
                    OR table_name ILIKE '%shift%'
                )
            LIMIT 1;
            
            IF escala_table IS NOT NULL THEN
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = escala_table 
                    AND column_name ILIKE '%employee%'
                    AND table_schema = 'public'
                ) INTO has_escala_employee_id;
            END IF;
        END;
        
        RAISE NOTICE '📊 Status das ligações:';
        RAISE NOTICE '  Employees tem ID: %', has_employee_id;
        RAISE NOTICE '  Payroll tem employee_id: %', has_payroll_employee_id;
        RAISE NOTICE '  Escalas tem employee_id: %', has_escala_employee_id;
        
        -- Mostrar recomendações
        IF NOT has_payroll_employee_id THEN
            RAISE NOTICE '⚠️ RECOMENDAÇÃO: Adicionar employee_id em payroll_records';
        END IF;
        
        IF NOT has_escala_employee_id THEN
            RAISE NOTICE '⚠️ RECOMENDAÇÃO: Adicionar employee_id na tabela de escalas';
        END IF;
    END;
END $$;

-- 7. TESTAR LIGAÇÃO ENTRE EMPLOYEES E PAYROLL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payroll_records' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '🔍 Testando ligação employees ↔ payroll_records...';
        
        -- Contar funcionários na tabela employees
        DECLARE
            employees_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO employees_count FROM employees;
            RAISE NOTICE '  Total funcionários: %', employees_count;
        END;
        
        -- Contar registros de payroll
        DECLARE
            payroll_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO payroll_count FROM payroll_records;
            RAISE NOTICE '  Total registros payroll: %', payroll_count;
        END;
        
        -- Verificar se há employee_id em payroll_records
        DECLARE
            has_employee_link BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'payroll_records' 
                AND column_name ILIKE '%employee%'
                AND table_schema = 'public'
            ) INTO has_employee_link;
            
            IF has_employee_link THEN
                RAISE NOTICE '  ✅ Ligação employees ↔ payroll_records OK';
            ELSE
                RAISE NOTICE '  ❌ Ligação employees ↔ payroll_records FALTANDO';
                RAISE NOTICE '  💡 Solução: Adicionar employee_id em payroll_records';
            END IF;
        END;
    END IF;
END $$;

-- 8. RECOMENDAÇÕES FINAIS
SELECT 'RECOMENDACOES' as section,
       'RH_ORGANIZATION' as action,
       'Usar tabelas existentes' as approach,
       'Ligar employees com payroll_records via employee_id' as recommendation_1,
       'Ligar escalas com employees via employee_id' as recommendation_2,
       'Manter login na tabela users (independente)' as recommendation_3,
       'Não modificar owner/mobile layout' as recommendation_4,
       'Corrigir POS cart visualization bug' as recommendation_5;
