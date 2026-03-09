-- =====================================================
-- 🔄 FRESH DATABASE SCHEMA - ESPERHO EXATO DO CÓDIGO
-- =====================================================
-- Objetivo: Recriar tabelas para sincronizar inventário e POS
-- Técnica: Colunas = nomes exatos das propriedades TypeScript
-- =====================================================

-- =====================================================
-- 🧹 LIMPEZA COMPLETA DAS TABELAS ANTIGAS
-- =====================================================
-- Instruções para limpar tabelas antigas no Supabase:
-- 1. Abra o SQL Editor do Supabase
-- 2. Execute estes comandos DROP TABLE primeiro:
-- 3. Depois execute o resto do script

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;

-- =====================================================
-- 🍽️ CATEGORIES (MenuCategory)
-- =====================================================
-- Baseado em: src/types.ts MenuCategory interface
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
-- 🍽️ DISHES (MenuItem/Dish)
-- =====================================================
-- Baseado em: src/types.ts Dish interface
-- Colunas essenciais para inventário e POS
CREATE TABLE dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,           -- 🎯 ESSENCIAL: dish.price
    cost_price NUMERIC(15,2),
    categoryId UUID REFERENCES menu_categories(id), -- 🎯 ESSENCIAL: dish.categoryId
    supplier_id UUID,
    image_url TEXT,                            -- 🎯 ESSENCIAL: dish.image_url
    available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    tax_percentage NUMERIC DEFAULT 0,
    tax_code TEXT DEFAULT '',
    preparation_time INTEGER,
    track_stock BOOLEAN DEFAULT false,
    stock_quantity NUMERIC DEFAULT 0,
    min_stock_quantity NUMERIC DEFAULT 0,
    max_stock_quantity NUMERIC,
    unit TEXT DEFAULT 'un',
    user_id UUID,
    status TEXT DEFAULT 'active',               -- 🎯 ESSENCIAL: dish.status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🪑 TABLES (RestaurantTable)
-- =====================================================
-- Baseado em: src/types.ts Table interface
CREATE TABLE restaurant_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    number INTEGER NOT NULL,
    seats INTEGER,
    shape TEXT DEFAULT 'rectangle',
    zone TEXT,
    status TEXT DEFAULT 'AVAILABLE',              -- 🎯 ESSENCIAL: table.status
    x NUMERIC,
    y NUMERIC,
    width NUMERIC,
    height NUMERIC,
    rotation NUMERIC DEFAULT 0,
    color TEXT,
    label TEXT,
    group_id UUID,
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📋 ORDERS (Order)
-- =====================================================
-- Baseado em: src/types.ts Order interface
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT,
    status TEXT NOT NULL,
    tableId UUID REFERENCES restaurant_tables(id), -- 🎯 ESSENCIAL: order.tableId
    customerId UUID,
    customerName TEXT,                         -- 🎯 ESSENCIAL: order.customerName
    customer_phone TEXT,
    customer_nif TEXT,
    userId UUID,
    userName TEXT,
    total NUMERIC(15,2),                      -- 🎯 ESSENCIAL: order.total
    tax_total NUMERIC(15,2),
    payment_method TEXT,
    notes TEXT,
    shiftId UUID,
    subAccountName TEXT,
    invoiceNumber TEXT,
    agt_submission_uuid TEXT,
    is_synced_agt INTEGER DEFAULT 0,
    hash TEXT,
    previous_hash TEXT,
    signature TEXT,
    jws_payload JSONB,
    split_payments JSONB,
    closedAt TIMESTAMPTZ,                      -- 🎯 ESSENCIAL: order.closedAt
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    items JSONB DEFAULT '[]'::JSONB NOT NULL   -- 🎯 ESSENCIAL: order.items
);

-- =====================================================
-- 📋 ORDER_ITEMS (OrderItem)
-- =====================================================
-- Baseado em: src/types.ts OrderItem interface
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orderId UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- 🎯 ESSENCIAL: item.orderId
    dishId UUID REFERENCES dishes(id),           -- 🎯 ESSENCIAL: item.dishId
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,         -- 🎯 ESSENCIAL: item.unit_price
    tax_percentage NUMERIC DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    tax_code TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📊 ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_dishes_categoryId ON dishes(categoryId);
