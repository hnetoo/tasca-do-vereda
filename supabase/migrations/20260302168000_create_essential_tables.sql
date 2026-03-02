-- MIGRAÇÃO: Criar tabelas essenciais para API
-- Versão simplificada sem erros de sintaxe

-- =====================================================
-- TABELA MENU_CATEGORIES - Categorias do menu
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_categories' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela menu_categories...';
        
        CREATE TABLE menu_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(20) DEFAULT '#6b7280',
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela menu_categories criada';
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
        
        CREATE TABLE dishes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            category_id UUID REFERENCES menu_categories(id),
            image_url TEXT,
            is_available BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela dishes criada';
    ELSE
        RAISE NOTICE '✅ Tabela dishes já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA CUSTOMERS - Clientes
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela customers...';
        
        CREATE TABLE customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            email VARCHAR(255),
            address TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela customers criada';
    ELSE
        RAISE NOTICE '✅ Tabela customers já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA RESERVATIONS - Reservas
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela reservations...';
        
        CREATE TABLE reservations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID REFERENCES customers(id),
            table_id UUID,
            date DATE NOT NULL,
            time TIME NOT NULL,
            party_size INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDING',
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela reservations criada';
    ELSE
        RAISE NOTICE '✅ Tabela reservations já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA RESTAURANT_TABLES - Mesas
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_tables' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela restaurant_tables...';
        
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
            status VARCHAR(20) DEFAULT 'AVAILABLE',
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
        );
        
        RAISE NOTICE '✅ Tabela restaurant_tables criada';
    ELSE
        RAISE NOTICE '✅ Tabela restaurant_tables já existe';
    END IF;
END $$;

-- =====================================================
-- TABELA ORDERS - Pedidos
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela orders...';
        
        CREATE TABLE orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_number VARCHAR(50) UNIQUE NOT NULL,
            table_id UUID REFERENCES restaurant_tables(id),
            status VARCHAR(20) DEFAULT 'OPEN',
            total DECIMAL(10,2) DEFAULT 0,
            subtotal DECIMAL(10,2) DEFAULT 0,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            discount_amount DECIMAL(10,2) DEFAULT 0,
            waiter_id UUID,
            customer_name VARCHAR(255),
            notes TEXT,
            payment_method VARCHAR(50),
            payment_status VARCHAR(20) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            closed_at TIMESTAMP
        );
        
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
        
        CREATE TABLE order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES orders(id),
            dish_id UUID REFERENCES dishes(id),
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Tabela order_items criada';
    ELSE
        RAISE NOTICE '✅ Tabela order_items já existe';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DAS TABELAS ===';
    
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('menu_categories', 'dishes', 'customers', 'reservations', 'restaurant_tables', 'orders', 'order_items');
    
    RAISE NOTICE '📊 Tabelas criadas: %', table_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TABELAS ESSENCIAIS CRIADAS COM SUCESSO!';
END $$;
