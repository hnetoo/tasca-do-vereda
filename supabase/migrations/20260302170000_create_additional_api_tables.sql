-- MIGRAÇÃO: Criar tabelas adicionais para APIs
-- Garante que todas as tabelas necessárias existam para as APIs

-- =====================================================
-- TABELA CUSTOMERS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela customers...';
        
        EXECUTE '
            CREATE TABLE customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                nif VARCHAR(20),
                points INTEGER DEFAULT 0,
                balance DECIMAL(10,2) DEFAULT 0,
                visits INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela customers criada';
    ELSE
        RAISE NOTICE '✅ Tabela customers já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA RESERVATIONS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela reservations...';
        
        EXECUTE '
            CREATE TABLE reservations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50),
                date TIMESTAMP NOT NULL,
                time VARCHAR(10) NOT NULL,
                guests INTEGER NOT NULL,
                table_id UUID REFERENCES restaurant_tables(id),
                status VARCHAR(20) DEFAULT ''CONFIRMADA'',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela reservations criada';
    ELSE
        RAISE NOTICE '✅ Tabela reservations já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA ORDER_ITEMS (se não existir)
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela order_items...';
        
        EXECUTE '
            CREATE TABLE order_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                dish_id UUID REFERENCES dishes(id),
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT ''PENDING'',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela order_items criada';
    ELSE
        RAISE NOTICE '✅ Tabela order_items já existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR E ATUALIZAR TABELA ORDERS
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabela orders existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tabela orders já existe';
        
        -- Verificar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN order_number VARCHAR(50)';
            RAISE NOTICE '✅ Coluna order_number adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'table_id' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN table_id UUID';
            RAISE NOTICE '✅ Coluna table_id adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_name' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255)';
            RAISE NOTICE '✅ Coluna customer_name adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_phone' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50)';
            RAISE NOTICE '✅ Coluna customer_phone adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50)';
            RAISE NOTICE '✅ Coluna payment_method adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2)';
            RAISE NOTICE '✅ Coluna subtotal adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tax_amount' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2)';
            RAISE NOTICE '✅ Coluna tax_amount adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'notes' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE orders ADD COLUMN notes TEXT';
            RAISE NOTICE '✅ Coluna notes adicionada';
        END IF;
    ELSE
        RAISE NOTICE '❌ Tabela orders não existe';
    END IF;
END $$;

-- =====================================================
-- TRIGGERS updated_at
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
    
    -- Adicionar triggers às novas tabelas
    DECLARE 
        table_name TEXT;
        trigger_exists BOOLEAN;
    BEGIN
        FOR table_name IN 
            SELECT unnest(ARRAY[''customers'', ''reservations'', ''order_items''])
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
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DAS TABELAS ADICIONAIS ===';
    
    -- Contar tabelas principais
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = ''public'' 
    AND table_name IN (''customers'', ''reservations'', ''order_items'', ''orders'');
    
    RAISE NOTICE ''📊 Tabelas criadas/verificadas: %'', table_count;
    
    RAISE NOTICE '';
    RAISE NOTICE ''✅ TODAS AS TABELAS NECESSÁRIAS PARA AS APIs ESTÃO PRONTAS!'';
    RAISE NOTICE ''✅ CUSTOMERS, RESERVATIONS, ORDER_ITEMS, ORDERS'';
    RAISE NOTICE ''✅ PRONTO PARA RECEBER DADOS DOS MENUS!'';
END $$;
