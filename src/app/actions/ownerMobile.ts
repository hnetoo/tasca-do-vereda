'use server';

import { createClient } from '@/lib/supabase/server';

export async function getOwnerMobileData() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 MOBILE SERVER ACTION: Buscando dados do banco...');
    
    // Carregar orders - BUSCAR TODOS OS CAMPOS
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Orders encontrados:', ordersData?.length || 0);

    // Carregar expenses - BUSCAR TODOS OS CAMPOS
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Expenses encontrados:', expensesData?.length || 0);

    // Carregar payroll - BUSCAR TODOS OS CAMPOS
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔍 MOBILE SERVER ACTION: Payroll encontrados:', payrollData?.length || 0);

    // Carregar dishes - BUSCAR TODOS OS CAMPOS
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('is_active', true);

    console.log('🔍 MOBILE SERVER ACTION: Dishes encontrados:', dishesData?.length || 0);

    // Carregar categories - BUSCAR TODOS OS CAMPOS
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true);

    console.log('🔍 MOBILE SERVER ACTION: Categories encontradas:', categoriesData?.length || 0);

    return {
      success: true,
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
      }
    };
  } catch (error) {
    console.error('Error in getOwnerMobileData:', error);
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
