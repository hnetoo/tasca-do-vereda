-- SQL para criar a tabela external_finance no Supabase
-- Execute este SQL no painel SQL do Supabase

CREATE TABLE IF NOT EXISTS external_finance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('previous_sales', 'accumulated_profits', 'other')),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    period_start DATE,  -- Início do período (opcional)
    period_end DATE,    -- Fim do período (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,    -- ID do usuário que criou
    metadata JSONB DEFAULT '{}' -- Dados adicionais
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_external_finance_type ON external_finance(type);
CREATE INDEX IF NOT EXISTS idx_external_finance_period ON external_finance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_external_finance_created_at ON external_finance(created_at);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_external_finance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_finance_updated_at 
    BEFORE UPDATE ON external_finance 
    FOR EACH ROW 
    EXECUTE FUNCTION update_external_finance_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE external_finance ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir operações completas
CREATE POLICY "Allow all operations on external_finance" ON external_finance
    FOR ALL USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO external_finance (type, amount, description, period_start, period_end)
VALUES 
    ('previous_sales', 1500000.00, 'Vendas acumuladas antes da migração', '2024-01-01', '2024-12-31'),
    ('accumulated_profits', 450000.00, 'Lucros acumulados do sistema anterior', '2024-01-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Criar view para facilitar consultas
CREATE OR REPLACE VIEW external_finance_summary AS
SELECT 
    type,
    SUM(amount) as total_amount,
    COUNT(*) as record_count,
    MIN(period_start) as earliest_period,
    MAX(period_end) as latest_period
FROM external_finance 
GROUP BY type;
