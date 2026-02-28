import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('🔄 REAL API: Loading owner data...');
  console.log('🔍 REAL API: Request received at:', new Date().toISOString());
  
  try {
    // Criar cliente Supabase SERVER-SIDE com SERVICE_ROLE_KEY
    console.log('🔍 REAL API: Creating SERVER-SIDE Supabase client...');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 REAL API: SERVER-SIDE Supabase client created');
    
    // Carregar orders com SERVICE_ROLE_KEY (bypass RLS)
    console.log('🔍 REAL API: Loading orders...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔍 REAL API: Orders loaded:', { count: ordersData?.length || 0, error: ordersError?.message });
    
    // Carregar expenses com SERVICE_ROLE_KEY (bypass RLS)
    console.log('🔍 REAL API: Loading expenses...');
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    console.log('🔍 REAL API: Expenses loaded:', { count: expensesData?.length || 0, error: expensesError?.message });
    
    const result = {
      orders: ordersData || [],
      expenses: expensesData || [],
      dishes: [],
      categories: [],
      errors: {
        orders: ordersError?.message,
        expenses: expensesError?.message
      },
      realData: true,
      message: 'DADOS REAIS DO SUPABASE'
    };
    
    console.log('✅ REAL API: REAL data loaded', {
      orders: result.orders.length,
      expenses: result.expenses.length
    });
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error: any) {
    console.error('❌ REAL API Error:', error);
    console.error('❌ REAL API Error details:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message,
        orders: [],
        expenses: [],
        dishes: [],
        categories: [],
        realData: false
      },
      { status: 500 }
    );
  }
}
