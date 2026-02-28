import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('🔄 REAL API: Loading owner data...');
  console.log('🔍 REAL API: Request received at:', new Date().toISOString());
  
  try {
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 REAL API: SERVER-SIDE Supabase client created');
    
    // Carregar orders com SERVICE_ROLE_KEY (bypass RLS) - SEM FILTROS
    console.log('🔍 REAL API: Loading orders (NO FILTERS)...');
    
    // PRIMEIRO: Verificar estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    console.log('🔍 REAL API: Table structure check:', {
      hasData: !!tableInfo,
      sampleRow: tableInfo?.[0] || null,
      tableError: tableError?.message,
      columns: tableInfo?.[0] ? Object.keys(tableInfo[0]) : []
    });
    
    // AGORA: Carregar TODOS os pedidos sem filtros
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*');
      // REMOVIDO: .order('created_at', { ascending: false });
    
    console.log('🔍 REAL API: Orders loaded (NO FILTERS):', { 
      count: ordersData?.length || 0, 
      error: ordersError?.message,
      firstOrder: ordersData?.[0] || null,
      sampleColumns: ordersData?.[0] ? Object.keys(ordersData[0]) : []
    });
    
    // DEBUG DETALHADO: Mostrar estrutura dos pedidos
    if (ordersData && ordersData.length > 0) {
      console.log('🔍 DEBUG: Sample order structure:', ordersData[0]);
      const totalOrders = ordersData.reduce((sum, order) => {
        const total = order.total || order.amount || 0;
        console.log(`🔍 DEBUG: Order ${order.id} - total field: ${order.total}, amount field: ${order.amount}, using: ${total}`);
        return sum + total;
      }, 0);
      console.log('🔍 DEBUG: Orders count:', ordersData.length);
      console.log('🔍 DEBUG: Total amount:', totalOrders);
    }
    
    // Carregar expenses com SERVICE_ROLE_KEY (bypass RLS) - SEM FILTROS
    console.log('🔍 REAL API: Loading expenses (NO FILTERS)...');
    
    // PRIMEIRO: Verificar estrutura da tabela expenses
    const { data: expensesTableInfo, error: expensesTableError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    console.log('🔍 REAL API: Expenses table structure check:', {
      hasData: !!expensesTableInfo,
      sampleRow: expensesTableInfo?.[0] || null,
      tableError: expensesTableError?.message,
      columns: expensesTableInfo?.[0] ? Object.keys(expensesTableInfo[0]) : []
    });
    
    // AGORA: Carregar TODAS as despesas sem filtros
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*');
      // REMOVIDO: .order('date', { ascending: false });
    
    console.log('🔍 REAL API: Expenses loaded (NO FILTERS):', { 
      count: expensesData?.length || 0, 
      error: expensesError?.message,
      firstExpense: expensesData?.[0] || null,
      sampleColumns: expensesData?.[0] ? Object.keys(expensesData[0]) : []
    });
    
    // DEBUG DETALHADO: Mostrar estrutura das despesas
    if (expensesData && expensesData.length > 0) {
      console.log('🔍 DEBUG: Sample expense structure:', expensesData[0]);
      const totalExpenses = expensesData.reduce((sum, expense) => {
        const amount = expense.amount || expense.value || 0;
        console.log(`🔍 DEBUG: Expense ${expense.id} - amount field: ${expense.amount}, value field: ${expense.value}, using: ${amount}`);
        return sum + amount;
      }, 0);
      console.log('🔍 DEBUG: Expenses count:', expensesData.length);
      console.log('🔍 DEBUG: Total expenses amount:', totalExpenses);
    }
    
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
