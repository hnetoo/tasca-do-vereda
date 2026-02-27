import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔄 API: Loading owner data...');
    console.log('🔍 API: Request received at:', new Date().toISOString());
    
    const supabase = await createClient();
    console.log('🔍 API: Supabase client created');
    
    // Carregar orders
    console.log('🔍 API: Loading orders...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔍 API: Orders loaded:', { count: ordersData?.length || 0, error: ordersError?.message });
    
    // Carregar expenses
    console.log('🔍 API: Loading expenses...');
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    console.log('🔍 API: Expenses loaded:', { count: expensesData?.length || 0, error: expensesError?.message });
    
    // Carregar dishes
    console.log('🔍 API: Loading dishes...');
    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('available', true);
    
    console.log('🔍 API: Dishes loaded:', { count: dishesData?.length || 0, error: dishesError?.message });
    
    // Carregar categories
    console.log('🔍 API: Loading categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('name');
    
    console.log('🔍 API: Categories loaded:', { count: categoriesData?.length || 0, error: categoriesError?.message });
    
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
    
    // Se não houver dados, usar fallback
    if (result.orders.length === 0 && result.expenses.length === 0) {
      console.log('⚠️ API: No data found, using fallback');
      return NextResponse.json({
        test: 'API working but no data',
        timestamp: new Date().toISOString(),
        orders: [
          { id: 1, total: 150, created_at: new Date().toISOString(), status: 'completed', tableId: 'Mesa 1' },
          { id: 2, total: 250, created_at: new Date().toISOString(), status: 'completed', tableId: 'Mesa 2' }
        ],
        expenses: [
          { id: 1, amount: 75, description: 'Despesa teste', date: new Date().toISOString() },
          { id: 2, amount: 100, description: 'Despesa teste 2', date: new Date().toISOString() }
        ],
        dishes: [],
        categories: [],
        errors: null
      });
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
