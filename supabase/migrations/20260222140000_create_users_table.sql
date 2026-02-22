CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    role text NOT NULL,
    pin_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Opcional: Adicionar RLS (Row Level Security) se necessário
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);