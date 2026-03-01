import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  console.log('🔄 REAL API: Loading owner data...');
  console.log('🔍 REAL API: Request received at:', new Date().toISOString());
  
  try {
    // VALIDAR AUTENTICAÇÃO MOCK + OWNER
    console.log('🔐 REAL API: Checking authentication...');
    
    const cookieHeader = request.headers.get('cookie');
    let isAuthenticated = false;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      // Verificar autenticação normal (tasca_auth_token)
      const authCookie = cookies['tasca_auth_token'];
      if (authCookie) {
        try {
          const decoded = JSON.parse(decodeURIComponent(authCookie));
          isAuthenticated = decoded && decoded.role;
          console.log('✅ REAL API: User authenticated with role:', decoded.role);
        } catch (error) {
          console.error('❌ REAL API: Invalid auth cookie format');
        }
      }
      
      // Verificar autenticação owner (owner_authenticated)
      const ownerCookie = cookies['owner_authenticated'];
      if (ownerCookie === 'true') {
        isAuthenticated = true;
        console.log('✅ REAL API: Owner authenticated via owner_authenticated cookie');
      }
    }
    
    if (!isAuthenticated) {
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
      authenticated: true
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
