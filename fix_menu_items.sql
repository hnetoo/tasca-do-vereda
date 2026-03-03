-- Criar tabela menu_items que está a faltar
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(100),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alguns menu_items básicos para associar aos pratos existentes
INSERT INTO menu_items (id, name, description, price, preco_custo, category)
SELECT 
    gen_random_uuid(), 'Grelhada Mista', 'Grelhada mista de carne e peixe', 20000.00, 15000.00, 'Pratos Principais'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Grelhada Mista')
UNION ALL
SELECT 
    gen_random_uuid(), 'Fino Lambreta', 'Fino tradicional da lambreta', 600.00, 400.00, 'Bebidas'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Fino Lambreta');

-- Agora criar as despesas
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

-- Criar pedidos
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

-- Verificar resultados
SELECT 'Menu Items' as table_name, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 'Expenses' as table_name, COUNT(*) as count FROM expenses WHERE description IN ('Compra de ingredientes frescos', 'Água e luz do restaurante', 'Material de limpeza', 'Internet e telefone')
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders WHERE total IN (50000.00, 78400.00, 35000.00);
