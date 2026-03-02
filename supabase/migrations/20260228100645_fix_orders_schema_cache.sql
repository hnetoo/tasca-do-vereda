-- Forçar refresh do schema cache para tabela orders
-- Isso força o PostgreSQL a reconhecer a coluna items
-- ALTER TABLE orders ALTER COLUMN items TYPE JSONB;

-- Forçar refresh das estatísticas
ANALYZE orders;