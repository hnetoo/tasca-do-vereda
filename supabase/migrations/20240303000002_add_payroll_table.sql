-- =============================================
-- MIGRATION: Adicionar tabela payroll que faltava
-- =============================================

-- 11. Folha Salarial (payroll) - VERSÃO CORRIGIDA
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    month VARCHAR(20) NOT NULL, -- '2024-01'
    base_salary DECIMAL(10,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para folha salarial
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Política básica
CREATE POLICY "Enable read access for all authenticated users" ON payroll FOR SELECT USING (auth.role() = 'authenticated');
