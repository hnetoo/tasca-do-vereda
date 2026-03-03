-- RPC para LIMPAR TUDO do banco de dados
CREATE OR REPLACE FUNCTION clear_all_production_data()
RETURNS TABLE(
  orders_cleared integer,
  expenses_cleared integer,
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_count integer;
  expenses_count integer;
BEGIN
  -- Contar registros antes de limpar
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO expenses_count FROM expenses;
  
  -- Limpar TUDO com CASCADE para remover dependências
  EXECUTE 'TRUNCATE TABLE orders, expenses CASCADE';
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    orders_count,
    expenses_count,
    true,
    'All production data cleared successfully'::text;
END;
$$;
