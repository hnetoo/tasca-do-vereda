import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔄 API: Loading owner data...');
    console.log('🔍 API: Request received at:', new Date().toISOString());
    
    // Debug environment variables
    console.log('🔍 API: Environment check');
    console.log('🔍 API: SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔍 API: SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    // Criar cliente Supabase com persistência para mobile
    console.log('🔍 API: Creating Supabase client with mobile persistence...');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Melhor para mobile
          storage: {
            // Forçar storage compatível com mobile
            getItem: (key) => {
              console.log('🔍 API: Storage getItem:', key);
              return null; // Server-side não tem storage
            },
            setItem: (key, value) => {
              console.log('🔍 API: Storage setItem:', key);
            },
            removeItem: (key) => {
              console.log('🔍 API: Storage removeItem:', key);
            }
          }
        }
      }
    );
    
    console.log('🔍 API: Supabase client created with mobile persistence');
    
    // Testar conexão simples primeiro
    console.log('🔍 API: Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    console.log('🔍 API: Connection test result:', { testData, testError: testError?.message });
    
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    // Carregar orders sem filtros RLS
    console.log('🔍 API: Loading orders with SERVICE_ROLE_KEY...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔍 API: Orders loaded:', { count: ordersData?.length || 0, error: ordersError?.message });
    
    // Carregar expenses sem filtros RLS
    console.log('🔍 API: Loading expenses with SERVICE_ROLE_KEY...');
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    console.log('🔍 API: Expenses loaded:', { count: expensesData?.length || 0, error: expensesError?.message });
    
    const result = {
      orders: ordersData || [],
      expenses: expensesData || [],
      dishes: [],
      categories: [],
      errors: {
        orders: ordersError?.message,
        expenses: expensesError?.message
      }
    };
    
    console.log('✅ API: REAL data loaded with mobile persistence', {
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
    console.error('❌ API Error:', error);
    console.error('❌ API Error details:', error.message);
    console.error('❌ API Error stack:', error.stack);
    
    // Retornar erro claro para debugging
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Supabase mobile connection failed',
        orders: [],
        expenses: [],
        dishes: [],
        categories: []
      },
      { status: 500 }
    );
  }
}
