'use server';

import { createClient } from '@/lib/supabase/server';

export async function getOwnerMobileData(cacheParam?: string) {
  const supabase = await createClient();
  
  try {
    console.log('🔍 MOBILE SERVER ACTION: Buscando dados do banco...', cacheParam);
    
    // CARREGAR REVENUES (TABELA CORRETA PARA VENDAS)
    const { data: revenuesData, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .order('date', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Revenues encontrados:', revenuesData?.length || 0);

    // Carregar expenses - BUSCAR TODOS OS CAMPOS
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Expenses encontrados:', expensesData?.length || 0);

    // Carregar payroll - BUSCAR DA TABELA PAYROLL
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Payroll encontrados:', payrollData?.length || 0);

    // Carregar dishes e categories - USAR NOMES CORRETOS
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*');

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    console.log('🔍 MOBILE SERVER ACTION: Categories encontradas:', categoriesData?.length || 0);

    return {
      success: true,
      revenues: revenuesData || [],  // TROCAR ORDERS POR REVENUES
      expenses: expensesData || [],
      payroll: payrollData || [],
      dishes: dishesData || [],
      categories: categoriesData || [],
      errors: {
        revenues: revenuesError ? String(revenuesError) : null,  // TROCAR ORDERS POR REVENUES
        expenses: expensesError ? String(expensesError) : null,
        payroll: payrollError ? String(payrollError) : null,
        dishes: dishesError ? String(dishesError) : null,
        categories: categoriesError ? String(categoriesError) : null
      }
    };
  } catch (error) {
    console.error('Error in getOwnerMobileData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      revenues: [],  // TROCAR ORDERS POR REVENUES
      expenses: [],
      payroll: [],
      dishes: [],
      categories: []
    };
  }
}
