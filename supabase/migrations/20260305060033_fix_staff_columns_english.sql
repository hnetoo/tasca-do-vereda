-- Fix staff table columns to use English names
ALTER TABLE public.staff RENAME COLUMN nome TO name;
ALTER TABLE public.staff RENAME COLUMN cargo TO role;
ALTER TABLE public.staff RENAME COLUMN telefone TO phone;
ALTER TABLE public.staff RENAME COLUMN salario_base TO base_salary;

-- Add missing columns if they don't exist
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_staff_nome;
DROP INDEX IF EXISTS idx_staff_cargo;
CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);

-- Update comments
COMMENT ON COLUMN public.staff.name IS 'Nome completo do funcionário';
COMMENT ON COLUMN public.staff.role IS 'Cargo ou função do funcionário';
COMMENT ON COLUMN public.staff.phone IS 'Telefone de contato';
COMMENT ON COLUMN public.staff.base_salary IS 'Salário base do funcionário';
COMMENT ON COLUMN public.staff.updated_at IS 'Data da última atualização';