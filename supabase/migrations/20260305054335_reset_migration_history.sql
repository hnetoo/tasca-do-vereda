-- Reset migration history to fix conflicts
DELETE FROM supabase_migrations.schema_migrations WHERE version LIKE '202603%';

-- Insert our new migrations as applied
INSERT INTO supabase_migrations.schema_migrations (version, name, statements, rolled_back_at)
VALUES 
  ('20260305054116', 'create_staff_table', '', NULL),
  ('20260305054134', 'create_payroll_table', '', NULL);