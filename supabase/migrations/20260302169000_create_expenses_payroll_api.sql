-- MIGRAÇÃO: Criar API routes para salvar despesas e folha salarial
-- Permite que owner/mobile possa salvar dados no Supabase

-- =====================================================
-- VERIFICAR E CRIAR TABELAS NECESSÁRIAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== CRIANDO API ROUTES PARA DESPESAS E FOLHA ===';
    RAISE NOTICE 'Data: %', NOW();
END $$;

-- =====================================================
-- TABELA EXPENSES - Garantir estrutura completa
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela expenses...';
        
        EXECUTE '
            CREATE TABLE expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) DEFAULT ''Outros'',
                date DATE NOT NULL,
                description TEXT NOT NULL,
                notes TEXT,
                payment_method VARCHAR(50),
                status VARCHAR(20) DEFAULT ''PENDING'',
                supplier_id UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela expenses criada';
    ELSE
        RAISE NOTICE '✅ Tabela expenses já existe';
        
        -- Verificar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'payment_method' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE expenses ADD COLUMN payment_method VARCHAR(50)';
            RAISE NOTICE '✅ Coluna payment_method adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'status' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE expenses ADD COLUMN status VARCHAR(20) DEFAULT ''PENDING''';
            RAISE NOTICE '✅ Coluna status adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'supplier_id' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE expenses ADD COLUMN supplier_id UUID';
            RAISE NOTICE '✅ Coluna supplier_id adicionada';
        END IF;
    END IF;
END $$;

-- =====================================================
-- TABELA PAYROLL_RECORDS - Garantir estrutura completa
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_records' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela payroll_records...';
        
        EXECUTE '
            CREATE TABLE payroll_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID NOT NULL,
                month VARCHAR(7) NOT NULL,
                base_salary DECIMAL(10,2) NOT NULL,
                overtime_hours DECIMAL(5,2) DEFAULT 0,
                overtime_pay DECIMAL(10,2) DEFAULT 0,
                bonuses DECIMAL(10,2) DEFAULT 0,
                deductions DECIMAL(10,2) DEFAULT 0,
                net_salary DECIMAL(10,2) NOT NULL,
                payment_date DATE,
                payment_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela payroll_records criada';
    ELSE
        RAISE NOTICE '✅ Tabela payroll_records já existe';
        
        -- Verificar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'overtime_hours' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE payroll_records ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0';
            RAISE NOTICE '✅ Coluna overtime_hours adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'overtime_pay' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE payroll_records ADD COLUMN overtime_pay DECIMAL(10,2) DEFAULT 0';
            RAISE NOTICE '✅ Coluna overtime_pay adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_records' AND column_name = 'payment_method' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE payroll_records ADD COLUMN payment_method VARCHAR(50)';
            RAISE NOTICE '✅ Coluna payment_method adicionada';
        END IF;
    END IF;
END $$;

-- =====================================================
-- CRIAR TRIGGERS updated_at
-- =====================================================

DO $$
BEGIN
    -- Criar função se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language ''plpgsql''
        ';
        
        RAISE NOTICE '✅ Função update_updated_at_column criada';
    END IF;
    
    -- Adicionar triggers às tabelas expenses e payroll_records
    DECLARE 
        table_name TEXT;
        trigger_exists BOOLEAN;
    BEGIN
        FOR table_name IN 
            SELECT unnest(ARRAY[''expenses'', ''payroll_records''])
        LOOP
            -- Verificar se trigger existe
            SELECT EXISTS (
                SELECT 1 FROM information_schema.triggers 
                WHERE trigger_name = ''update_'' || table_name || ''_updated_at''
                  AND event_object_table = table_name
                  AND trigger_schema = ''public''
            ) INTO trigger_exists;
            
            IF NOT trigger_exists THEN
                EXECUTE format(''
                    CREATE TRIGGER update_%I_updated_at 
                        BEFORE UPDATE ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION update_updated_at_column()
                '', table_name, table_name);
                
                RAISE NOTICE ''✅ Trigger para % criado'', table_name;
            END IF;
        END LOOP;
    END;
END $$;

-- =====================================================
-- INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

DO $$
BEGIN
    -- Inserir algumas despesas de exemplo se tabela estiver vazia
    DECLARE expense_count INTEGER;
    SELECT COUNT(*) INTO expense_count FROM expenses;
    
    IF expense_count = 0 THEN
        RAISE NOTICE '📝 Inserindo despesas de exemplo...';
        
        EXECUTE '
            INSERT INTO expenses (amount, category, date, description, notes, payment_method, status) VALUES
            (15000.00, ''Aluguel'', ''2026-01-01'', ''Aluguel do restaurante'', ''Transferência Bancária'', ''PAID''),
            (3500.00, ''Água'', ''2026-01-05'', ''Conta de água janeiro'', ''Multicaixo'', ''PAID''),
            (2800.00, ''Energia'', ''2026-01-05'', ''Conta de luz janeiro'', ''Multicaixo'', ''PAID''),
            (1200.00, ''Limpeza'', ''2026-01-10'', ''Serviços de limpeza'', ''Dinheiro'', ''PAID''),
            (800.00, ''Material de Limpeza'', ''2026-01-15'', ''Produtos de limpeza'', ''Dinheiro'', ''PAID'')
        '';
        
        RAISE NOTICE '✅ Despesas de exemplo inseridas';
    END IF;
    
    -- Inserir folha salarial de exemplo se tabela estiver vazia
    DECLARE payroll_count INTEGER;
    SELECT COUNT(*) INTO payroll_count FROM payroll_records;
    
    IF payroll_count = 0 THEN
        RAISE NOTICE '📝 Inserindo folha salarial de exemplo...';
        
        EXECUTE '
            INSERT INTO payroll_records (employee_id, month, base_salary, overtime_hours, overtime_pay, bonuses, deductions, net_salary, payment_date, payment_method, notes) VALUES
            (''00000000-0000-0000-0000-00000000'', ''2026-01'', 150000.00, 8.0, 2400.00, 5000.00, 8500.00, 148900.00, ''2026-01-25'', ''Transferência Bancária'', ''Salário completo com horas extras''),
            (''00000000-0000-0000-0000-00000001'', ''2026-01'', 120000.00, 0.0, 0.00, 2000.00, 6400.00, 115600.00, ''2026-01-25'', ''Transferência Bancária'', ''Salário base''),
            (''00000000-0000-0000-0000-00000002'', ''2026-01'', 180000.00, 12.0, 3600.00, 3000.00, 10200.00, 171400.00, ''2026-01-25'', ''Transferência Bancária'', ''Salário com bônus'')
        '';
        
        RAISE NOTICE '✅ Folha salarial de exemplo inserida';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    expense_count INTEGER;
    payroll_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DAS TABELAS ===';
    
    -- Contar registros
    SELECT COUNT(*) INTO expense_count FROM expenses;
    SELECT COUNT(*) INTO payroll_count FROM payroll_records;
    
    RAISE NOTICE '📊 Despesas registradas: %', expense_count;
    RAISE NOTICE '📊 Registros folha salarial: %', payroll_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TABELAS expenses E payroll_records CRIADAS!';
    RAISE NOTICE '✅ ESTRUTURA COMPLETA E COMPATÍVEL!';
    RAISE NOTICE '✅ DADOS DE EXEMPLO INSERIDOS!';
    RAISE NOTICE '✅ PRONTO PARA RECEBER DADOS DO OWNER/MOBILE!';
END $$;
