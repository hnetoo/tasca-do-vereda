-- Script simples para adicionar colunas na tabela payroll
-- Execute um comando de cada vez para evitar erros

-- Adicionar coluna bonuses
ALTER TABLE payroll ADD COLUMN bonuses DECIMAL(12,2) DEFAULT 0;

-- Adicionar coluna deductions  
ALTER TABLE payroll ADD COLUMN deductions DECIMAL(12,2) DEFAULT 0;

-- Adicionar coluna overtime_hours
ALTER TABLE payroll ADD COLUMN overtime_hours DECIMAL(8,2) DEFAULT 0;

-- Adicionar coluna overtime_rate
ALTER TABLE payroll ADD COLUMN overtime_rate DECIMAL(12,2) DEFAULT 0;

-- Adicionar coluna overtime_pay
ALTER TABLE payroll ADD COLUMN overtime_pay DECIMAL(12,2) DEFAULT 0;

-- Adicionar coluna net_salary
ALTER TABLE payroll ADD COLUMN net_salary DECIMAL(12,2) DEFAULT 0;

-- Adicionar coluna month
ALTER TABLE payroll ADD COLUMN month VARCHAR(7) DEFAULT '';

-- Adicionar coluna year
ALTER TABLE payroll ADD COLUMN year INTEGER DEFAULT 2026;

-- Adicionar coluna status
ALTER TABLE payroll ADD COLUMN status VARCHAR(20) DEFAULT 'pending';

-- Adicionar coluna payment_date
ALTER TABLE payroll ADD COLUMN payment_date TIMESTAMP;

-- Adicionar coluna staff_name
ALTER TABLE payroll ADD COLUMN staff_name VARCHAR(255) DEFAULT '';
