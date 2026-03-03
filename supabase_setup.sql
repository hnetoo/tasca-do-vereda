-- Criar tabela payroll_records se não existir
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonuses DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar categoria de menu se não existir
INSERT INTO menu_categories (id, name, description) 
SELECT 
    gen_random_uuid(), 'Pratos Principais', 'Categoria principal para pratos'
WHERE NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Pratos Principais');

-- Criar pratos necessários se não existirem
INSERT INTO dishes (id, name, description, price, category_id, tax_percentage, tax_code, available, is_active, is_available_on_digital_menu, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, unit, created_at, updated_at)
SELECT 
    gen_random_uuid(), 'Grelhada Mista', 'Grelhada mista de carne e peixe', 20000.00, 
    (SELECT id FROM menu_categories WHERE name = 'Pratos Principais' LIMIT 1), 
    0.065, 'NOR', true, true, true, false, 0, 5, null, 'un', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Grelhada Mista')
UNION ALL
SELECT 
    gen_random_uuid(), 'Fino Lambreta', 'Fino tradicional da lambreta', 600.00, 
    (SELECT id FROM menu_categories WHERE name = 'Pratos Principais' LIMIT 1), 
    0.065, 'NOR', true, true, true, false, 0, 5, null, 'un', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Fino Lambreta');

-- Criar mesas necessárias se não existirem
INSERT INTO restaurant_tables (id, name, number, seats, zone, status) 
SELECT 
    gen_random_uuid(), 'Mesa 1', 1, 4, 'INTERIOR', 'AVAILABLE'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 1)
UNION ALL
SELECT 
    gen_random_uuid(), 'Mesa 2', 2, 4, 'INTERIOR', 'AVAILABLE'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 2)
UNION ALL
SELECT 
    gen_random_uuid(), 'Mesa 3', 3, 4, 'INTERIOR', 'AVAILABLE'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE number = 3);

-- Inserir dados de exemplo para orders (usando IDs de mesas válidos)
INSERT INTO orders (id, table_id, status, total, tax_total, created_at, updated_at) 
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 1 LIMIT 1), 
    'CLOSED', 50000.00, 5000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE total = 50000.00)
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 2 LIMIT 1), 
    'CLOSED', 78400.00, 8400.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE total = 78400.00)
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM restaurant_tables WHERE number = 3 LIMIT 1), 
    'CLOSED', 35000.00, 3500.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE total = 35000.00);

-- Inserir itens dos pedidos (usando IDs de pratos válidos)
INSERT INTO order_items (id, order_id, dish_id, quantity, unit_price, tax_amount, created_at)
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 50000.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1), 2, 20000.00, 2600.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 50000.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1))
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 50000.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1), 2, 600.00, 78.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 50000.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1))
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 78400.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1), 3, 20000.00, 3900.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 78400.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1))
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 78400.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1), 4, 600.00, 156.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 78400.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1))
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 35000.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1), 1, 20000.00, 1300.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 35000.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Grelhada Mista' LIMIT 1))
UNION ALL
SELECT 
    gen_random_uuid(), 
    (SELECT id FROM orders WHERE total = 35000.00 LIMIT 1), 
    (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1), 5, 600.00, 195.00, NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = (SELECT id FROM orders WHERE total = 35000.00 LIMIT 1) AND dish_id = (SELECT id FROM dishes WHERE name = 'Fino Lambreta' LIMIT 1));

-- Inserir dados de exemplo para expenses
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

-- Inserir dados de exemplo para payroll_records
INSERT INTO payroll_records (id, employee_id, base_salary, net_salary, month, overtime_hours, overtime_pay, bonuses, deductions, payment_date, payment_method, notes, created_at, updated_at) 
SELECT 
    gen_random_uuid(), gen_random_uuid(), 35000.00, 32000.00, '2026-03', 10, 3500.00, 2000.00, 1500.00, '2026-03-05', 'transfer', 'Salário do chef principal', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE notes = 'Salário do chef principal')
UNION ALL
SELECT 
    gen_random_uuid(), gen_random_uuid(), 28000.00, 26000.00, '2026-03', 8, 2240.00, 1500.00, 1200.00, '2026-03-05', 'transfer', 'Salário do ajudante', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE notes = 'Salário do ajudante')
UNION ALL
SELECT 
    gen_random_uuid(), gen_random_uuid(), 22000.00, 20000.00, '2026-03', 5, 1100.00, 1000.00, 800.00, '2026-03-05', 'cash', 'Salário do recepcionista', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE notes = 'Salário do recepcionista');

-- Verificar dados inseridos
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items  
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Payroll Records', COUNT(*) FROM payroll_records;

-- Mostrar totais para verificação
SELECT 'Total Revenue' as metric, SUM(total) as value FROM orders
UNION ALL  
SELECT 'Total Expenses', SUM(amount) FROM expenses
UNION ALL
SELECT 'Total Payroll', SUM(net_salary) FROM payroll_records;
