'use server';

import { createClient } from '@/lib/supabase/server';

export async function addTestFinancialData() {
  const supabase = await createClient();
  
  try {
    // Inserir receitas de teste
    const { error: revError } = await supabase.from('revenues').upsert([
      {
        id: 'rev_test_1',
        amount: 15000.00,
        description: 'Venda do dia - Refeições',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'rev_test_2',
        amount: 8500.00,
        description: 'Bebidas e Petiscos',
        category: 'BAR',
        date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'rev_test_3',
        amount: 22000.00,
        description: 'Serviço completo',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'rev_test_4',
        amount: 12000.00,
        description: 'Almoço executivo',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'rev_test_5',
        amount: 18000.00,
        description: 'Jantar especial',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (revError) throw revError;

    // Inserir despesas de teste
    const { error: expError } = await supabase.from('expenses').upsert([
      {
        id: 'exp_test_1',
        amount: 3500.00,
        description: 'Compra de matéria-prima',
        category: 'FORNECEDORES',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'exp_test_2',
        amount: 1200.00,
        description: 'Limpeza e manutenção',
        category: 'SERVIÇOS',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'exp_test_3',
        amount: 800.00,
        description: 'Contas de utilities',
        category: 'FIXAS',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'exp_test_4',
        amount: 2500.00,
        description: 'Salários funcionários',
        category: 'PESSOAL',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'exp_test_5',
        amount: 600.00,
        description: 'Marketing e propaganda',
        category: 'MARKETING',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (expError) throw expError;

    // Inserir pedidos de teste
    const { error: orderError } = await supabase.from('orders').upsert([
      {
        id: 'order_test_1',
        table_id: 'table_1',
        status: 'FECHADO',
        total: 8500.00,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'order_test_2',
        table_id: 'table_2',
        status: 'FECHADO',
        total: 12000.00,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'order_test_3',
        table_id: 'table_3',
        status: 'FECHADO',
        total: 15000.00,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'order_test_4',
        table_id: 'table_4',
        status: 'FECHADO',
        total: 9200.00,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'order_test_5',
        table_id: 'table_5',
        status: 'FECHADO',
        total: 18500.00,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (orderError) throw orderError;

    return { success: true, message: 'Dados de teste adicionados com sucesso' };
  } catch (error: any) {
    console.error('Erro ao adicionar dados de teste:', error);
    return { success: false, error: error.message };
  }
}
