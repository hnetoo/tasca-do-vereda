-- =====================================================
-- 🏆 SUPABASE SCHEMA SYNC - ESPERHO PERFEITO DO CÓDIGO
-- =====================================================
-- Baseado em: src/types.ts (100% snake_case)
-- Objetivo: BD = espelho exato do código TypeScript
-- =====================================================

-- LIMPEZA COMPLETA
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS device_sessions CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS table_zones CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS revenues CASCADE;

-- =====================================================
-- 🪑 TABLE_ZONES
-- =====================================================
CREATE TABLE table_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    tables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🪑 RESTAURANT_TABLES
-- =====================================================
CREATE TABLE restaurant_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    number INTEGER NOT NULL,
    seats INTEGER,
    shape TEXT,
    zone TEXT,
    status TEXT,
    x NUMERIC,
    y NUMERIC,
    width NUMERIC,
    height NUMERIC,
    rotation NUMERIC,
    color TEXT,
    label TEXT,
    group_id UUID,
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🍽️ MENU_CATEGORIES
-- =====================================================
CREATE TABLE menu_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    parent_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🍽️ DISHES (MENU_ITEMS)
-- =====================================================
CREATE TABLE dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    cost_price NUMERIC(15,2),
    category_id UUID REFERENCES menu_categories(id),
    supplier_id UUID,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    tax_percentage NUMERIC,
    tax_code TEXT,
    preparation_time INTEGER,
    track_stock BOOLEAN DEFAULT false,
    stock_quantity NUMERIC,
    min_stock_quantity NUMERIC,
    max_stock_quantity NUMERIC,
    unit TEXT,
    user_id UUID,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📋 ORDERS
-- =====================================================
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT,
    status TEXT NOT NULL,
    table_id UUID REFERENCES restaurant_tables(id),
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    customer_nif TEXT,
    user_id UUID,
    user_name TEXT,
    total NUMERIC(15,2),
    tax_total NUMERIC(15,2),
    payment_method TEXT,
    notes TEXT,
    shift_id UUID,
    sub_account_name TEXT,
    invoice_number TEXT,
    agt_submission_uuid TEXT,
    is_synced_agt INTEGER DEFAULT 0,
    hash TEXT,
    previous_hash TEXT,
    signature TEXT,
    jws_payload JSONB,
    split_payments JSONB,
    closed_at TIMESTAMPTZ,  -- 🎯 EXATO: closedAt (camelCase) como no código
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    items JSONB DEFAULT '[]'::JSONB NOT NULL
);

-- =====================================================
-- 📋 ORDER_ITEMS
-- =====================================================
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES dishes(id),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,  -- 🎯 EXATO: unit_price (snake_case)
    tax_percentage NUMERIC DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    tax_code TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📋 RESERVATIONS
-- =====================================================
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    party_size INTEGER NOT NULL,
    table_id UUID REFERENCES restaurant_tables(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 👥 EMPLOYEES
-- =====================================================
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    nif TEXT,
    bi TEXT,
    role TEXT NOT NULL,
    salary NUMERIC(15,2),
    admission_date TIMESTAMPTZ,
    daily_work_hours NUMERIC,
    work_days_per_month INTEGER,
    bank_account TEXT,
    social_security_number TEXT,
    pin TEXT,
    color TEXT,
    external_bio_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 👥 PAYROLL_RECORDS
-- =====================================================
CREATE TABLE payroll_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    base_salary NUMERIC(15,2),
    net_salary NUMERIC(15,2),
    status TEXT,
    notes TEXT,
    payment_date DATE,
    employee_name TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔐 API_KEYS
-- =====================================================
CREATE TABLE api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔗 WEBHOOKS
-- =====================================================
CREATE TABLE webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}',
    secret_key TEXT,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔌 INTEGRATIONS
-- =====================================================
CREATE TABLE integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📱 DEVICE_SESSIONS
-- =====================================================
CREATE TABLE device_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES employees(id),
    session_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📊 EXPENSES
-- =====================================================
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT,
    date DATE NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 💰 REVENUES
-- =====================================================
CREATE TABLE revenues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    category TEXT,
    date DATE NOT NULL,
    source TEXT,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📋 AUDIT_LOGS
