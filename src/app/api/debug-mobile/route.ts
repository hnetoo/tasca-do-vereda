import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 DEBUG MOBILE: Verificando tabelas...');
    
    // Contar registros em cada tabela
    const results: any = {};
    
    // Orders
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    results.orders = { count: ordersCount || 0, error: ordersError?.message };
    
    // Expenses  
    const { count: expensesCount, error: expensesError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    
    results.expenses = { count: expensesCount || 0, error: expensesError?.message };
    
    // Payroll
    const { count: payrollCount, error: payrollError } = await supabase
      .from('payroll_records')
      .select('*', { count: 'exact', head: true });
    
    results.payroll = { count: payrollCount || 0, error: payrollError?.message };
    
    // Dishes
    const { count: dishesCount, error: dishesError } = await supabase
      .from('dishes')
      .select('*', { count: 'exact', head: true });
    
    results.dishes = { count: dishesCount || 0, error: dishesError?.message };
    
    // Categories
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true });
    
    results.categories = { count: categoriesCount || 0, error: categoriesError?.message };
    
    // Buscar sample data de orders
    const { data: sampleOrders, error: sampleOrdersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    results.sampleOrders = { data: sampleOrders, error: sampleOrdersError?.message };
    
    console.log('🔍 DEBUG MOBILE: Resultados:', results);
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔍 DEBUG MOBILE: Erro:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
