-- =============================================
-- MIGRATION SUPABASE CLI - SISTEMA RESTAURANTE
-- Execute: supabase db push
-- =============================================

-- Versão da migration
-- version: '20240303000001_create_restaurant_schema'

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- 1. Funcionários (employees)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    nif VARCHAR(50),
    bi VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    salary DECIMAL(10,2),
    admission_date DATE,
    daily_work_hours DECIMAL(4,2),
    work_days_per_month INTEGER,
    bank_account VARCHAR(255),
    social_security_number VARCHAR(100),
    pin VARCHAR(20),
    color VARCHAR(20),
    external_bio_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cargos/Funções (roles)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mesas de Restaurante (restaurant_tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    number INTEGER NOT NULL,
    seats INTEGER,
    shape VARCHAR(50), -- 'ROUND', 'SQUARE', 'RECTANGLE'
    zone VARCHAR(50), -- 'INTERIOR', 'EXTERIOR', 'BALCAO'
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    x DECIMAL(10,2),
    y DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    rotation DECIMAL(5,2),
    color VARCHAR(20),
    label VARCHAR(100),
    group_id UUID,
    user_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Categorias do Menu (menu_categories)
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    icon VARCHAR(100),
    parent_id UUID REFERENCES menu_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Fornecedores (suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    nif VARCHAR(50),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Pratos/Produtos (dishes)
CREATE TABLE IF NOT EXISTS dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    category_id UUID REFERENCES menu_categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    tax_percentage DECIMAL(5,4) DEFAULT 0.065,
    tax_code VARCHAR(20) DEFAULT 'NOR',
    preparation_time INTEGER, -- minutos
    track_stock BOOLEAN DEFAULT false,
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    min_stock_quantity DECIMAL(10,2) DEFAULT 5,
    max_stock_quantity DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT 'un',
    user_id UUID REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Clientes (customers)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    nif VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'PAID', 'CANCELLED'
    table_id UUID REFERENCES restaurant_tables(id),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_nif VARCHAR(50),
    user_id UUID REFERENCES employees(id),
    user_name VARCHAR(255),
    total DECIMAL(10,2),
    tax_total DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    shift_id UUID,
    sub_account_name VARCHAR(100),
    invoice_number VARCHAR(100),
    agt_submission_uuid UUID,
    is_synced_agt INTEGER DEFAULT 0,
    hash VARCHAR(255),
    previous_hash VARCHAR(255),
    signature TEXT,
    jws_payload JSONB,
    split_payments JSONB,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Itens dos Pedidos (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES dishes(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_percentage DECIMAL(5,4) DEFAULT 0.065,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tax_code VARCHAR(20) DEFAULT 'NOR',
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Despesas (expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Outros',
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Folha Salarial (payroll) - VERSÃO CORRIGIDA
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    month VARCHAR(20) NOT NULL, -- '2024-01'
    base_salary DECIMAL(10,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Reservas (reservations)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER NOT NULL,
    table_id UUID REFERENCES restaurant_tables(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Turnos de Caixa (cash_shifts)
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES employees(id),
    user_name VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    closing_balance DECIMAL(10,2),
    expected_balance DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Entregas (deliveries)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    address TEXT,
    driver_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Receitas (revenues)
CREATE TABLE IF NOT EXISTS revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    payment_method VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Transações (transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'REVENUE', 'EXPENSE'
    category VARCHAR(100),
    description TEXT,
    payment_method VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Controlo de Stock (stock_items)
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'un',
    min_threshold DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Registos de Presença (attendance_records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_method VARCHAR(50),
    clock_out_method VARCHAR(50),
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    is_late BOOLEAN DEFAULT false,
    late_minutes INTEGER,
    is_absence BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Análise Diária (daily_analytics)
CREATE TABLE IF NOT EXISTS daily_analytics (
    date DATE PRIMARY KEY,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_product_cost DECIMAL(10,2) DEFAULT 0,
    net_profit DECIMAL(10,2) DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Registos de Auditoria (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES employees(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Configurações (settings)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    nif VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'AOA',
    tax_percentage DECIMAL(5,4) DEFAULT 0.065,
    language VARCHAR(10) DEFAULT 'pt',
    timezone VARCHAR(50) DEFAULT 'Africa/Luanda',
    logo_url TEXT,
    app_logo_url TEXT,
    qr_code_title VARCHAR(255),
    qr_code_subtitle TEXT,
    qr_code_short_code VARCHAR(50),
    qr_menu_url TEXT,
    qr_menu_cloud_url TEXT,
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    admin_pin VARCHAR(20),
    open_drawer_code VARCHAR(20),
    api_token TEXT,
    agt_certificate TEXT,
    printer_config JSONB,
    backup_config JSONB,
    supabase_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MELHORAR PERFORMANCE
-- =============================================

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Índices para itens dos pedidos
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON order_items(dish_id);

-- Índices para despesas
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Índices para folha salarial
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);

-- Índices para funcionários
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Índices para mesas
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone ON restaurant_tables(zone);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);

-- Índices para pratos
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_is_active ON dishes(is_active);

-- Índices para reservas
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- =============================================
-- TRIGGERS E FUNÇÕES
-- =============================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
-- Exemplo: Permitir leitura para todos os usuários autenticados
CREATE POLICY "Enable read access for all authenticated users" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON payroll FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON dishes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON menu_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON restaurant_tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all authenticated users" ON settings FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- FUNÇÕES ÚTEIS
-- =============================================

-- Função para calcular custo diário de produtos
CREATE OR REPLACE FUNCTION calculate_daily_product_cost(target_date DATE)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_cost DECIMAL(10,2) := 0;
BEGIN
    -- Calcular custo baseado nos itens vendidos no dia
    SELECT COALESCE(SUM(oi.quantity * d.cost_price), 0) INTO total_cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
    WHERE DATE(o.created_at) = target_date;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View para analytics diários
CREATE OR REPLACE VIEW daily_analytics_view AS
SELECT 
    DATE(o.created_at) as date,
    COUNT(*) as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(calculate_daily_product_cost(DATE(o.created_at)), 0) as total_product_cost,
    COALESCE(SUM(o.total), 0) - COALESCE(SUM(e.amount), 0) - COALESCE(calculate_daily_product_cost(DATE(o.created_at)), 0) as net_profit,
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(o.total), 0) / COUNT(*) ELSE 0 END as average_ticket
FROM orders o
LEFT JOIN expenses e ON DATE(o.created_at) = e.date
WHERE o.status IN ('CLOSED', 'PAID')
GROUP BY DATE(o.created_at)
ORDER BY DATE(o.created_at) DESC;

-- =============================================
-- DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Inserir configurações básicas
INSERT INTO settings (id, restaurant_name, currency, tax_percentage, language, timezone) 
VALUES (gen_random_uuid(), 'Tasca do Vereda', 'AOA', 0.065, 'pt', 'Africa/Luanda')
ON CONFLICT (id) DO NOTHING;

-- Inserir categorias básicas
INSERT INTO menu_categories (id, name, sort_order, is_active) VALUES
(gen_random_uuid(), 'Entradas', 1, true),
(gen_random_uuid(), 'Pratos Principais', 2, true),
(gen_random_uuid(), 'Sobremesas', 3, true),
(gen_random_uuid(), 'Bebidas', 4, true),
(gen_random_uuid(), 'Café', 5, true)
ON CONFLICT DO NOTHING;

-- Inserir mesas básicas
INSERT INTO restaurant_tables (id, name, number, seats, shape, zone, status) VALUES
(gen_random_uuid(), 'Mesa 1', 1, 4, 'ROUND', 'INTERIOR', 'AVAILABLE'),
(gen_random_uuid(), 'Mesa 2', 2, 4, 'ROUND', 'INTERIOR', 'AVAILABLE'),
(gen_random_uuid(), 'Mesa 3', 3, 2, 'SQUARE', 'BALCAO', 'AVAILABLE'),
(gen_random_uuid(), 'Mesa 4', 4, 6, 'RECTANGLE', 'EXTERIOR', 'AVAILABLE'),
(gen_random_uuid(), 'Mesa 5', 5, 4, 'ROUND', 'EXTERIOR', 'AVAILABLE')
ON CONFLICT DO NOTHING;
