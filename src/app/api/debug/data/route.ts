import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  console.log('🔍 DEBUG: Checking data in all tables...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar orders
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*');
    
    // Verificar expenses
    const { data: expensesData, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('*');
    
    // Verificar dishes
    const { data: dishesData, error: dishesError } = await supabaseAdmin
      .from('dishes')
      .select('*');
    
    // Verificar menu_categories
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('menu_categories')
      .select('*');
    
    // Verificar payroll_records
    let payrollData = [];
    let payrollError = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('payroll_records')
        .select('*');
      
      payrollData = data || [];
      payrollError = error;
    } catch (e: any) {
      payrollError = e.message;
    }
    
    return NextResponse.json({
      orders: {
        count: ordersData?.length || 0,
        data: ordersData || [],
        error: ordersError?.message
      },
      expenses: {
        count: expensesData?.length || 0,
        data: expensesData || [],
        error: expensesError?.message
      },
      dishes: {
        count: dishesData?.length || 0,
        data: dishesData || [],
        error: dishesError?.message
      },
      categories: {
        count: categoriesData?.length || 0,
        data: categoriesData || [],
        error: categoriesError?.message
      },
      payroll: {
        count: payrollData?.length || 0,
        data: payrollData || [],
        error: payrollError?.message
      },
      summary: {
        totalOrders: ordersData?.length || 0,
        totalExpenses: expensesData?.length || 0,
        totalDishes: dishesData?.length || 0,
        totalCategories: categoriesData?.length || 0,
        totalPayroll: payrollData?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG Error:', error);
    return NextResponse.json({ error: error.message });
  }
}
