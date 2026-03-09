-- =====================================================
-- 🏗️ CLEAN DATABASE SCHEMA - ESPELHO 100% DO CÓDIGO NEXT.JS
-- =====================================================
-- Baseado em: Interfaces TypeScript (Dish, Order, Category, Table)
-- Nomenclatura: Nomes exatos das propriedades do código
-- Relacionamentos: FK dishes→categories, orders→restaurant_tables
-- RLS: Políticas completas para POS e Inventário
-- =====================================================

-- =====================================================
-- 🧹 LIMPEZA COMPLETA
-- =====================================================
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "dishes" CASCADE;
DROP TABLE IF EXISTS "menu_categories" CASCADE;
DROP TABLE IF EXISTS "restaurant_tables" CASCADE;

-- =====================================================
-- 🍽️ CATEGORIES (MenuCategory)
-- =====================================================
-- Baseado em: src/types.ts MenuCategory interface
CREATE TABLE "menu_categories" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "parentId" UUID,
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "isAvailableOnDigitalMenu" BOOLEAN DEFAULT true,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🍽️ DISHES (Dish)
-- =====================================================
-- Baseado em: src/types.ts Dish interface
CREATE TABLE "dishes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" NUMERIC(15,2) NOT NULL,
    "costPrice" NUMERIC(15,2),
    "categoryId" UUID REFERENCES "menu_categories"("id") ON DELETE SET NULL,
    "supplierId" UUID,
    "imageUrl" TEXT,
    "available" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "isAvailableOnDigitalMenu" BOOLEAN DEFAULT true,
    "taxPercentage" NUMERIC DEFAULT 0,
    "taxCode" TEXT DEFAULT '',
    "preparationTime" INTEGER,
    "trackStock" BOOLEAN DEFAULT false,
    "stockQuantity" NUMERIC DEFAULT 0,
    "minStockQuantity" NUMERIC DEFAULT 0,
    "maxStockQuantity" NUMERIC,
    "unit" TEXT DEFAULT 'un',
    "userId" UUID,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🪑 RESTAURANT TABLES (Table)
-- =====================================================
-- Baseado em: src/types.ts Table interface
CREATE TABLE "restaurant_tables" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT,
    "number" INTEGER NOT NULL,
    "seats" INTEGER,
    "shape" TEXT DEFAULT 'rectangle',
    "zone" TEXT,
    "status" TEXT DEFAULT 'AVAILABLE',
    "x" NUMERIC,
    "y" NUMERIC,
    "width" NUMERIC,
    "height" NUMERIC,
    "rotation" NUMERIC DEFAULT 0,
    "color" TEXT,
    "label" TEXT,
    "groupId" UUID,
    "userId" UUID,
    "isActive" BOOLEAN DEFAULT true,
    "qrCode" TEXT,
    "activeOrderIds" UUID[] DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📋 ORDERS (Order)
-- =====================================================
-- Baseado em: src/types.ts Order interface
CREATE TABLE "orders" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "orderNumber" TEXT,
    "status" TEXT NOT NULL,
    "tableId" UUID REFERENCES "restaurant_tables"("id") ON DELETE SET NULL,
    "customerId" UUID,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerNif" TEXT,
    "userId" UUID,
    "userName" TEXT,
    "total" NUMERIC(15,2),
    "taxTotal" NUMERIC(15,2),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "shiftId" UUID,
    "subAccountName" TEXT,
    "invoiceNumber" TEXT,
    "agtSubmissionUuid" TEXT,
    "isSyncedAgt" INTEGER DEFAULT 0,
    "hash" TEXT,
    "previousHash" TEXT,
    "signature" TEXT,
    "jwsPayload" JSONB,
    "splitPayments" JSONB,
    "payments" JSONB,
    "totalAmount" NUMERIC(15,2),
    "paidAmount" NUMERIC(15,2),
    "isPaid" BOOLEAN DEFAULT false,
    "timestamp" TEXT,
    "closedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "items" JSONB DEFAULT '[]'::JSONB NOT NULL
);

