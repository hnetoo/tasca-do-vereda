import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔄 API: Loading owner data...');
    console.log('🔍 API: Request received at:', new Date().toISOString());
    
    // TESTE: Retornar dados de teste primeiro para confirmar que funciona
    console.log('🧪 API: Returning test data to confirm mobile works...');
    
    const testData = {
      orders: [
        { id: 1, total: 150, created_at: new Date().toISOString(), status: 'completed', tableId: 'Mesa 1' },
        { id: 2, total: 250, created_at: new Date().toISOString(), status: 'completed', tableId: 'Mesa 2' }
      ],
      expenses: [
        { id: 1, amount: 75, description: 'Despesa real', date: new Date().toISOString() },
        { id: 2, amount: 100, description: 'Despesa real 2', date: new Date().toISOString() }
      ],
      dishes: [],
      categories: [],
      errors: null
    };
    
    console.log('✅ API: Test data returned for mobile');
    
    return NextResponse.json(testData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
    // Código Supabase comentado para teste
    /*
    // Usar SERVICE_ROLE_KEY para bypass RLS (test)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 API: Supabase client created with SERVICE_ROLE_KEY');
    
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
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    */
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
