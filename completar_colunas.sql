-- Completar apenas as colunas que ainda não existem
-- Execute este script após verificar quais colunas faltam

-- Adicionar coluna status (geralmente falta)
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Adicionar coluna payment_date
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

-- Adicionar coluna staff_name
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT '';

-- Adicionar coluna month
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS month VARCHAR(7) DEFAULT '';

-- Adicionar coluna year
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026;

-- Verificação final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;
