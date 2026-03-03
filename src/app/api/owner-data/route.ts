import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      const response = await fetch('/api/owner-data');
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
          payroll: [],
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
      keyLength: supabaseServiceKey?.length || 0,
      url: supabaseUrl,
      keyPrefix: supabaseServiceKey?.substring(0, 20) + '...'
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
          payroll: [],
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
          payroll: [],
          dishes: [],
          categories: []
        },
        { status: 500 }
      );
    }
    
    console.log('✅ REAL API: Environment variables validated successfully');
    
    // Criar cliente Supabase SERVER-SIDE com SERVICE_ROLE_KEY
    console.log('🔍 REAL API: Creating SERVER-SIDE Supabase client...');
    
    const supabaseAdmin = await createClient();
    
    console.log('🔍 REAL API: SERVER-SIDE Supabase client created');
    
    // Carregar orders COM ESTRUTURA EXATA DA PRODUÇÃO
    console.log('🔍 REAL API: Loading orders (PRODUCTION STRUCTURE)...');
    
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, status, total, created_at, updated_at'); // SÓ CAMPOS QUE EXISTEM NA PRODUÇÃO
    
    console.log('🔍 REAL API: Orders result:', { 
      count: ordersData?.length || 0, 
      error: ordersError?.message
    });
    
    // Carregar expenses COM ESTRUTURA EXATA DA PRODUÇÃO
    console.log('🔍 REAL API: Loading expenses (PRODUCTION STRUCTURE)...');
    
    const { data: expensesData, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id, description, amount, category, date, created_at'); // SÓ CAMPOS QUE EXISTEM NA PRODUÇÃO
    
    console.log('🔍 REAL API: Expenses result:', { 
      count: expensesData?.length || 0, 
      error: expensesError?.message
    });

    // Carregar dishes COM ESTRUTURA EXATA DA PRODUÇÃO
    console.log('🔍 REAL API: Loading dishes (PRODUCTION STRUCTURE)...');
    
    const { data: dishesData, error: dishesError } = await supabaseAdmin
      .from('dishes')
      .select('id, name, price, description, category_id, image_url, available, is_active, is_available_on_digital_menu, tax_percentage, tax_code, preparation_time, track_stock, stock_quantity, min_stock_quantity, max_stock_quantity, supplier_id, unit, cost_price, created_at, updated_at, user_id, status'); // ESTRUTURA COMPLETA DA PRODUÇÃO
    
    console.log('🔍 REAL API: Dishes result:', { 
      count: dishesData?.length || 0, 
      error: dishesError?.message
    });

    // Carregar categories COM ESTRUTURA EXATA DA PRODUÇÃO
    console.log('🔍 REAL API: Loading menu_categories (PRODUCTION STRUCTURE)...');
    
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('menu_categories')
      .select('id, name, description, image_url, is_active, created_at, updated_at'); // ESTRUTURA EXATA DA PRODUÇÃO
    
    console.log('🔍 REAL API: Categories result:', { 
      count: categoriesData?.length || 0, 
      error: categoriesError?.message
    });

    // Carregar payroll com SERVICE_ROLE_KEY - QUERY SIMPLES
    console.log('🔍 REAL API: Loading payroll_records (SIMPLE QUERY)...');
    
    // Primeiro verificar se tabela existe
    const { data: tableExists, error: tableCheckError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payroll_records');
    
    console.log('🔍 REAL API: Payroll_records table exists:', { 
      exists: tableExists && tableExists.length > 0, 
      error: tableCheckError?.message
    });
    
    let payrollData = [];
    let payrollError = null;
    
    if (tableExists && tableExists.length > 0) {
      const { data: data, error } = await supabaseAdmin
        .from('payroll_records')
        .select('*');
      
      payrollData = data || [];
      payrollError = error;
    } else {
      console.log('🔍 REAL API: Payroll_records table does not exist, skipping...');
      payrollError = 'Table payroll_records does not exist';
    }
    
    console.log('🔍 REAL API: Payroll_records result:', { 
      count: payrollData?.length || 0, 
      error: payrollError ? String(payrollError) : null
    });
    
    const result = {
      orders: ordersData || [],
      expenses: expensesData || [],
      payroll: payrollData || [],
      dishes: dishesData || [],
      categories: categoriesData || [],
      errors: {
        orders: ordersError ? String(ordersError) : null,
        expenses: expensesError ? String(expensesError) : null,
        dishes: dishesError ? String(dishesError) : null,
        categories: categoriesError ? String(categoriesError) : null,
        payroll: payrollError ? String(payrollError) : null
      },
      realData: true,
      message: 'DADOS REAIS DO SUPABASE',
      authenticated: true
    };
    
    console.log('✅ REAL API: REAL data loaded', {
      orders: result.orders.length,
      expenses: result.expenses.length,
      dishes: result.dishes.length,
      categories: result.categories.length,
      payroll: result.payroll.length
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
        payroll: [],
        dishes: [],
        categories: [],
        realData: false
      },
      { status: 500 }
    );
  }
}