-- =====================================================
-- 📋 ORDER_ITEMS (OrderItem)
-- =====================================================
-- Baseado em: src/types.ts OrderItem interface
CREATE TABLE "order_items" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "dishId" UUID REFERENCES "dishes"("id") ON DELETE SET NULL,
    "quantity" NUMERIC NOT NULL,
    "unitPrice" NUMERIC(15,2) NOT NULL,
    "taxPercentage" NUMERIC DEFAULT 0,
    "taxAmount" NUMERIC(15,2) DEFAULT 0,
    "taxCode" TEXT DEFAULT '',
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 📊 ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX "idx_dishes_categoryId" ON "dishes"("categoryId");
CREATE INDEX "idx_dishes_isActive" ON "dishes"("isActive");
CREATE INDEX "idx_dishes_status" ON "dishes"("status");
CREATE INDEX "idx_dishes_price" ON "dishes"("price");
CREATE INDEX "idx_menu_categories_isActive" ON "menu_categories"("isActive");
CREATE INDEX "idx_menu_categories_sortOrder" ON "menu_categories"("sortOrder");
CREATE INDEX "idx_restaurant_tables_status" ON "restaurant_tables"("status");
CREATE INDEX "idx_restaurant_tables_isActive" ON "restaurant_tables"("isActive");
CREATE INDEX "idx_orders_status" ON "orders"("status");
CREATE INDEX "idx_orders_tableId" ON "orders"("tableId");
CREATE INDEX "idx_orders_closedAt" ON "orders"("closedAt");
CREATE INDEX "idx_orders_total" ON "orders"("total");
CREATE INDEX "idx_order_items_orderId" ON "order_items"("orderId");
CREATE INDEX "idx_order_items_dishId" ON "order_items"("dishId");

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Ativar RLS em todas as tabelas
ALTER TABLE "menu_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "restaurant_tables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 🔓 POLÍTICAS RLS - ACESSO TOTAL PARA POS E INVENTÁRIO
-- =====================================================

-- Menu Categories
CREATE POLICY "Enable read for menu_categories" ON "menu_categories"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for menu_categories" ON "menu_categories"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for menu_categories" ON "menu_categories"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for menu_categories" ON "menu_categories"
    FOR DELETE USING (true);

-- Dishes
CREATE POLICY "Enable read for dishes" ON "dishes"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for dishes" ON "dishes"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for dishes" ON "dishes"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for dishes" ON "dishes"
    FOR DELETE USING (true);

-- Restaurant Tables
CREATE POLICY "Enable read for restaurant_tables" ON "restaurant_tables"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for restaurant_tables" ON "restaurant_tables"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for restaurant_tables" ON "restaurant_tables"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for restaurant_tables" ON "restaurant_tables"
    FOR DELETE USING (true);

-- Orders
CREATE POLICY "Enable read for orders" ON "orders"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for orders" ON "orders"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for orders" ON "orders"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for orders" ON "orders"
    FOR DELETE USING (true);

-- Order Items
CREATE POLICY "Enable read for order_items" ON "order_items"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for order_items" ON "order_items"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for order_items" ON "order_items"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for order_items" ON "order_items"
    FOR DELETE USING (true);

-- =====================================================
-- 🎯 DADOS DE TESTE - COMPATÍVEIS COM O CÓDIGO
-- =====================================================

-- Inserir categorias de teste
INSERT INTO "menu_categories" ("id", "name", "description", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES 
('00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas variadas', true, 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'Pratos', 'Pratos principais', true, 2, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'Sobremesas', 'Sobremesas variadas', true, 3, NOW(), NOW());

-- Inserir pratos de teste com todas as colunas essenciais
INSERT INTO "dishes" ("id", "name", "description", "price", "categoryId", "imageUrl", "available", "isActive", "taxPercentage", "status", "createdAt", "updatedAt") VALUES 
('00000000-0000-0000-0000-000000000101', 'Bifana no Pão', 'Bifana tradicional no pão com molho especial', 3500.00, '00000000-0000-0000-0000-000000000002', '/images/bifana.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000102', 'Bitoque', 'Bitoque grelhado com batatas fritas e ovo', 12000.00, '00000000-0000-0000-0000-000000000002', '/images/bitoque.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000103', 'Refrigerante', 'Refrigerante lata 350ml', 500.00, '00000000-0000-0000-0000-000000000001', '/images/refrigerante.jpg', true, true, 13, 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000104', 'Bolo de Chocolate', 'Bolo de chocolate com cobertura', 800.00, '00000000-0000-0000-0000-000000000003', '/images/bolo.jpg', true, true, 13, 'active', NOW(), NOW());

-- Inserir mesas de teste
INSERT INTO "restaurant_tables" ("id", "name", "number", "seats", "shape", "status", "x", "y", "width", "height", "isActive", "createdAt", "updatedAt") VALUES 
('00000000-0000-0000-0000-000000001001', 'Mesa 1', 1, 4, 'rectangle', 'AVAILABLE', 100, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001002', 'Mesa 2', 2, 4, 'rectangle', 'AVAILABLE', 200, 100, 80, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001003', 'Mesa 3', 3, 6, 'rectangle', 'AVAILABLE', 300, 100, 120, 80, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000001004', 'Balcão', 999, 0, 'rectangle', 'AVAILABLE', 0, 0, 100, 50, true, NOW(), NOW());