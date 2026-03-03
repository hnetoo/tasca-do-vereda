-- Verificar estrutura da tabela payroll_records existente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payroll_records' AND table_schema = 'public'
ORDER BY ordinal_position;
