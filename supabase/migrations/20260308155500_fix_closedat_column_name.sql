-- Corrigir nome da coluna de closed_at para closedAt
ALTER TABLE orders RENAME COLUMN closed_at TO closedAt;

-- Atualizar comentário
COMMENT ON COLUMN orders.closedAt IS 'Data e hora em que o pedido foi fechado/concluído';

-- Recriar índice com nome correto
DROP INDEX IF EXISTS idx_orders_closed_at;
CREATE INDEX idx_orders_closedAt ON orders(closedAt);
