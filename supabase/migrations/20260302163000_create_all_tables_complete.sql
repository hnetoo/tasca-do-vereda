-- Migration completa para criar todas as tabelas necessárias para a Tasca do Vereda
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f create_all_tables.sql

-- =====================================================
-- TABELA DE USUÁRIOS (AUTENTICAÇÃO)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(10) NOT NULL DEFAULT '1234',
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE CATEGORIAS DO MENU
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE PRATOS (DISHES/PRODUCTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE MESAS DO RESTAURANTE
-- =====================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE PEDIDOS (ORDERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ITENS DOS PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES dishes(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE RECEITAS
-- =====================================================
CREATE TABLE IF NOT EXISTS revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'sales',
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE DESPESAS
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE FUNCIONÁRIOS (EMPLOYEES)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    position VARCHAR(100),
    department VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    bank_account VARCHAR(50),
    nif VARCHAR(20),
    hire_date DATE,
    base_salary DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE REGISTROS DE FOLHA DE PAGAMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ITENS DE ESTOQUE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'un',
    min_quantity DECIMAL(10,2) DEFAULT 0,
    max_quantity DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    category VARCHAR(100),
    supplier_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE FORNECEDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Angola',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE REGISTROS DE ATENDIMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    break_duration INTEGER DEFAULT 0, -- minutos
    total_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE TURNOS DE CAIXA
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    start_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    end_amount DECIMAL(10,2),
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_cash DECIMAL(10,2) DEFAULT 0,
    total_card DECIMAL(10,2) DEFAULT 0,
    total_mpesa DECIMAL(10,2) DEFAULT 0,
    difference DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ANALYTICS DIÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_product_cost DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    net_profit DECIMAL(10,2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA DE BACKUPS
-- =====================================================
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP NOT NULL,
    hash VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Pedidos
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Itens dos pedidos
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Pratos
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_is_active ON dishes(is_active);

-- Mesas
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_number ON restaurant_tables(number);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);

-- Financeiro
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Funcionários
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Folha de pagamento
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month ON payroll_records(month);

-- Estoque
CREATE INDEX IF NOT EXISTS idx_stock_items_is_active ON stock_items(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);

-- =====================================================
-- TRIGGERS PARA updated_at AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionar trigger a todas as tabelas que têm updated_at
DO $$
BEGIN
    -- Lista de tabelas que precisam do trigger
    TRUNCATE TABLE trigger_tables;
    CREATE TEMP TABLE trigger_tables (table_name TEXT);
    
    INSERT INTO trigger_tables VALUES 
        ('users'), ('settings'), ('menu_categories'), ('dishes'), 
        ('restaurant_tables'), ('orders'), ('order_items'), 
        ('revenues'), ('expenses'), ('employees'), ('payroll_records'),
        ('stock_items'), ('suppliers'), ('attendance_records'), 
        ('cash_shifts'), ('daily_analytics'), ('backups');
    
    -- Criar triggers
    FOR table_record IN SELECT table_name FROM trigger_tables LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
        ', table_record.table_name, table_record.table_name, 
           table_record.table_name, table_record.table_name);
    END LOOP;
    
    DROP TABLE trigger_tables;
END $$;

-- =====================================================
-- RLS (ROW LEVEL SECURITY) - BÁSICO
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- =====================================================
-- INSERIR DADOS INICIAIS
-- =====================================================

-- Usuários padrão
INSERT INTO users (name, email, pin, role, status, permissions) VALUES
('Administrador', 'admin@tasca.com', '1234', 'ADMIN', 'active', '{"all": true}'),
('Owner', 'owner@tasca.com', '1234', 'OWNER', 'active', '{"owner": true}'),
('Caixa', 'caixa@tasca.com', '1234', 'CAIXA', 'active', '{"pos": true, "orders": true}'),
('Garçom', 'garcom@tasca.com', '1234', 'GARCOM', 'active', '{"orders": true, "tables": true}'),
('Cozinha', 'cozinha@tasca.com', '1234', 'COZINHA', 'active', '{"kitchen": true, "orders": true}')
ON CONFLICT (email) DO NOTHING;

-- Categorias do menu
INSERT INTO menu_categories (name, description, color, sort_order) VALUES
('Entradas', 'Petiscos e aperitivos', '#f59e0b', 1),
('Pratos Principais', 'Refeições principais', '#10b981', 2),
('Sobremesas', 'Doces e sobremesas', '#ec4899', 3),
('Bebidas', 'Refrigerantes e sucos', '#3b82f6', 4),
('Café', 'Cafés e chás', '#6b7280', 5)
ON CONFLICT DO NOTHING;

-- Mesas padrão
INSERT INTO restaurant_tables (number, name, capacity, position_x, position_y) VALUES
('1', 'Mesa 1', 4, 100, 100),
('2', 'Mesa 2', 4, 200, 100),
('3', 'Mesa 3', 2, 300, 100),
('4', 'Mesa 4', 6, 100, 200),
('5', 'Mesa 5', 4, 200, 200),
('6', 'Mesa 6', 2, 300, 200),
('7', 'Mesa 7', 4, 100, 300),
('8', 'Mesa 8', 8, 200, 300)
ON CONFLICT (number) DO NOTHING;

-- Configurações padrão
INSERT INTO settings (key, value, description) VALUES
('restaurant_name', '"Tasca do Vereda"', 'Nome do restaurante'),
('restaurant_address', '"Luanda, Angola"', 'Endereço do restaurante'),
('restaurant_phone', '"+244 900 000 000"', 'Telefone do restaurante'),
('currency', '"AOA"', 'Moeda padrão'),
('tax_rate', '6.5', 'Percentagem de imposto')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DAS TABELAS ===';
    
    -- Contar tabelas criadas
    DECLARE table_count INTEGER;
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'settings', 'menu_categories', 'dishes', 'restaurant_tables',
        'orders', 'order_items', 'revenues', 'expenses', 'employees',
        'payroll_records', 'stock_items', 'suppliers', 'attendance_records',
        'cash_shifts', 'daily_analytics', 'backups'
    );
    
    RAISE NOTICE 'Tabelas criadas: %', table_count;
    
    -- Contar registros iniciais
    DECLARE user_count INTEGER;
    DECLARE category_count INTEGER;
    DECLARE table_count_records INTEGER;
    
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO category_count FROM menu_categories;
    SELECT COUNT(*) INTO table_count_records FROM restaurant_tables;
    
    RAISE NOTICE 'Usuários criados: %', user_count;
    RAISE NOTICE 'Categorias criadas: %', category_count;
    RAISE NOTICE 'Mesas criadas: %', table_count_records;
    
    RAISE NOTICE '=== MIGRAÇÃO COMPLETA COM SUCESSO ===';
END $$;
