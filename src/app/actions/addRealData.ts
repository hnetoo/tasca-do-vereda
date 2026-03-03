'use server';

import { createClient } from '@/lib/supabase/server';

export async function addRealTestData() {
  const supabase = await createClient();
  
  try {
    // Adicionar receitas reais de hoje
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const { error: revError } = await supabase
      .from('revenues')
      .insert([
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
        }
      ]);

    if (revError) {
      console.error('Erro ao adicionar receitas:', revError);
      return { success: false, error: revError };
    }

    // Adicionar despesas reais de hoje
    const { error: expError } = await supabase
      .from('expenses')
      .insert([
        {
          id: `exp_real_${Date.now()}_1`,
          description: 'Matéria-prima para cozinha',
          amount: 8500.00,
          category: 'ESTOQUE',
          date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `exp_real_${Date.now()}_2`,
          description: 'Limpeza e manutenção',
          amount: 3500.00,
          category: 'SERVIÇOS',
          date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (expError) {
      console.error('Erro ao adicionar despesas:', expError);
      return { success: false, error: expError };
    }

    // Adicionar pedidos reais de hoje
    const { error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          id: `order_real_${Date.now()}_1`,
          status: 'CLOSED',
          total: 8500.00,
          customer_name: 'Cliente Mesa 1',
          user_name: 'Garçom Teste',
          payment_method: 'CASH',
          notes: 'Pedido teste',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `order_real_${Date.now()}_2`,
          status: 'CLOSED',
          total: 4500.00,
          customer_name: 'Cliente Mesa 2',
          user_name: 'Garçom Teste',
          payment_method: 'MULTICA',
          notes: 'Pedido teste 2',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (orderError) {
      console.error('Erro ao adicionar pedidos:', orderError);
      return { success: false, error: orderError };
    }

    return { 
      success: true, 
      message: 'Dados reais adicionados com sucesso',
      data: {
        revenues: 2,
        expenses: 2,
        orders: 2
      }
    };

  } catch (error) {
    console.error('Erro geral em addRealTestData:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
