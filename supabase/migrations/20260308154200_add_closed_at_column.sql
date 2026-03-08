-- Adicionar coluna closedAt à tabela orders
ALTER TABLE orders ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário
COMMENT ON COLUMN orders.closed_at IS 'Data e hora em que o pedido foi fechado/concluído';

-- Criar índice para performance
CREATE INDEX idx_orders_closed_at ON orders(closed_at);
