import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('🚨 EMERGENCY SYNC: Starting mass upload from localStorage...');
  
  try {
    // VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Environment variables missing',
        details: 'Configure SUPABASE variables in Vercel',
        success: false
      }, { status: 500 });
    }

    // Criar cliente Supabase com SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dados de emergência do localStorage (simulado)
    // Na prática, estes dados viriam do frontend
    const emergencyData = {
      message: 'Função de emergência criada com sucesso',
      instructions: [
        '1. Abra o console do navegador no PC',
        '2. Execute: localStorage.getItem("tasca-vereda-storage-v2")',
        '3. Copie os dados e envie para este endpoint',
        '4. Os dados serão processados e inseridos no Supabase'
      ],
      endpoint: '/api/emergency-sync',
      method: 'POST',
      expectedFormat: {
        orders: 'Array de pedidos do localStorage',
        dishes: 'Array de pratos do localStorage',
        expenses: 'Array de despesas do localStorage'
      }
    };

    console.log('✅ EMERGENCY SYNC: Function created successfully');
    
    return NextResponse.json({
      success: true,
      ...emergencyData
    });

  } catch (error: any) {
    console.error('❌ EMERGENCY SYNC Error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.log('🚨 EMERGENCY SYNC: Processing mass upload...');
  
  try {
    // VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Environment variables missing',
        success: false
      }, { status: 500 });
    }

    // Criar cliente Supabase com SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Receber dados do frontend
    const body = await request.json();
    console.log('📦 EMERGENCY SYNC: Received data:', { 
      ordersCount: body.orders?.length || 0,
      dishesCount: body.dishes?.length || 0,
      expensesCount: body.expenses?.length || 0
    });

    const results = {
      orders: { success: 0, failed: 0, errors: [] as string[] },
      dishes: { success: 0, failed: 0, errors: [] as string[] },
      expenses: { success: 0, failed: 0, errors: [] as string[] }
    };

    // Processar ORDERS
    if (body.orders && Array.isArray(body.orders)) {
      for (const order of body.orders) {
        try {
          const supabaseOrder = {
            id: order.id,
            table_id: order.tableId || 'unknown',
            status: order.status || 'completed',
            total: order.total || 0,
            customer_name: order.customerName || '',
            items: JSON.stringify(order.items || []),
            created_at: order.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('orders')
            .upsert(supabaseOrder, { onConflict: 'id' });

          if (error) {
            results.orders.failed++;
            results.orders.errors.push(`Order ${order.id}: ${error.message}`);
          } else {
            results.orders.success++;
          }
        } catch (error: any) {
          results.orders.failed++;
          results.orders.errors.push(`Order ${order.id}: ${error.message}`);
        }
      }
    }

    // Processar EXPENSES
    if (body.expenses && Array.isArray(body.expenses)) {
      for (const expense of body.expenses) {
        try {
          const supabaseExpense = {
            id: expense.id,
            amount: expense.amount || 0,
            description: expense.description || '',
            category: expense.category || 'other',
            date: expense.date || new Date().toISOString(),
            created_at: expense.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('expenses')
            .upsert(supabaseExpense, { onConflict: 'id' });

          if (error) {
            results.expenses.failed++;
            results.expenses.errors.push(`Expense ${expense.id}: ${error.message}`);
          } else {
            results.expenses.success++;
          }
        } catch (error: any) {
          results.expenses.failed++;
          results.expenses.errors.push(`Expense ${expense.id}: ${error.message}`);
        }
      }
    }

    console.log('✅ EMERGENCY SYNC: Process completed', results);

    return NextResponse.json({
      success: true,
      message: 'Mass upload completed',
      results,
      totalProcessed: results.orders.success + results.dishes.success + results.expenses.success,
      totalFailed: results.orders.failed + results.dishes.failed + results.expenses.failed
    });

  } catch (error: any) {
    console.error('❌ EMERGENCY SYNC Error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}
