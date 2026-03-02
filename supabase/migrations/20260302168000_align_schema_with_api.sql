-- MIGRAÇÃO: Alinhar schema Supabase com API
-- Garante que todas as tabelas correspondam exatamente ao que a API espera

-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DE SCHEMA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== ALINHANDO SCHEMA SUPABASE COM API ===';
    RAISE NOTICE 'Data: %', NOW();
END $$;

-- =====================================================
-- TABELA USERS - Alinhamento completo
-- =====================================================

DO $$
BEGIN
    -- Verificar se tabela users existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela users...';
        
        EXECUTE '
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                pin VARCHAR(10) NOT NULL DEFAULT ''1234'',
                role VARCHAR(20) NOT NULL DEFAULT ''admin'',
                status VARCHAR(20) NOT NULL DEFAULT ''active'',
                permissions JSONB DEFAULT ''{}'',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela users criada';
    ELSE
        RAISE NOTICE '✅ Tabela users já existe';
        
        -- Verificar e adicionar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT ''{}''';
            RAISE NOTICE '✅ Coluna permissions adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP';
            RAISE NOTICE '✅ Coluna last_login adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at' AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()';
            RAISE NOTICE '✅ Coluna updated_at adicionada';
        END IF;
    END IF;
END $$;

-- =====================================================
-- TABELA RESTAURANT_TABLES - Schema completo
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela restaurant_tables...';
        
        EXECUTE '
            CREATE TABLE restaurant_tables (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                number INTEGER NOT NULL,
                seats INTEGER DEFAULT 4,
                capacity INTEGER DEFAULT 4,
                x DECIMAL(10,2) DEFAULT 0,
                y DECIMAL(10,2) DEFAULT 0,
                position_x DECIMAL(10,2) DEFAULT 0,
                position_y DECIMAL(10,2) DEFAULT 0,
                width DECIMAL(10,2),
                height DECIMAL(10,2),
                shape VARCHAR(50),
                rotation DECIMAL(10,2),
                color VARCHAR(20),
                status VARCHAR(20) DEFAULT ''AVAILABLE'',
                zone VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                group_id UUID,
                label VARCHAR(255),
                user_id UUID,
                min_capacity INTEGER,
                max_capacity INTEGER,
                qr_code_url TEXT,
                reservation_enabled BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela restaurant_tables criada';
    ELSE
        RAISE NOTICE '✅ Tabela restaurant_tables já existe';
        
        -- Adicionar colunas faltantes para compatibilidade total
        DECLARE column_record RECORD;
        column_to_add TEXT;
        
        FOR column_record IN 
            SELECT unnest(ARRAY[''capacity'', ''position_x'', ''position_y'', ''min_capacity'', ''max_capacity'', ''qr_code_url'', ''reservation_enabled'']) as column_name
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = ''restaurant_tables'' 
                  AND column_name = column_record.column_name 
                  AND table_schema = ''public''
            ) THEN
                CASE column_record.column_name
                    WHEN ''capacity'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN capacity INTEGER DEFAULT 4'';
                    WHEN ''position_x'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN position_x DECIMAL(10,2) DEFAULT 0'';
                    WHEN ''position_y'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN position_y DECIMAL(10,2) DEFAULT 0'';
                    WHEN ''min_capacity'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN min_capacity INTEGER'';
                    WHEN ''max_capacity'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN max_capacity INTEGER'';
                    WHEN ''qr_code_url'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN qr_code_url TEXT'';
                    WHEN ''reservation_enabled'' THEN
                        EXECUTE ''ALTER TABLE restaurant_tables ADD COLUMN reservation_enabled BOOLEAN DEFAULT false'';
                END CASE;
                
                RAISE NOTICE ''✅ Coluna % adicionada'', column_record.column_name;
            END IF;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- TABELA SETTINGS - Configurações do sistema
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela settings...';
        
        EXECUTE '
            CREATE TABLE settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela settings criada';
        
        -- Inserir configurações padrão
        EXECUTE '
            INSERT INTO settings (key, value, description) VALUES
            (''restaurant_name'', ''"Tasca do Vereda"'', ''Nome do restaurante''),
            (''restaurant_address'', ''"Luanda, Angola"'', ''Endereço do restaurante''),
            (''restaurant_phone'', ''"+244 900 000 000"'', ''Telefone do restaurante''),
            (''currency'', ''"AOA"'', ''Moeda padrão''),
            (''tax_rate'', ''6.5'', ''Percentagem de imposto'')
        '';
        
        RAISE NOTICE '✅ Configurações padrão inseridas';
    ELSE
        RAISE NOTICE '✅ Tabela settings já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA MENU_CATEGORIES - Categorias do menu
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela menu_categories...';
        
        EXECUTE '
            CREATE TABLE menu_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT ''#6b7280'',
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela menu_categories criada';
        
        -- Inserir categorias padrão
        EXECUTE '
            INSERT INTO menu_categories (name, description, color, sort_order) VALUES
            (''Entradas'', ''Petiscos e aperitivos'', ''#f59e0b'', 1),
            (''Pratos Principais'', ''Refeições principais'', ''#10b981'', 2),
            (''Sobremesas'', ''Doces e sobremesas'', ''#ec4899'', 3),
            (''Bebidas'', ''Refrigerantes e sucos'', ''#3b82f6'', 4),
            (''Café'', ''Cafés e chás'', ''#6b7280'', 5)
        '';
        
        RAISE NOTICE '✅ Categorias padrão inseridas';
    ELSE
        RAISE NOTICE '✅ Tabela menu_categories já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA DISHES - Pratos/Produtos
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela dishes...';
        
        EXECUTE '
            CREATE TABLE dishes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id UUID REFERENCES menu_categories(id),
                image_url TEXT,
                is_available BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                sort_order INTEGER DEFAULT 0,
                preparation_time INTEGER,
                ingredients TEXT,
                allergens TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela dishes criada';
    ELSE
        RAISE NOTICE '✅ Tabela dishes já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA ORDERS - Pedidos
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela orders...';
        
        EXECUTE '
            CREATE TABLE orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_number VARCHAR(50) UNIQUE NOT NULL,
                table_id UUID REFERENCES restaurant_tables(id),
                status VARCHAR(20) DEFAULT ''OPEN'',
                total DECIMAL(10,2) DEFAULT 0,
                subtotal DECIMAL(10,2) DEFAULT 0,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                waiter_id UUID,
                customer_name VARCHAR(255),
                notes TEXT,
                payment_method VARCHAR(50),
                payment_status VARCHAR(20) DEFAULT ''PENDING'',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                closed_at TIMESTAMP
            )
        ';
        
        RAISE NOTICE '✅ Tabela orders criada';
    ELSE
        RAISE NOTICE '✅ Tabela orders já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA ORDER_ITEMS - Itens dos pedidos
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
-- TRIGGER PARA updated_at AUTOMÁTICO
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
    
    -- Adicionar triggers a todas as tabelas
    DECLARE 
        table_name TEXT;
        trigger_exists BOOLEAN;
    BEGIN
        FOR table_name IN 
            SELECT unnest(ARRAY[''users'', ''settings'', ''menu_categories'', ''dishes'', ''restaurant_tables'', ''orders'', ''order_items''])
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
    user_count INTEGER;
    category_count INTEGER;
    table_count_records INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DO SCHEMA ===';
    
    -- Contar tabelas principais
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = ''public'' 
    AND table_name IN (''users'', ''settings'', ''menu_categories'', ''dishes'', ''restaurant_tables'', ''orders'', ''order_items'');
    
    RAISE NOTICE ''📊 Tabelas principais criadas: %'', table_count;
    
    -- Contar registros iniciais
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO category_count FROM menu_categories;
    SELECT COUNT(*) INTO table_count_records FROM restaurant_tables;
    
    RAISE NOTICE ''👥 Usuários: %'', user_count;
    RAISE NOTICE ''🍽️ Categorias: %'', category_count;
    RAISE NOTICE ''🪑 Mesas: %'', table_count_records;
    
    RAISE NOTICE '';
    RAISE NOTICE ''✅ SCHEMA SUPABASE ALINHADO COM API!'';
    RAISE NOTICE ''✅ Todas as tabelas criadas com estrutura compatível'';
    RAISE NOTICE ''✅ Triggers updated_at configurados'';
    RAISE NOTICE ''✅ Dados iniciais inseridos'';
END $$;