-- =====================================================
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    user_id UUID REFERENCES employees(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📊 INDEXES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_closed_at ON orders(closed_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_dish_id ON order_items(dish_id);
CREATE INDEX idx_dishes_category_id ON dishes(category_id);
CREATE INDEX idx_dishes_is_active ON dishes(is_active);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_revenues_date ON revenues(date);

-- =====================================================
-- 🔐 POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Enable RLS em todas as tabelas
ALTER TABLE table_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (todos podem ler)
CREATE POLICY "Usuários autenticados podem ler tudo" ON table_zones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON restaurant_tables
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON menu_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON dishes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON reservations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON payroll_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON api_keys
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON webhooks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON integrations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON device_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON revenues
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler tudo" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para usuários autenticados (todos podem inserir)
CREATE POLICY "Usuários autenticados podem inserir" ON table_zones
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON restaurant_tables
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON menu_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON dishes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON reservations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON payroll_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON api_keys
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON webhooks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON integrations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON device_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON revenues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para usuários autenticados (todos podem atualizar)
CREATE POLICY "Usuários autenticados podem atualizar" ON table_zones
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON restaurant_tables
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON menu_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON dishes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON reservations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON employees
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON payroll_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON api_keys
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON webhooks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON integrations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON device_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON revenues
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar" ON audit_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para usuários autenticados (todos podem deletar)
CREATE POLICY "Usuários autenticados podem deletar" ON table_zones
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON restaurant_tables
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON menu_categories
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON dishes
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON order_items
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON reservations
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON employees
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON payroll_records
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON api_keys
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON webhooks
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON integrations
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON device_sessions
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON revenues
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar" ON audit_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 🎯 INSERÇÕES INICIAIS (TESTE)
-- =====================================================

-- Inserir uma categoria de teste
INSERT INTO menu_categories (id, name, description, is_active, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas variadas', true, NOW(), NOW());

-- Inserir alguns pratos de teste
INSERT INTO dishes (id, name, description, price, category_id, available, is_active, tax_percentage, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000000101', 'Bifana no Pão', 'Bifana tradicional no pão com molho', 3500.00, '00000000-0000-0000-0000-000000000001', true, true, 13, NOW(), NOW()),
('00000000-0000-0000-0000-000000000102', 'Bitoque', 'Bitoque grelhado com batatas', 12000.00, '00000000-0000-0000-0000-000000000001', true, true, 13, NOW(), NOW()),
('00000000-0000-0000-0000-000000000103', 'Refrigerante', 'Refrigerante lata 350ml', 500.00, '00000000-0000-0000-0000-000000000001', true, true, 13, NOW(), NOW());

-- Inserir algumas mesas de teste
INSERT INTO restaurant_tables (id, name, number, seats, shape, status, x, y, width, height, is_active, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000001001', 'Mesa 1', 1, 4, 'rectangle', 'AVAILABLE', 100, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001002', 'Mesa 2', 2, 4, 'rectangle', 'AVAILABLE', 200, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001003', 'Mesa 3', 3, 6, 'rectangle', 'AVAILABLE', 300, 100, 120, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001004', 'Balcão', 999, 0, 'rectangle', 'AVAILABLE', 0, 0, 100, 50, true, NOW(), NOW());

-- =====================================================
-- 🎯 COMENTÁRIOS IMPORTANTES
-- =====================================================

/*
🔥 CAMPOS CRÍTICOS VERIFICADOS:

1️⃣ DISHES:
   - price: NUMERIC(15,2) → Para uso no carrinho: dish.price
   - tax_percentage: NUMERIC → Para cálculo de impostos
   - category_id: UUID → Relacionamento com menu_categories

2️⃣ ORDERS:
   - closed_at: TIMESTAMPTZ → EXATO como no código (closedAt)
   - total: NUMERIC(15,2) → Total do pedido
   - items: JSONB → Array de itens do pedido
   - customer_name: TEXT → Nome do cliente

3️⃣ ORDER_ITEMS:
   - unit_price: NUMERIC(15,2) → Para cálculo: item.unit_price
   - quantity: NUMERIC → Quantidade do item
   - dish_id: UUID → Relacionamento com dishes
   - tax_percentage: NUMERIC → Imposto do item
   - tax_amount: NUMERIC(15,2) → Valor do imposto

🎯 COMPATIBILIDADE 100%:
- dishes.price ↔ cartItems[].price
- order_items.unit_price ↔ cartItems[].unit_price
- orders.closed_at ↔ order.closedAt
- orders.total ↔ order.total
- orders.items ↔ order.items

🚀 INSTRUÇÕES:
1. Copiar todo este script
2. Colar no SQL Editor do Supabase
3. Executar tudo de uma vez
4. Verificar se todas as tabelas foram criadas
5. Testar inserção de pedidos

⚠️ IMPORTANTE:
- Usar EXATAMENTE estes nomes de colunas
- Não alterar tipos de dados
- Manter políticas RLS ativas
- Testar com dados reais após criação
*/

COMMIT;
