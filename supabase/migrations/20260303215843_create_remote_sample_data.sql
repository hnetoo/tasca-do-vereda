-- Script para criar dados de exemplo no Supabase remoto

-- 1. Criar pratos
INSERT INTO dishes (id, name, description, price, tax_percentage, tax_code, available, is_active, is_available_on_digital_menu, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, unit, created_at, updated_at)
SELECT 
    gen_random_uuid(), 'Grelhada Mista', 'Grelhada mista de carne e peixe', 20000.00, 
    gen_random_uuid(), 0.065, 'NOR', true, true, true, false, 0, 5, 1000, 'un', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Grelhada Mista')
UNION ALL
SELECT 
    gen_random_uuid(), 'Fino Lambreta', 'Fino tradicional da lambreta', 600.00, 
    gen_random_uuid(), 0.065, 'NOR', true, true, true, false, 0, 5, 1000, 'un', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Fino Lambreta');

-- 2. Criar despesas
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

-- 3. Criar pedidos (se existirem mesas)
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
    (SELECT id FROM restaurant_tables WHERE number = 3 LIMIT 1), 
    'CLOSED', 35000.00, 3500.00, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 3) AND NOT EXISTS (SELECT 1 FROM orders WHERE total = 35000.00);

-- 4. Verificar resultados
SELECT 'Dishes Created' as status, COUNT(*) as count FROM dishes WHERE name IN ('Grelhada Mista', 'Fino Lambreta')
UNION ALL
SELECT 'Expenses Created' as status, COUNT(*) as count FROM expenses WHERE description IN ('Compra de ingredientes frescos', 'Água e luz do restaurante', 'Material de limpeza', 'Internet e telefone')
UNION ALL
SELECT 'Orders Created' as status, COUNT(*) as count FROM orders WHERE total IN (50000.00, 78400.00, 35000.00);