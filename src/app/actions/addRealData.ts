'use server';

import { createClient } from '@/lib/supabase/server';

export async function addRealTestData() {
  const supabase = await createClient();
  
  try {
    // Adicionar receitas reais de hoje
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const { error: revError } = await supabase.from('revenues').insert([
      {
        id: `rev_real_${Date.now()}_1`,
        amount: 25000.00,
        description: 'Venda - Refeições do dia',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `rev_real_${Date.now()}_2`,
        amount: 12000.00,
        description: 'Venda - Bebidas e Petiscos',
        category: 'BAR',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `rev_real_${Date.now()}_3`,
        amount: 18500.00,
        description: 'Venda - Serviço completo',
        category: 'RESTAURANTE',
        date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (revError) throw revError;

    // Adicionar despesas reais de hoje
    const { error: expError } = await supabase.from('expenses').insert([
      {
        id: `exp_real_${Date.now()}_1`,
        amount: 5000.00,
        description: 'Compra de matéria-prima',
        category: 'FORNECEDORES',
        date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `exp_real_${Date.now()}_2`,
        amount: 2000.00,
        description: 'Limpeza e manutenção',
        category: 'SERVIÇOS',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (expError) throw expError;

    // Adicionar pedidos reais de hoje
    const { error: orderError } = await supabase.from('orders').insert([
      {
        id: `order_real_${Date.now()}_1`,
        table_id: 'table_1',
        status: 'FECHADO',
        total: 8500.00,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `order_real_${Date.now()}_2`,
        table_id: 'table_2',
        status: 'FECHADO',
        total: 15200.00,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `order_real_${Date.now()}_3`,
        table_id: 'table_3',
        status: 'FECHADO',
        total: 12300.00,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (orderError) throw orderError;

    return { 
      success: true, 
      message: 'Dados reais adicionados com sucesso! Dashboard irá atualizar em tempo real.' 
    };
  } catch (error: any) {
    console.error('Erro ao adicionar dados reais:', error);
    return { 
      success: false, 
      error: error.message || 'Falha ao adicionar dados' 
    };
  }
}
