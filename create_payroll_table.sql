-- SQL para criar a tabela payroll no Supabase
-- Execute este SQL no painel SQL do Supabase

CREATE TABLE IF NOT EXISTS payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime DECIMAL(10,2) NOT NULL DEFAULT 0,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    month TEXT NOT NULL, -- Formato: '2024-01'
    year TEXT NOT NULL,  -- Formato: '2024'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_updated_at 
    BEFORE UPDATE ON payroll 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir operações completas (ajuste conforme necessário)
CREATE POLICY "Allow all operations on payroll" ON payroll
    FOR ALL USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO payroll (staff_id, staff_name, base_salary, bonus, overtime, deductions, month, year, status)
VALUES 
    ('staff-001', 'João Silva', 150000.00, 5000.00, 2000.00, 1000.00, '2024-01', '2024', 'processed'),
    ('staff-002', 'Maria Santos', 120000.00, 3000.00, 1500.00, 800.00, '2024-01', '2024', 'pending')
ON CONFLICT DO NOTHING;
