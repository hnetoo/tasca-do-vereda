-- Configurar Realtime para todas as tabelas (versão final simplificada)
-- Adicionar tabelas ao realtime uma por uma com tratamento de erro

DO $$
BEGIN
    -- Orders
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Dishes
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Menu Categories
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Expenses
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Revenues
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE revenues;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Employees
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE employees;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Cash Shifts
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Restaurant Tables
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Customers
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE customers;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Transactions
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;
