-- Add OWNER user
INSERT INTO public.employees (
    name,
    role,
    pin,
    is_active,
    created_at,
    updated_at
)
SELECT 
    'Proprietário',
    'OWNER',
    '2775',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.employees WHERE role = 'OWNER' OR pin = '2775'
);
