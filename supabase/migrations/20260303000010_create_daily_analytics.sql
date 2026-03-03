-- Criar tabela daily_analytics para analytics diários
CREATE TABLE IF NOT EXISTS daily_analytics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    average_ticket DECIMAL(12,2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_total_orders ON daily_analytics(total_orders);

-- Dar permissões totais
GRANT ALL ON daily_analytics TO anon;
GRANT ALL ON daily_analytics TO authenticated;
GRANT ALL ON daily_analytics TO service_role;
