'use server';

import { createClient } from '@/lib/supabase/server';

export async function createSampleData() {
  const supabase = await createClient();
  
  try {
    console.log('🔄 CRIANDO DADOS DE EXEMPLO PARA TESTE...');
    
    // 1. Criar pedidos de exemplo
    const sampleOrders = [
      {
        id: crypto.randomUUID(),
        table_id: 'table-1',
        status: 'completed',
        total: 50000, // 50.000 AKZ
        subtotal: 45000,
        tax: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            dish_id: '899a87f8-cf99-49c4-b736-6268196b1cb8',
            quantity: 2,
            price: 20000,
            total: 40000
          },
          {
            dish_id: '4c2b1fd6-d704-4764-8119-766c1f210c5c',
            quantity: 2,
            price: 600,
            total: 1200
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        table_id: 'table-2',
        status: 'completed',
        total: 78400, // 78.400 AKZ
        subtotal: 70000,
        tax: 8400,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          {
            dish_id: '899a87f8-cf99-49c4-b736-6268196b1cb8',
            quantity: 3,
            price: 20000,
            total: 60000
          },
          {
            dish_id: '4c2b1fd6-d704-4764-8119-766c1f210c5c',
            quantity: 4,
            price: 600,
            total: 2400
          }
        ]
      }
    ];
    
    // Inserir pedidos
    const { error: ordersError } = await supabase
      .from('orders')
      .insert(sampleOrders);
    
    if (ordersError) {
      console.error('❌ Erro ao criar pedidos:', ordersError);
    } else {
      console.log('✅ Pedidos criados:', sampleOrders.length);
    }
    
    // 2. Criar despesas de exemplo
    const sampleExpenses = [
      {
        id: crypto.randomUUID(),
        description: 'Compra de ingredientes',
        amount: 15000, // 15.000 AKZ
        category: 'food',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        description: 'Água e luz',
        amount: 8000, // 8.000 AKZ
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Inserir despesas
    const { error: expensesError } = await supabase
      .from('expenses')
      .insert(sampleExpenses);
    
    if (expensesError) {
      console.error('❌ Erro ao criar despesas:', expensesError);
    } else {
      console.log('✅ Despesas criadas:', sampleExpenses.length);
    }
    
    // 3. Criar registros de folha de exemplo (se tabela existir)
    const samplePayroll = [
      {
        id: crypto.randomUUID(),
        employee_id: 'emp-1',
        base_salary: 35000, // 35.000 AKZ
        net_salary: 32000, // 32.000 AKZ
        month: '2026-03',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Verificar se tabela existe antes de inserir
    const { data: tableCheck } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payroll_records');
    
    if (tableCheck && tableCheck.length > 0) {
      const { error: payrollError } = await supabase
        .from('payroll_records')
        .insert(samplePayroll);
      
      if (payrollError) {
        console.error('❌ Erro ao criar folha:', payrollError);
      } else {
        console.log('✅ Folha criada:', samplePayroll.length);
      }
    } else {
      console.log('⚠️ Tabela payroll_records não existe, pulando criação de folha');
    }
    
    console.log('✅ DADOS DE EXEMPLO CRIADOS COM SUCESSO!');
    console.log('📊 RESUMO:');
    console.log(`- Pedidos: ${sampleOrders.length} (Total: ${sampleOrders.reduce((sum, o) => sum + o.total, 0)} AKZ)`);
    console.log(`- Despesas: ${sampleExpenses.length} (Total: ${sampleExpenses.reduce((sum, e) => sum + e.amount, 0)} AKZ)`);
    console.log(`- Folha: ${samplePayroll.length} (Total: ${samplePayroll.reduce((sum, p) => sum + p.net_salary, 0)} AKZ)`);
    
    return {
      success: true,
      message: 'Dados de exemplo criados com sucesso',
      summary: {
        orders: sampleOrders.length,
        expenses: sampleExpenses.length,
        payroll: samplePayroll.length,
        totalRevenue: sampleOrders.reduce((sum, o) => sum + o.total, 0),
        totalExpenses: sampleExpenses.reduce((sum, e) => sum + e.amount, 0),
        totalPayroll: samplePayroll.reduce((sum, p) => sum + p.net_salary, 0)
      }
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
