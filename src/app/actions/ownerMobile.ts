'use server';

import { createClient } from '@/lib/supabase/server';

export async function getOwnerMobileData() {
  const supabase = await createClient();
  
  try {
    // Carregar orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, updated_at')
      .order('created_at', { ascending: false });

    // Carregar expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('id, description, amount, category, date, created_at')
      .order('date', { ascending: false });

    // Carregar payroll
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false });

    // Carregar dishes
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('is_active', true);

    // Carregar categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true);

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
