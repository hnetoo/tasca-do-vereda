// TESTE FINO SYNC - Verificação de colunas e persistência
// Execute no console do browser

import { directSupabaseService } from './src/services/directSupabaseService.js';

console.log('🚀 TESTE FINO SYNC - Verificação de colunas e persistência');

// =====================================================
// 🍽️ TESTE: VERIFICAR COLUNAS DA TABELA dishes
// =====================================================
async function testVerifyDishColumns() {
  console.log('\n🔍 TESTE: VERIFICAR COLUNAS DA TABELA dishes');
  
  try {
    // Buscar um prato existente para ver estrutura
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ ERRO AO BUSCAR PRATO:', error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const existingDish = data[0];
      console.log('✅ PRATO EXISTENTE ENCONTRADO');
      console.log('📋 COLUNAS DISPONÍVEIS:', Object.keys(existingDish));
      console.log('📋 ESTRUTURA COMPLETA:', existingDish);
      
      return { success: true, columns: Object.keys(existingDish), sample: existingDish };
    } else {
      console.log('ℹ️ NENHUM PRATO ENCONTRADO - TABELA VAZIA');
      
      // Tentar inserir um prato mínimo para descobrir colunas
      const minimalDish = {
        id: crypto.randomUUID(),
        name: 'TESTE COLUNAS',
        price: 100,
        created_at: new Date().toISOString()
      };
      
      console.log('🔧 TENTANDO INSERIR PRATO MÍNIMO:', minimalDish);
      
      const { data: insertData, error: insertError } = await supabase
        .from('dishes')
        .insert(minimalDish)
        .select()
        .single();

      if (insertError) {
        console.error('❌ ERRO AO INSERIR PRATO MÍNIMO:', insertError.message, insertError.details, insertError.hint);
        console.log('🔧 COLUNAS OBRIGATÓRIAS FALTANDO?');
        
        // Tentar descobrir colunas obrigatórias
        const requiredColumns = ['id', 'name', 'price'];
        console.log('📋 COLUNAS COMUNS QUE PODEM FALTAR:', requiredColumns);
        
        return { success: false, error: insertError.message, requiredColumns };
      }

      console.log('✅ PRATO MÍNIMO INSERIDO:', insertData);
      console.log('📋 COLUNAS DISPONÍVEIS:', Object.keys(insertData));
      
      // Remover prato de teste
      await supabase
        .from('dishes')
        .delete()
        .eq('id', insertData.id);
      
      return { success: true, columns: Object.keys(insertData), sample: insertData };
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🍽️ TESTE: CRIAR PRODUTO 'FINO'
// =====================================================
async function testCreateFino() {
  console.log('\n🔍 TESTE: CRIAR PRODUTO "FINO"');
  
  try {
    // 1. Buscar categoria Bebidas
    console.log('📋 1. Buscando categoria Bebidas...');
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
    
    // 2. Criar Fino apenas com colunas confirmadas
    console.log('\n📋 2. Criando Fino...');
    
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
      available: true, // 🔥 COLUNA ADICIONADA PELO USUÁRIO
      is_available_on_digital_menu: true,
      track_stock: false,
      stock_quantity: 50,
      min_stock_quantity: 5,
      max_stock_quantity: null,
      unit: 'garrafa',
      supplier_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔧 DADOS DO FINO:', finoDish);
    console.log('🔧 COLUNAS ENVIADAS:', Object.keys(finoDish));
    
    // 3. Inserir no Supabase
    console.log('\n📋 3. Inserindo Fino no Supabase...');
    
    const { data, error } = await supabase
      .from('dishes')
      .insert(finoDish)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO REAL DO SUPABASE:', error.message, error.details, error.hint);
      console.error('❌ CÓDIGO DO ERRO:', error.code);
      
      // Verificar se é erro de coluna
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('🔍 ERRO DE COLUNA DETETADO!');
        console.log('🔧 COLUNAS ENVIADAS:', Object.keys(finoDish));
        console.log('🔧 VERIFIQUE SE "available" EXISTE NA TABELA');
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ FINO CRIADO COM SUCESSO:', data);
    console.log('📋 NOME:', data.name);
    console.log('📋 PREÇO:', data.price);
    console.log('📋 CATEGORIA_ID:', data.category_id);
    console.log('📋 AVAILABLE:', data.available);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🚀 EXECUTAR TESTE COMPLETO
// =====================================================
async function runFinoSyncTest() {
  console.log('🎯 INICIANDO TESTE FINO SYNC...');
  
  // 1. Verificar colunas da tabela
  const columnCheck = await testVerifyDishColumns();
  
  if (columnCheck.success) {
    console.log('\n✅ COLUNAS VERIFICADAS:', columnCheck.columns);
  } else {
    console.log('\n❌ ERRO AO VERIFICAR COLUNAS:', columnCheck.error);
    return;
  }
  
  // 2. Tentar criar Fino
  const finoResult = await testCreateFino();
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('🔍 Colunas:', columnCheck.success ? '✅' : '❌');
  console.log('🍽️ Fino:', finoResult.success ? '✅' : '❌');
  
  if (finoResult.success) {
    console.log('\n🎉 FINO CRIADO COM SUCESSO!');
  } else {
    console.log('\n❌ FALHA AO CRIAR FINO - VERIFIQUE O ERRO ACIMA');
  }
  
  return { columnCheck, finoResult };
}

// Executar teste
console.log('🚀 EXECUTANDO TESTE FINO SYNC...');
runFinoSyncTest().then(results => {
  console.log('\n🏁 TESTE FINO SYNC CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
