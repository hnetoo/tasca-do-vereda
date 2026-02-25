-- Script para adicionar dados financeiros de teste
-- Executar: supabase db shell --local < scripts/add_test_financial_data.sql

-- Inserir algumas receitas de teste
INSERT INTO public.revenues (id, amount, description, category, created_at, updated_at) VALUES
  ('rev_test_1', 15000.00, 'Venda do dia - Refeições', 'RESTAURANTE', NOW() - INTERVAL '1 hour', NOW()),
  ('rev_test_2', 8500.00, 'Bebidas e Petiscos', 'BAR', NOW() - INTERVAL '3 hours', NOW()),
  ('rev_test_3', 22000.00, 'Serviço completo', 'RESTAURANTE', NOW() - INTERVAL '5 hours', NOW()),
  ('rev_test_4', 12000.00, 'Almoço executivo', 'RESTAURANTE', NOW() - INTERVAL '2 days', NOW()),
  ('rev_test_5', 18000.00, 'Jantar especial', 'RESTAURANTE', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas despesas de teste
INSERT INTO public.expenses (id, amount, description, category, created_at, updated_at) VALUES
  ('exp_test_1', 3500.00, 'Compra de matéria-prima', 'FORNECEDORES', NOW() - INTERVAL '4 hours', NOW()),
  ('exp_test_2', 1200.00, 'Limpeza e manutenção', 'SERVIÇOS', NOW() - INTERVAL '6 hours', NOW()),
  ('exp_test_3', 800.00, 'Contas de utilities', 'FIXAS', NOW() - INTERVAL '1 day', NOW()),
  ('exp_test_4', 2500.00, 'Salários funcionários', 'PESSOAL', NOW() - INTERVAL '2 days', NOW()),
  ('exp_test_5', 600.00, 'Marketing e propaganda', 'MARKETING', NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns pedidos de teste
INSERT INTO public.orders (id, table_id, status, total, created_at, updated_at) VALUES
  ('order_test_1', 'table_1', 'FECHADO', 8500.00, NOW() - INTERVAL '2 hours', NOW()),
  ('order_test_2', 'table_2', 'FECHADO', 12000.00, NOW() - INTERVAL '3 hours', NOW()),
  ('order_test_3', 'table_3', 'FECHADO', 15000.00, NOW() - INTERVAL '5 hours', NOW()),
  ('order_test_4', 'table_4', 'FECHADO', 9200.00, NOW() - INTERVAL '1 day', NOW()),
  ('order_test_5', 'table_5', 'FECHADO', 18500.00, NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar dados inseridos
SELECT 'RECEITAS' as tipo, COUNT(*) as quantidade, SUM(amount) as total FROM revenues 
WHERE description LIKE '%test%' OR id LIKE 'rev_test_%'
UNION ALL
SELECT 'DESPESAS' as tipo, COUNT(*) as quantidade, SUM(amount) as total FROM expenses 
WHERE description LIKE '%test%' OR id LIKE 'exp_test_%'
UNION ALL
SELECT 'PEDIDOS' as tipo, COUNT(*) as quantidade, SUM(total) as total FROM orders 
WHERE id LIKE 'order_test_%';
