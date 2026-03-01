import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  console.log('🔄 REAL API: Loading owner data...');
  console.log('🔍 REAL API: Request received at:', new Date().toISOString());
  
  try {
    // VALIDAR AUTENTICAÇÃO PRIMEIRO
    console.log('🔐 REAL API: Checking authentication...');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // Para API, precisamos extrair cookies do header
            const cookieHeader = request.headers.get('cookie');
            if (!cookieHeader) return undefined;
            
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
            
            return cookies[name];
          },
        },
      }
    );
    
    // Verificar sessão do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ REAL API: Unauthorized access attempt');
      return NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
          orders: [],
          expenses: [],
          dishes: [],
          categories: []
        },
        { status: 401 }
      );
    }
    
    console.log('✅ REAL API: User authenticated:', session.user.email);
    
    // VALIDAÇÃO DETALHADA DAS VARIÁVEIS DE AMBIENTE
    console.log('🔍 REAL API: Checking environment variables...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 REAL API: Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });
    
    if (!supabaseUrl) {
      const error = '❌ ERRO CRÍTICO: NEXT_PUBLIC_SUPABASE_URL não está configurada na Vercel';
      console.error(error);
      return NextResponse.json(
        { 
          error: error,
          details: 'Configure NEXT_PUBLIC_SUPABASE_URL no dashboard da Vercel',
          missing: 'NEXT_PUBLIC_SUPABASE_URL',
          orders: [],
          expenses: [],
          dishes: [],
          categories: []
        },
        { status: 500 }
      );
    }
    
    if (!supabaseServiceKey) {
      const error = '❌ ERRO CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não está configurada na Vercel';
      console.error(error);
      return NextResponse.json(
        { 
          error: error,
          details: 'Configure SUPABASE_SERVICE_ROLE_KEY no dashboard da Vercel',
          missing: 'SUPABASE_SERVICE_ROLE_KEY',
          orders: [],
          expenses: [],
          dishes: [],
          categories: []
        },
        { status: 500 }
      );
    }
    
    console.log('✅ REAL API: Environment variables validated successfully');
    
    // Criar cliente Supabase SERVER-SIDE com SERVICE_ROLE_KEY
    console.log('🔍 REAL API: Creating SERVER-SIDE Supabase client...');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 REAL API: SERVER-SIDE Supabase client created');
    
    // Carregar orders com SERVICE_ROLE_KEY - QUERY SIMPLES
    console.log('🔍 REAL API: Loading orders (SIMPLE QUERY)...');
    
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*');
    
    console.log('🔍 REAL API: Orders result:', { 
      count: ordersData?.length || 0, 
      error: ordersError?.message
    });
    
    // Carregar expenses com SERVICE_ROLE_KEY - QUERY SIMPLES
    console.log('🔍 REAL API: Loading expenses (SIMPLE QUERY)...');
    
    const { data: expensesData, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('*');
    
    console.log('🔍 REAL API: Expenses result:', { 
      count: expensesData?.length || 0, 
      error: expensesError?.message
    });
    
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
      message: 'DADOS REAIS DO SUPABASE',
      user: session.user.email
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
