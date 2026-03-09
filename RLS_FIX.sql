-- =====================================================
-- 🔐 RLS FIX - Verificar e ajustar políticas de segurança
-- =====================================================
-- Objetivo: Garantir que POS consiga listar mesas e produtos
-- Verificar RLS ativo e criar políticas SELECT para todos

-- =====================================================
-- 🔍 VERIFICAÇÃO DO ESTADO ATUAL DAS TABELAS
-- =====================================================

-- Verificar se RLS está ativo nas tabelas críticas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('menu_categories', 'dishes', 'restaurant_tables', 'orders', 'order_items')
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('menu_categories', 'dishes', 'restaurant_tables', 'orders', 'order_items')
ORDER BY tablename, policyname;

-- =====================================================
-- 🔧 CORREÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Enable all for menu_categories" ON "menu_categories";
DROP POLICY IF EXISTS "Enable all for dishes" ON "dishes";
DROP POLICY IF EXISTS "Enable all for restaurant_tables" ON "restaurant_tables";
DROP POLICY IF EXISTS "Enable all for orders" ON "orders";
DROP POLICY IF EXISTS "Enable all for order_items" ON "order_items";

-- Garantir que RLS está ativo
ALTER TABLE "menu_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "restaurant_tables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 📋 POLÍTICAS RLS CORRIGIDAS - ACESSO TOTAL
-- =====================================================

-- Menu Categories - Permitir SELECT para todos
CREATE POLICY "Enable read for menu_categories" ON "menu_categories"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for menu_categories" ON "menu_categories"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for menu_categories" ON "menu_categories"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for menu_categories" ON "menu_categories"
    FOR DELETE USING (true);

-- Dishes - Permitir SELECT para todos
CREATE POLICY "Enable read for dishes" ON "dishes"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for dishes" ON "dishes"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for dishes" ON "dishes"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for dishes" ON "dishes"
    FOR DELETE USING (true);

-- Restaurant Tables - Permitir SELECT para todos
CREATE POLICY "Enable read for restaurant_tables" ON "restaurant_tables"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for restaurant_tables" ON "restaurant_tables"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for restaurant_tables" ON "restaurant_tables"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for restaurant_tables" ON "restaurant_tables"
    FOR DELETE USING (true);

-- Orders - Permitir SELECT para todos
CREATE POLICY "Enable read for orders" ON "orders"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for orders" ON "orders"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for orders" ON "orders"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for orders" ON "orders"
    FOR DELETE USING (true);

-- Order Items - Permitir SELECT para todos
CREATE POLICY "Enable read for order_items" ON "order_items"
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for order_items" ON "order_items"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for order_items" ON "order_items"
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for order_items" ON "order_items"
    FOR DELETE USING (true);

-- =====================================================
-- 🧪 TESTE DE ACESSO - Verificar se as políticas funcionam
-- =====================================================

-- Testar SELECT em menu_categories (deve funcionar)
SELECT COUNT(*) as menu_categories_count FROM "menu_categories";

-- Testar SELECT em dishes (deve funcionar)
SELECT COUNT(*) as dishes_count FROM "dishes";

-- Testar SELECT em restaurant_tables (deve funcionar)
SELECT COUNT(*) as restaurant_tables_count FROM "restaurant_tables";

-- Testar SELECT em orders (deve funcionar)
SELECT COUNT(*) as orders_count FROM "orders";

-- Testar SELECT em order_items (deve funcionar)
SELECT COUNT(*) as order_items_count FROM "order_items";

-- =====================================================
-- 📊 VERIFICAÇÃO FINAL DAS POLÍTICAS
-- =====================================================

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('menu_categories', 'dishes', 'restaurant_tables', 'orders', 'order_items')
ORDER BY tablename, policyname;

-- =====================================================
-- 🎯 INSTRUÇÕES DE USO
-- =====================================================

/*
🔍 DIAGNÓSTICO:
1. Execute as queries de verificação no início
2. Verifique se rls_enabled = true para todas as tabelas
3. Verifique se as políticas aparecem na lista

🔧 APLICAÇÃO:
1. Execute os comandos DROP POLICY (se existirem)
2. Execute os comandos ALTER TABLE ENABLE ROW LEVEL SECURITY
3. Execute os comandos CREATE POLICY separados por operação
4. Execute as queries de teste no final

🧪 TESTE:
- Se todas as queries de teste retornarem contagens > 0
- As políticas estão funcionando corretamente
- O POS deverá conseguir listar mesas e produtos

📋 RESULTADO ESPERADO:
- ✅ menu_categories: SELECT funciona
- ✅ dishes: SELECT funciona
- ✅ restaurant_tables: SELECT funciona
- ✅ orders: SELECT funciona
- ✅ order_items: SELECT funciona

🚨 SOLUÇÃO DE PROBLEMAS:
- Se ainda não funcionar, verifique:
  1. Se o usuário está autenticado (auth.role() = 'authenticated')
  2. Se as variáveis de ambiente do Supabase estão corretas
  3. Se não há outras políticas restritivas sobrepostas

🎉 POS FUNCIONANDO!
*/

COMMIT;
