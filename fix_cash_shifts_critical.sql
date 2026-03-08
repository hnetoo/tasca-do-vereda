-- CORREÇÃO CRÍTICA: Adicionar coluna 'notes' em cash_shifts
-- Este é o erro exato que está nos seus logs e bloqueia o carrinho

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_shifts' AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.cash_shifts ADD COLUMN notes TEXT DEFAULT '';
        RAISE NOTICE 'Coluna notes adicionada com sucesso.';
    END IF;
END $$;

-- Forçar atualização do cache do schema do Supabase
NOTIFY pgrst, 'reload config';