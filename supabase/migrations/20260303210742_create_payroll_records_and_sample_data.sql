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

-- Habilitar RLS para payroll_records
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Política básica para payroll_records
CREATE POLICY "Enable read access for all authenticated users" ON payroll_records FOR SELECT USING (auth.role() = 'authenticated');

-- Inserir dados de exemplo para orders (se não existirem)
INSERT INTO orders (id, table_id, status, total, subtotal, tax, created_at, updated_at) 
SELECT 
    'order-1', 'table-1', 'completed', 50000.00, 45000.00, 5000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'order-1')
UNION ALL
SELECT 
    'order-2', 'table-2', 'completed', 78400.00, 70000.00, 8400.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'order-2')
UNION ALL
SELECT 
    'order-3', 'table-3', 'completed', 35000.00, 31500.00, 3500.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = 'order-3');

-- Inserir itens dos pedidos (se não existirem)
INSERT INTO order_items (id, order_id, dish_id, quantity, price, total, created_at, updated_at)
SELECT 
    'item-1', 'order-1', '899a87f8-cf99-49c4-b736-6268196b1cb8', 2, 20000.00, 40000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-1')
UNION ALL
SELECT 
    'item-2', 'order-1', '4c2b1fd6-d704-4764-8119-766c1f210c5c', 2, 600.00, 1200.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-2')
UNION ALL
SELECT 
    'item-3', 'order-2', '899a87f8-cf99-49c4-b736-6268196b1cb8', 3, 20000.00, 60000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-3')
UNION ALL
SELECT 
    'item-4', 'order-2', '4c2b1fd6-d704-4764-8119-766c1f210c5c', 4, 600.00, 2400.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-4')
UNION ALL
SELECT 
    'item-5', 'order-3', '899a87f8-cf99-49c4-b736-6268196b1cb8', 1, 20000.00, 20000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-5')
UNION ALL
SELECT 
    'item-6', 'order-3', '4c2b1fd6-d704-4764-8119-766c1f210c5c', 5, 600.00, 3000.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = 'item-6');

-- Inserir dados de exemplo para expenses (se não existirem)
INSERT INTO expenses (id, description, amount, category, created_at, updated_at)
SELECT 
    'exp-1', 'Compra de ingredientes frescos', 15000.00, 'food', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE id = 'exp-1')
UNION ALL
SELECT 
    'exp-2', 'Água e luz do restaurante', 8000.00, 'utilities', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE id = 'exp-2')
UNION ALL
SELECT 
    'exp-3', 'Material de limpeza', 3500.00, 'supplies', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE id = 'exp-3')
UNION ALL
SELECT 
    'exp-4', 'Internet e telefone', 4500.00, 'utilities', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM expenses WHERE id = 'exp-4');

-- Inserir dados de exemplo para payroll_records (se não existirem)
INSERT INTO payroll_records (id, employee_id, base_salary, net_salary, month, overtime_hours, overtime_pay, bonuses, deductions, payment_date, payment_method, notes, created_at, updated_at)
SELECT 
    'payroll-1', 'emp-1', 35000.00, 32000.00, '2026-03', 10, 3500.00, 2000.00, 1500.00, '2026-03-05', 'transfer', 'Salário do chef principal', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE id = 'payroll-1')
UNION ALL
SELECT 
    'payroll-2', 'emp-2', 28000.00, 26000.00, '2026-03', 8, 2240.00, 1500.00, 1200.00, '2026-03-05', 'transfer', 'Salário do ajudante', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE id = 'payroll-2')
UNION ALL
SELECT 
    'payroll-3', 'emp-3', 22000.00, 20000.00, '2026-03', 5, 1100.00, 1000.00, 800.00, '2026-03-05', 'cash', 'Salário do recepcionista', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_records WHERE id = 'payroll-3');