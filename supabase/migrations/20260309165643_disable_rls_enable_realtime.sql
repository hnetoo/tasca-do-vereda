-- =====================================================
-- 🔓 DISABLE RLS & ENABLE REALTIME
-- =====================================================
-- Desativar Row Level Security em todas as tabelas
-- Ativar Realtime para todas as tabelas

-- =====================================================
-- 🔓 DISABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Desativar RLS em todas as tabelas
ALTER TABLE "menu_categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "dishes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "restaurant_tables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📡 ENABLE REALTIME
-- =====================================================

-- Ativar Realtime em todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE "menu_categories";
ALTER PUBLICATION supabase_realtime ADD TABLE "dishes";
ALTER PUBLICATION supabase_realtime ADD TABLE "restaurant_tables";
ALTER PUBLICATION supabase_realtime ADD TABLE "orders";
ALTER PUBLICATION supabase_realtime ADD TABLE "order_items";

-- =====================================================
-- 🗑️ REMOVER POLÍTICAS RLS (já não são necessárias)
-- =====================================================

-- Remover políticas de menu_categories
DROP POLICY IF EXISTS "Enable read for menu_categories" ON "menu_categories";
DROP POLICY IF EXISTS "Enable insert for menu_categories" ON "menu_categories";
DROP POLICY IF EXISTS "Enable update for menu_categories" ON "menu_categories";
DROP POLICY IF EXISTS "Enable delete for menu_categories" ON "menu_categories";

-- Remover políticas de dishes
DROP POLICY IF EXISTS "Enable read for dishes" ON "dishes";
DROP POLICY IF EXISTS "Enable insert for dishes" ON "dishes";
DROP POLICY IF EXISTS "Enable update for dishes" ON "dishes";
DROP POLICY IF EXISTS "Enable delete for dishes" ON "dishes";

-- Remover políticas de restaurant_tables
DROP POLICY IF EXISTS "Enable read for restaurant_tables" ON "restaurant_tables";
DROP POLICY IF EXISTS "Enable insert for restaurant_tables" ON "restaurant_tables";
DROP POLICY IF EXISTS "Enable update for restaurant_tables" ON "restaurant_tables";
DROP POLICY IF EXISTS "Enable delete for restaurant_tables" ON "restaurant_tables";

-- Remover políticas de orders
DROP POLICY IF EXISTS "Enable read for orders" ON "orders";
DROP POLICY IF EXISTS "Enable insert for orders" ON "orders";
DROP POLICY IF EXISTS "Enable update for orders" ON "orders";
DROP POLICY IF EXISTS "Enable delete for orders" ON "orders";

-- Remover políticas de order_items
DROP POLICY IF EXISTS "Enable read for order_items" ON "order_items";
DROP POLICY IF EXISTS "Enable insert for order_items" ON "order_items";
DROP POLICY IF EXISTS "Enable update for order_items" ON "order_items";
DROP POLICY IF EXISTS "Enable delete for order_items" ON "order_items";

-- =====================================================
-- ✅ VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está desativado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('menu_categories', 'dishes', 'restaurant_tables', 'orders', 'order_items')
ORDER BY tablename;

-- Verificar se Realtime está ativo
SELECT 
    schemaname,
    tablename,
    'realtime_enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename IN ('menu_categories', 'dishes', 'restaurant_tables', 'orders', 'order_items')
ORDER BY tablename;