-- Verificar quais colunas já existem na tabela payroll
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;

-- Verificar se a tabela está vazia ou tem dados
SELECT COUNT(*) as total_registros FROM payroll;
