// TESTE FINAL - Fino + Order Completo
// Execute no console do browser

import { directSupabaseService } from './src/services/directSupabaseService.js';

console.log('🚀 TESTE FINAL - Fino + Order Completo');

// =====================================================
// 🍽️ TESTE 1: CRIAR PRODUTO 'FINO'
// =====================================================
async function testCreateFino() {
  console.log('\n🔍 TESTE 1: CRIAR PRODUTO "FINO"');
  
  try {
    // 1. Buscar categoria Bebidas
    const categoriesResult = await directSupabaseService.listCategories();
    
    if (!categoriesResult.success) {
      console.error('❌ ERRO AO BUSCAR CATEGORIAS:', categoriesResult.error);
      return;
    }
    
    const bebidasCategory = categoriesResult.data.find(cat => cat.name === 'Bebidas');
    
    if (!bebidasCategory) {
      console.error('❌ CATEGORIA BEBIDAS NÃO ENCONTRADA!');
      return;
    }
    
    console.log('✅ CATEGORIA BEBIDAS ENCONTRADA:', bebidasCategory.id);
    
    // 2. Criar Fino com campos mínimos (sem supplier)
    const finoDish = {
      id: crypto.randomUUID(),
      name: 'Fino',
      description: 'Vinho fino tinto 750ml',
      price: 2500.00, // 25.00 AKZ em centavos
      cost_price: 1500.00, // 15.00 AKZ em centavos
      category_id: bebidasCategory.id,
      image_url: null,
      tax_code: null,
      tax_percentage: 14.0,
      preparation_time: 1,
      is_active: true,
      available: true,
      is_available_on_digital_menu: true,
      track_stock: false,
      stock_quantity: 50,
      min_stock_quantity: 5,
      max_stock_quantity: null,
      unit: 'garrafa',
      // SEM supplier_id - removido por ordem do usuário
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔧 DADOS DO FINO (SEM SUPPLIER):', finoDish);
    console.log('🔧 COLUNAS ENVIADAS:', Object.keys(finoDish));
    
    // 3. Inserir no Supabase
    const { data, error } = await supabase
      .from('dishes')
      .insert(finoDish)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO REAL DO SUPABASE:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log('✅ FINO CRIADO COM SUCESSO:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 📋 TESTE 2: FINALIZAR PEDIDO (Order)
// =====================================================
async function testFinalizeOrder() {
  console.log('\n🔍 TESTE 2: FINALIZAR PEDIDO (Order)');
  
  try {
    // 1. Buscar mesas
    const tablesResult = await directSupabaseService.listTables();
    
    if (!tablesResult.success) {
      console.error('❌ ERRO AO BUSCAR MESAS:', tablesResult.error);
      return;
    }
    
    const mesa1 = tablesResult.data.find(table => table.number === 1);
    
    if (!mesa1) {
      console.error('❌ MESA 1 NÃO ENCONTRADA!');
      return;
    }
    
    console.log('✅ MESA 1 ENCONTRADA:', mesa1.id);
    
    // 2. Criar pedido com campos confirmados
    const newOrder = {
      id: crypto.randomUUID(),
      order_number: 'ORD-' + Date.now(),
      status: 'CONCLUIDO',
      total: 2500.00, // 25.00 AKZ
      tax_total: 350.00, // 14% de 25.00
      table_id: mesa1.id,
      customer_id: null,
      user_id: null,
      user_name: 'Garçom',
      customer_name: 'Cliente Teste',
      customer_nif: null,
      shift_id: null,
      notes: 'Pedido teste - Fino',
      payment_method: 'CASH',
      split_payments: null,
      invoice_number: null,
      sub_account_name: 'Balcão',
      is_synced_agt: 0,
      agt_submission_uuid: null,
      hash: null,
      previous_hash: null,
      signature: null,
      jws_payload: null,
      closedAt: new Date().toISOString(), // ✅ closedAt adicionado pelo usuário
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: JSON.stringify([ // ✅ items como JSONB
        {
          id: crypto.randomUUID(),
          name: 'Fino',
          quantity: 1,
          unit_price: 2500.00,
          tax_percentage: 14.0,
          tax_amount: 350.00
        }
      ])
    };
    
    console.log('🔧 DADOS DO PEDIDO:', newOrder);
    console.log('🔧 COLUNAS ENVIADAS:', Object.keys(newOrder));
    console.log('🔧 ITEMS (JSONB):', newOrder.items);
    
    // 3. Inserir pedido no Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO REAL DO SUPABASE:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log('✅ PEDIDO FINALIZADO COM SUCESSO:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🚀 EXECUTAR TESTE COMPLETO
// =====================================================
async function runFinalTest() {
  console.log('🎯 INICIANDO TESTE FINAL COMPLETO...');
  
  const results = {
    fino: await testCreateFino(),
    order: await testFinalizeOrder()
  };
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('🍽️ Fino:', results.fino.success ? '✅' : '❌');
  console.log('📋 Order:', results.order.success ? '✅' : '❌');
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  if (allSuccess) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Fino criado sem supplier_id');
    console.log('✅ Order finalizado com closedAt e items JSONB');
    console.log('✅ Base de dados 100% compatível');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS ERROS ACIMA.');
  }
  
  return results;
}

// Executar teste completo
console.log('🚀 EXECUTANDO TESTE FINAL...');
runFinalTest().then(results => {
  console.log('\n🏁 TESTE FINAL CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
