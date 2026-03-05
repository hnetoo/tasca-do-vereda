-- Create payroll table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  valor_base NUMERIC DEFAULT 0,
  subsidios NUMERIC DEFAULT 0,
  descontos NUMERIC DEFAULT 0,
  total_liquido NUMERIC GENERATED ALWAYS AS (valor_base + subsidios - descontos) STORED,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.payroll IS 'Tabela de folha salarial da Tasca do Vereda';
COMMENT ON COLUMN public.payroll.id IS 'Identificador único do registro';
COMMENT ON COLUMN public.payroll.staff_id IS 'ID do funcionário (foreign key)';
COMMENT ON COLUMN public.payroll.mes_referencia IS 'Mês de referência (YYYY-MM)';
COMMENT ON COLUMN public.payroll.valor_base IS 'Valor base do salário';
COMMENT ON COLUMN public.payroll.subsidios IS 'Valor dos subsídios';
COMMENT ON COLUMN public.payroll.descontos IS 'Valor dos descontos';
COMMENT ON COLUMN public.payroll.total_liquido IS 'Total líquido (calculado automaticamente)';
COMMENT ON COLUMN public.payroll.status IS 'Status do pagamento';
COMMENT ON COLUMN public.payroll.created_at IS 'Data de criação';
COMMENT ON COLUMN public.payroll.updated_at IS 'Data da última atualização';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON public.payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_mes ON public.payroll(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write
DROP POLICY IF EXISTS "Users can manage payroll" ON public.payroll;
CREATE POLICY "Users can manage payroll" ON public.payroll
  FOR ALL USING (true)
  WITH CHECK (true);