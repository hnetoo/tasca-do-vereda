-- Add permissions column to employees table for granular access control
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS permissions TEXT[];

-- Update RLS policies if necessary (usually existing policies cover updates if they use ALL or UPDATE)
-- "Admins/Owners can do everything on employees" covers it.
