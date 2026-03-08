-- DIAGNÓSTICO DE COLUNAS (PORTUGUÊS vs INGLÊS)
-- Este script verifica a estrutura da tabela payroll para identificar
-- inconsistências de idioma que podem quebrar a aplicação.

-- 1. Listar todas as colunas atuais para inspeção visual
SELECT 
    ordinal_position, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payroll' 
ORDER BY ordinal_position;

-- 2. Verificação automática de pares comuns (PT -> EN)
DO $$
BEGIN
    RAISE NOTICE '=== INÍCIO DO DIAGNÓSTICO ===';

    -- Verificar Descontos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name = 'descontos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name = 'deductions') THEN
            RAISE NOTICE '⚠️ PERIGO: Existe "descontos" mas falta "deductions". A app pode falhar.';
        ELSE
            RAISE NOTICE 'ℹ️ Info: Existem ambas "descontos" e "deductions". Verificar se os dados estão sincronizados.';
        END IF;
    END IF;

    -- Verificar Salário Base
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name IN ('salario_base', 'vencimento')) THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name = 'base_salary') THEN
            RAISE NOTICE '⚠️ PERIGO: Existe coluna de salário em PT mas falta "base_salary".';
        END IF;
    END IF;

    -- Verificar Líquido
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name IN ('liquido', 'valor_liquido', 'salario_liquido')) THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name IN ('net_salary', 'net_total')) THEN
            RAISE NOTICE '⚠️ PERIGO: Existe coluna de valor líquido em PT mas falta "net_salary" ou "net_total".';
        END IF;
    END IF;

    -- Verificar Estado/Status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name IN ('estado', 'situacao')) THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll' AND column_name = 'status') THEN
            RAISE NOTICE '⚠️ PERIGO: Existe "estado/situacao" mas falta "status".';
        END IF;
    END IF;

    RAISE NOTICE '=== FIM DO DIAGNÓSTICO ===';
END $$;