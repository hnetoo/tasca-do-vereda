import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔄 API: Loading owner data...');
    
    const supabase = await createClient();
    
    // Carregar orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Carregar expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    // Carregar dishes
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('available', true);
    
    // Carregar categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('name');
    
    const result = {
      orders: ordersData || [],
      expenses: expensesData || [],
      dishes: dishesData || [],
      categories: categoriesData || [],
      errors: {
        orders: ordersError?.message,
        expenses: expensesError?.message,
        dishes: dishesError?.message,
        categories: categoriesError?.message
      }
    };
    
    console.log('✅ API: Data loaded', {
      orders: result.orders.length,
      expenses: result.expenses.length,
      dishes: result.dishes.length,
      categories: result.categories.length
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
