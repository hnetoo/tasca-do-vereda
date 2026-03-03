-- SQL MANUAL PARA SUPABASE REMOTO
-- Execute este SQL no Supabase Studio: https://myppylcyupoirizyxhpo.supabase.co

-- 1. Criar despesas (bypass triggers)
INSERT INTO expenses (id, description, amount, category, date, created_at, updated_at)
SELECT 
    gen_random_uuid(), 'Compra de ingredientes frescos', 15000.00, 'food', CURRENT_DATE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE description = 'Compra de ingredientes frescos')
UNION ALL
SELECT 
    gen_random_uuid(), 'Água e luz do restaurante', 8000.00, 'utilities', CURRENT_DATE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE description = 'Água e luz do restaurante')
UNION ALL
SELECT 
    gen_random_uuid(), 'Material de limpeza', 3500.00, 'supplies', CURRENT_DATE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE description = 'Material de limpeza')
UNION ALL
SELECT 
    gen_random_uuid(), 'Internet e telefone', 4500.00, 'utilities', CURRENT_DATE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE description = 'Internet e telefone');

-- 2. Criar pedidos
INSERT INTO orders (id, table_id, status, total, tax_total, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 1 LIMIT 1), 
    'CLOSED', 50000.00, 5000.00, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 1) AND NOT EXISTS (SELECT 1 FROM orders WHERE total = 50000.00)
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 2 LIMIT 1), 
    'CLOSED', 78400.00, 8400.00, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 2) AND NOT EXISTS (SELECT 1 FROM orders WHERE total = 78400.00)
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 4 LIMIT 1), 
    'CLOSED', 35000.00, 3500.00, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 4) AND NOT EXISTS (SELECT 1 FROM orders WHERE total = 35000.00);

-- 3. Verificar resultados
SELECT 'Dishes' as table_name, COUNT(*) as count FROM dishes WHERE name IN ('Grelhada Mista', 'Fino Lambreta')
UNION ALL
SELECT 'Expenses' as table_name, COUNT(*) as count FROM expenses WHERE description IN ('Compra de ingredientes frescos', 'Água e luz do restaurante', 'Material de limpeza', 'Internet e telefone')
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders WHERE total IN (50000.00, 78400.00, 35000.00);

-- 4. Mostrar totais
SELECT 'Total Revenue' as metric, COALESCE(SUM(total), 0) as value FROM orders WHERE total IN (50000.00, 78400.00, 35000.00)
UNION ALL
SELECT 'Total Expenses', COALESCE(SUM(amount), 0) FROM expenses WHERE description IN ('Compra de ingredientes frescos', 'Água e luz do restaurante', 'Material de limpeza', 'Internet e telefone')
UNION ALL
SELECT 'Net Profit', COALESCE((SELECT SUM(total) FROM orders WHERE total IN (50000.00, 78400.00, 35000.00)), 0) - COALESCE((SELECT SUM(amount) FROM expenses WHERE description IN ('Compra de ingredientes frescos', 'Água e luz do restaurante', 'Material de limpeza', 'Internet e telefone')), 0);
