'use server';

import { createClient } from '@/lib/supabase/server';

export async function getOwnerMobileData() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 MOBILE: Loading orders (PRODUCTION STRUCTURE)...');
    
    // Carregar orders COM ESTRUTURA EXATA DA PRODUÇÃO (igual ao desktop)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, updated_at'); // SÓ CAMPOS QUE EXISTEM NA PRODUÇÃO
    
    console.log('🔍 MOBILE: Orders result:', { 
      count: ordersData?.length || 0, 
      error: ordersError?.message
    });
    
    console.log('🔍 MOBILE: Loading expenses (PRODUCTION STRUCTURE)...');
    
    // Carregar expenses COM ESTRUTURA EXATA DA PRODUÇÃO (igual ao desktop)
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('id, description, amount, category, date, created_at'); // SÓ CAMPOS QUE EXISTEM NA PRODUÇÃO
    
    console.log('🔍 MOBILE: Expenses result:', { 
      count: expensesData?.length || 0, 
      error: expensesError?.message
    });
    
    console.log('🔍 MOBILE: Loading payroll_records (SIMPLE QUERY)...');
    
    // Verificar se tabela existe e carregar payroll (igual ao desktop)
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payroll_records');
    
    console.log('🔍 MOBILE: Payroll_records table exists:', { 
      exists: tableExists && tableExists.length > 0, 
      error: tableCheckError?.message
    });
    
    let payrollData = [];
    let payrollError = null;
    
    if (tableExists && tableExists.length > 0) {
      const { data: data, error } = await supabase
        .from('payroll_records')
        .select('*');
      
      payrollData = data || [];
      payrollError = error;
    } else {
      console.log('🔍 MOBILE: Payroll_records table does not exist, skipping...');
      payrollError = 'Table payroll_records does not exist';
    }
    
    console.log('🔍 MOBILE: Payroll_records result:', { 
      count: payrollData?.length || 0, 
      error: payrollError ? String(payrollError) : null
    });
    
    console.log('🔍 MOBILE: Loading dishes (PRODUCTION STRUCTURE)...');
    
    // Carregar dishes COM ESTRUTURA EXATA DA PRODUÇÃO (igual ao desktop)
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('id, name, price, description, category_id, image_url, available, is_active, is_available_on_digital_menu, tax_percentage, tax_code, preparation_time, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, supplier_id, unit, cost_price, created_at, updated_at, user_id, status'); // ESTRUTURA COMPLETA DA PRODUÇÃO
    
    console.log('🔍 MOBILE: Dishes result:', { 
      count: dishesData?.length || 0, 
      error: dishesError?.message
    });
    
    console.log('🔍 MOBILE: Loading menu_categories (PRODUCTION STRUCTURE)...');
    
    // Carregar categories COM ESTRUTURA EXATA DA PRODUÇÃO (igual ao desktop)
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id, name, description, image_url, is_active, created_at, updated_at'); // ESTRUTURA EXATA DA PRODUÇÃO
    
    console.log('🔍 MOBILE: Categories result:', { 
      count: categoriesData?.length || 0, 
      error: categoriesError?.message
    });

    const result = {
      orders: ordersData || [],
      expenses: expensesData || [],
      payroll: payrollData || [],
      dishes: dishesData || [],
      categories: categoriesData || [],
      errors: {
        orders: ordersError ? String(ordersError) : null,
        expenses: expensesError ? String(expensesError) : null,
        payroll: payrollError ? String(payrollError) : null,
        dishes: dishesError ? String(dishesError) : null,
        categories: categoriesError ? String(categoriesError) : null
      },
      realData: true,
      message: 'DADOS REAIS DO SUPABASE (MOBILE)',
      authenticated: true
    };
    
    console.log('✅ MOBILE: REAL data loaded', {
      orders: result.orders.length,
      expenses: result.expenses.length,
      dishes: result.dishes.length,
      categories: result.categories.length,
      payroll: result.payroll.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ MOBILE Error:', error);
    console.error('❌ MOBILE Error details:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      orders: [],
      expenses: [],
      payroll: [],
      dishes: [],
      categories: []
    };
  }
}
