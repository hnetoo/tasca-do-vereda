-- Fix Payroll Schema - Add Missing Columns
-- Script final corrigido para PostgreSQL/Supabase

-- Adicionar colunas faltantes uma por uma
ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS bonuses DECIMAL(12,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS deductions DECIMAL(12,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(8,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(12,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(12,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS net_salary DECIMAL(12,2) DEFAULT 0;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS month VARCHAR(7) DEFAULT '';

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT '';

-- Verificar mudanças
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;
