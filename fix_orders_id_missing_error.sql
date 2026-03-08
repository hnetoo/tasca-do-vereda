-- FIX FOR ERROR: column "id" does not exist
-- SCRIPT ROBUSTO PARA CORRIGIR A TABELA 'orders'
-- Copie e cole TODO este bloco no Editor SQL do Supabase e execute.
-- Usa delimitador $do$ para evitar erros de "unterminated dollar-quoted string"

DO $do$
DECLARE
    id_column_type TEXT;
BEGIN
    -- 1. Criar tabela se não existir
    CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        items JSONB DEFAULT '[]'::jsonb,
        total NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'pending',
        order_number TEXT
    );

    -- 2. Adicionar coluna 'id' se faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'id') THEN
        ALTER TABLE public.orders ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;

    -- 3. Adicionar coluna 'items' se faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'items') THEN
        ALTER TABLE public.orders ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 4. Preencher IDs nulos (Verificando o tipo para evitar erros)
    SELECT data_type INTO id_column_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'id';
    
    IF id_column_type = 'uuid' THEN
        EXECUTE 'UPDATE public.orders SET id = gen_random_uuid() WHERE id IS NULL';
    ELSIF id_column_type = 'text' THEN
        EXECUTE 'UPDATE public.orders SET id = gen_random_uuid()::text WHERE id IS NULL';
    END IF;

    -- 5. Garantir PK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'orders' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.orders ADD PRIMARY KEY (id);
    END IF;
    
END $do$;