-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  base_salary NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.staff IS 'Tabela de funcionários da Tasca do Vereda';
COMMENT ON COLUMN public.staff.id IS 'Identificador único do funcionário';
COMMENT ON COLUMN public.staff.name IS 'Nome completo do funcionário';
COMMENT ON COLUMN public.staff.role IS 'Cargo ou função do funcionário';
COMMENT ON COLUMN public.staff.phone IS 'Telefone de contato';
COMMENT ON COLUMN public.staff.base_salary IS 'Salário base do funcionário';
COMMENT ON COLUMN public.staff.created_at IS 'Data de criação';
COMMENT ON COLUMN public.staff.updated_at IS 'Data da última atualização';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff(name);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_created_at ON public.staff(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write
DROP POLICY IF EXISTS "Users can manage staff" ON public.staff;
CREATE POLICY "Users can manage staff" ON public.staff
  FOR ALL USING (true)
  WITH CHECK (true);