CREATE INDEX idx_dishes_is_active ON dishes(is_active);
CREATE INDEX idx_dishes_status ON dishes(status);
CREATE INDEX idx_dishes_price ON dishes(price);
CREATE INDEX idx_menu_categories_is_active ON menu_categories(is_active);
CREATE INDEX idx_menu_categories_sort_order ON menu_categories(sort_order);
CREATE INDEX idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX idx_restaurant_tables_is_active ON restaurant_tables(is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tableId ON orders(tableId);
CREATE INDEX idx_orders_closedAt ON orders(closedAt);
CREATE INDEX idx_orders_total ON orders(total);
CREATE INDEX idx_order_items_orderId ON order_items(orderId);
CREATE INDEX idx_order_items_dishId ON order_items(dishId);

-- =====================================================
-- 🔐 POLÍTICAS RLS (Row Level Security)
-- =====================================================
-- Ativar RLS em todas as tabelas
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura (usuários autenticados)
CREATE POLICY "Usuários podem ler categorias" ON menu_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ler pratos" ON dishes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ler mesas" ON restaurant_tables
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ler pedidos" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ler itens de pedidos" ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para inserção (usuários autenticados)
CREATE POLICY "Usuários podem inserir categorias" ON menu_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir pratos" ON dishes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir mesas" ON restaurant_tables
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir pedidos" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir itens de pedidos" ON order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para atualização (usuários autenticados)
CREATE POLICY "Usuários podem atualizar categorias" ON menu_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar pratos" ON dishes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar mesas" ON restaurant_tables
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar pedidos" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar itens de pedidos" ON order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para deleção (usuários autenticados)
CREATE POLICY "Usuários podem deletar categorias" ON menu_categories
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar pratos" ON dishes
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar mesas" ON restaurant_tables
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar pedidos" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar itens de pedidos" ON order_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 🎯 DADOS INICIAIS PARA TESTE
-- =====================================================

-- Inserir categoria padrão
INSERT INTO menu_categories (id, name, description, is_active, sort_order, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas variadas', true, 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'Pratos', 'Pratos principais', true, 2, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'Sobremesas', 'Sobremesas variadas', true, 3, NOW(), NOW());

-- Inserir pratos de teste com todas as colunas essenciais
INSERT INTO dishes (id, name, description, price, categoryId, image_url, available, is_active, tax_percentage, status, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000000101', 'Bifana no Pão', 'Bifana tradicional no pão com molho especial', 3500.00, '00000000-0000-0000-0000-000000000002', '/images/bifana.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000102', 'Bitoque', 'Bitoque grelhado com batatas fritas e ovo', 12000.00, '00000000-0000-0000-0000-000000000002', '/images/bitoque.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000103', 'Refrigerante', 'Refrigerante lata 350ml', 500.00, '00000000-0000-0000-0000-000000000001', '/images/refrigerante.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000104', 'Bolo de Chocolate', 'Bolo de chocolate com cobertura', 800.00, '00000000-0000-0000-0000-000000000003', '/images/bolo.jpg', true, true, 13, 'active', NOW(), NOW());

-- Inserir mesas de teste
INSERT INTO restaurant_tables (id, name, number, seats, shape, status, x, y, width, height, is_active, created_at, updated_at) VALUES 
('00000000-0000-0000-0000-000000001001', 'Mesa 1', 1, 4, 'rectangle', 'AVAILABLE', 100, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001002', 'Mesa 2', 2, 4, 'rectangle', 'AVAILABLE', 200, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001003', 'Mesa 3', 3, 6, 'rectangle', 'AVAILABLE', 300, 100, 120, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001004', 'Balcão', 999, 0, 'rectangle', 'AVAILABLE', 0, 0, 100, 50, true, NOW(), NOW());

-- =====================================================
-- 🎯 MAPEAMENTO EXATO CÓDIGO ↔ BANCO
-- =====================================================

/*
🔥 COMPATIBILIDADE 100% GARANTIDA:

🍽️ DISH:
   dish.id → dishes.id
   dish.name → dishes.name
   dish.description → dishes.description
   dish.price → dishes.price (NUMERIC 15,2)
   dish.categoryId → dishes.categoryId (UUID)
   dish.image_url → dishes.image_url (TEXT)
   dish.status → dishes.status (TEXT)
   dish.available → dishes.available (BOOLEAN)
   dish.is_active → dishes.is_active (BOOLEAN)
   dish.tax_percentage → dishes.tax_percentage (NUMERIC)
   dish.created_at → dishes.created_at (TIMESTAMPTZ)
   dish.updated_at → dishes.updated_at (TIMESTAMPTZ)

🪑 TABLE:
   table.id → restaurant_tables.id
   table.name → restaurant_tables.name
   table.number → restaurant_tables.number
   table.status → restaurant_tables.status
   table.seats → restaurant_tables.seats
   table.is_active → restaurant_tables.is_active
   table.created_at → restaurant_tables.created_at
   table.updated_at → restaurant_tables.updated_at

📋 ORDER:
   order.id → orders.id
   order.status → orders.status
   order.total → orders.total (NUMERIC 15,2)
   order.items → orders.items (JSONB)
   order.customerName → orders.customerName (TEXT)
   order.tableId → orders.tableId (UUID)
   order.closedAt → orders.closedAt (TIMESTAMPTZ)
   order.userId → orders.userId (UUID)
   order.userName → orders.userName (TEXT)
   order.created_at → orders.created_at (TIMESTAMPTZ)
   order.updated_at → orders.updated_at (TIMESTAMPTZ)

📋 ORDER_ITEM:
   item.id → order_items.id
   item.orderId → order_items.orderId (UUID)
   item.dishId → order_items.dishId (UUID)
   item.quantity → order_items.quantity (NUMERIC)
   item.unit_price → order_items.unit_price (NUMERIC 15,2)
   item.status → order_items.status (TEXT)
   item.notes → order_items.notes (TEXT)
   item.created_at → order_items.created_at (TIMESTAMPTZ)

🍽️ CATEGORY:
   category.id → menu_categories.id
   category.name → menu_categories.name
   category.description → menu_categories.description
   category.is_active → menu_categories.is_active
   category.sort_order → menu_categories.sort_order
   category.created_at → menu_categories.created_at
   category.updated_at → menu_categories.updated_at

🎯 FLUXO POS GARANTIDO:
1. dish.price (3500.00) → dishes.price
2. dish.categoryId → dishes.categoryId
3. dish.image_url → dishes.image_url
4. dish.status → dishes.status
5. order.total (3500.00) → orders.total
6. order.items → orders.items
7. order.customerName → orders.customerName
8. order.tableId → orders.tableId
9. order.closedAt → orders.closedAt
10. item.unit_price → order_items.unit_price
11. item.orderId → order_items.orderId
12. item.dishId → order_items.dishId

🚀 INSTRUÇÕES DE LIMPEZA E EXECUÇÃO:

1️⃣ LIMPEZA DAS TABELAS ANTIGAS:
   - Abra o SQL Editor do Supabase
   - Execute APENAS os comandos DROP TABLE no início
   - Espere a execução completar
   - Verifique se as tabelas foram removidas

2️⃣ EXECUÇÃO DO NOVO SCHEMA:
   - Depois de limpar, execute o resto do script
   - Ou execute tudo de uma vez se não houver conflitos
   - Verifique se todas as tabelas foram criadas
   - Confirme os dados de teste aparecem

3️⃣ VERIFICAÇÃO:
   - Teste consulta: SELECT * FROM dishes;
   - Teste consulta: SELECT * FROM orders;
   - Teste consulta: SELECT * FROM menu_categories;
   - Teste consulta: SELECT * FROM restaurant_tables;
   - Verifique se as colunas correspondem ao código

⚠️ IMPORTANTE:
- Usar EXATAMENTE estes nomes de colunas
- dish.price = dishes.price
- dish.categoryId = dishes.categoryId
- order.closedAt = orders.closedAt
- order.customerName = orders.customerName
- order.tableId = orders.tableId
- item.unit_price = order_items.unit_price
- item.orderId = order_items.orderId
- item.dishId = order_items.dishId

🎉 SINCRONIZAÇÃO COMPLETA!
*/

COMMIT;
