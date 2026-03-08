-- SCRIPT DE CORREÇÃO FINAL PARA RESTANTES TABELAS
-- Execute este script no Supabase SQL Editor para corrigir:
-- menu_items, cash_shifts, payroll, daily_analytics e categorias

-- 1. MENU ITEMS (Itens do Menu)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(100),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CASH SHIFTS (Turnos de Caixa)
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL(12,2) DEFAULT 0,
    closing_balance DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que costumam faltar em cash_shifts
ALTER TABLE public.cash_shifts ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.cash_shifts ADD COLUMN IF NOT EXISTS opening_amount DECIMAL(12,2) DEFAULT 0;

-- 3. PAYROLL (Folha Salarial)
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT,
    month VARCHAR(20),
    year INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar todas as colunas financeiras necessárias em payroll
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS bonuses DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS deductions DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS net_salary DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255);
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS net_total DECIMAL(12,2) DEFAULT 0;

-- 4. DAILY ANALYTICS (Análise Diária)
CREATE TABLE IF NOT EXISTS public.daily_analytics (
    date DATE PRIMARY KEY,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    total_product_cost DECIMAL(10,2) DEFAULT 0,
    net_profit DECIMAL(10,2) DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CATEGORIAS (Garantir estrutura)
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    icon VARCHAR(100),
    parent_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_available_on_digital_menu BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CATEGORIA GERAL (Para evitar erros de FK em pratos)
DO $$
BEGIN
    -- Inserir categoria Geral se não existir
    INSERT INTO public.menu_categories (id, name, sort_order, is_active)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Geral', 999, true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Atualizar pratos sem categoria (se a tabela dishes existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN
        UPDATE public.dishes SET category_id = '00000000-0000-0000-0000-000000000001' WHERE category_id IS NULL;
    END IF;
END $$;

SELECT 'Todas as tabelas restantes foram verificadas e corrigidas!' as status;