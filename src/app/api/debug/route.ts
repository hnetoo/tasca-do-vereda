import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Verificando estado completo do sistema...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Supabase not configured',
        details: {
          supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
          supabaseKey: supabaseServiceKey ? 'SET' : 'NOT SET'
        }
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar TODOS os dados com timestamps
    const [ordersResult, expensesResult, dishesResult, categoriesResult] = await Promise.all([
      // Orders com timestamp
      supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Expenses com timestamp
      supabaseAdmin
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Dishes
      supabaseAdmin
        .from('dishes')
        .select('*')
        .limit(10),
      
      // Categories
      supabaseAdmin
        .from('menu_categories')
        .select('*')
        .limit(10)
    ]);
    
    // Calcular totais
    const ordersTotal = ordersResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const expensesTotal = expensesResult.data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
    
    // Verificar se há dados recentes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentOrders = ordersResult.data?.filter(order => 
      new Date(order.created_at) > yesterday
    ) || [];
    
    const recentExpenses = expensesResult.data?.filter(expense => 
      new Date(expense.created_at) > yesterday
    ) || [];
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      
      // Resumo
      summary: {
        totalOrders: ordersResult.data?.length || 0,
        totalExpenses: expensesResult.data?.length || 0,
        totalDishes: dishesResult.data?.length || 0,
        totalCategories: categoriesResult.data?.length || 0,
        ordersValue: ordersTotal,
        expensesValue: expensesTotal,
        profit: ordersTotal - expensesTotal,
        recentOrders: recentOrders.length,
        recentExpenses: recentExpenses.length
      },
      
      // Dados completos
      data: {
        orders: {
          count: ordersResult.data?.length || 0,
          total: ordersTotal,
          recent: recentOrders.length,
          items: ordersResult.data || [],
          error: ordersResult.error?.message
        },
        expenses: {
          count: expensesResult.data?.length || 0,
          total: expensesTotal,
          recent: recentExpenses.length,
          items: expensesResult.data || [],
          error: expensesResult.error?.message
        },
        dishes: {
          count: dishesResult.data?.length || 0,
          items: dishesResult.data || [],
          error: dishesResult.error?.message
        },
        categories: {
          count: categoriesResult.data?.length || 0,
          items: categoriesResult.data || [],
          error: categoriesResult.error?.message
        }
      },
      
      // Informações de ambiente
      environment: {
        supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
        supabaseKey: supabaseServiceKey ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG Error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
