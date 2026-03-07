-- RH ORGANIZATION SIMPLE - Sem Erros PL/pgSQL
-- Usa tabelas existentes e estabelece lógica de ligação

-- 1. VERIFICAR TABELAS EXISTENTES DO SISTEMA
SELECT 'TABELAS_EXISTENTES' as section,
       table_name,
       table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%employee%' 
        OR table_name ILIKE '%payroll%'
        OR table_name ILIKE '%escala%'
        OR table_name ILIKE '%user%'
        OR table_name ILIKE '%profile%'
    )
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA EMPLOYEES
SELECT 'EMPLOYEES_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE EXISTE TABELA PAYROLL
SELECT 'PAYROLL_CHECK' as section,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'payroll_records' 
           AND table_schema = 'public'
       ) THEN 'EXISTS' ELSE 'NOT_EXISTS' END as status;

-- 4. VERIFICAR ESTRUTURA DA TABELA PAYROLL (SE EXISTIR)
SELECT 'PAYROLL_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'payroll_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR TABELA DE ESCALAS
SELECT 'ESCALA_CHECK' as section,
       table_name as tabela_encontrada
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%escala%'
        OR table_name ILIKE '%schedule%'
        OR table_name ILIKE '%shift%'
    )
LIMIT 1;

-- 6. VERIFICAR ESTRUTURA DA TABELA USERS
SELECT 'USERS_STRUCTURE' as section,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. VERIFICAR LIGAÇÕES ATUAIS
SELECT 'LIGACOES_ATUAIS' as section,
       'employees' as tabela_principal,
       'id' as chave_primaria,
       'employee_id' as chave_estrangeira_recomendada;

-- 8. VERIFICAR SE PAYROLL TEM EMPLOYEE_ID
SELECT 'PAYROLL_EMPLOYEE_LINK' as section,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'payroll_records' 
           AND column_name ILIKE '%employee%'
           AND table_schema = 'public'
       ) THEN 'TEM_LIGACAO' ELSE 'SEM_LIGACAO' END as status;

-- 9. VERIFICAR SE ESCALAS TEM EMPLOYEE_ID
SELECT 'ESCALA_EMPLOYEE_LINK' as section,
       table_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = (
               SELECT table_name FROM information_schema.tables 
               WHERE table_schema = 'public'
                   AND (table_name ILIKE '%escala%' OR table_name ILIKE '%schedule%' OR table_name ILIKE '%shift%')
               LIMIT 1
           )
           AND column_name ILIKE '%employee%'
           AND table_schema = 'public'
       ) THEN 'TEM_LIGACAO' ELSE 'SEM_LIGACAO' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%escala%'
        OR table_name ILIKE '%schedule%'
        OR table_name ILIKE '%shift%'
    )
LIMIT 1;

-- 10. MOSTRAR DADOS EXISTENTES
SELECT 'DADOS_EMPLOYEES' as section,
       COUNT(*) as total_funcionarios
FROM employees;

-- 11. MOSTRAR DADOS PAYROLL (SE EXISTIR)
SELECT 'DADOS_PAYROLL' as section,
       COUNT(*) as total_registros
FROM payroll_records;

-- 12. RECOMENDAÇÕES FINAIS
SELECT 'RECOMENDACOES' as section,
       'RH_ORGANIZATION_SIMPLE' as action,
       'Usar tabelas existentes' as approach,
       'Adicionar employee_id em payroll_records' as rec_1,
       'Adicionar employee_id em escalas' as rec_2,
       'Manter login na tabela users' as rec_3,
       'Não modificar owner/mobile' as rec_4,
       'POS carrinho corrigido' as rec_5;
