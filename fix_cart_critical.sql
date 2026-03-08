-- CORREÇÃO CRÍTICA PARA O CARRINHO (BACKEND)
-- Execute isto para garantir que o banco de dados aceita os itens do carrinho
-- Isso evita que o frontend trave se estiver esperando resposta do banco

-- 1. Criar tabela order_items se não existir (MUITO IMPORTANTE)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    dish_id UUID,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    name VARCHAR(255), -- Adicionado para garantir que o nome do prato persista
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna 'items' JSONB na tabela orders (caso o frontend use esta estrutura)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- 3. Garantir que a tabela dishes existe (para referência de produtos)
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    price DECIMAL(10,2),
    category_id UUID,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true
);

-- 4. Permissões (RLS) para evitar bloqueios de segurança
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Allow all for order_items'
    ) THEN
        CREATE POLICY "Allow all for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

SELECT 'Tabelas de carrinho (order_items) verificadas e desbloqueadas.' as status;