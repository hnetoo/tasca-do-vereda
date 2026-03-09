// TESTE SIMPLES - Produto com campos mínimos
// Execute no console do browser

import { directSupabaseService } from './src/services/directSupabaseService.js';

console.log('🚀 TESTE SIMPLES - Produto com campos mínimos');

// =====================================================
// 🍽️ TESTE: CRIAR PRODUTO SIMPLES
// =====================================================
async function testCreateSimpleDish() {
  console.log('\n🔍 TESTE: CRIAR PRODUTO SIMPLES');
  
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
    
    // 2. Criar produto SIMPLES - apenas campos essenciais
    const simpleDish = {
      id: crypto.randomUUID(),
      name: 'Refrigerante Lata',
      description: 'Refrigerante 350ml',
      price: 350.00, // 3.50 AKZ em centavos
      category_id: bebidasCategory.id, // 🎯 snake_case
      image_url: null,
      status: 'ACTIVE' // 🎯 status simples
    };
    
    console.log('🔧 DADOS DO PRODUTO SIMPLES:');
    console.log('🔧 CAMPOS ENVIADOS:', Object.keys(simpleDish));
    console.log('🔧 VALORES:', simpleDish);
    console.log('🔧 category_id (snake_case):', simpleDish.category_id);
    console.log('🔧 status:', simpleDish.status);
    
    // 3. Inserir no Supabase
    console.log('\n📋 INSERINDO NO SUPABASE...');
    
    const { data, error } = await supabase
      .from('dishes')
      .insert(simpleDish)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO DO SUPABASE:');
      console.log(JSON.stringify(error, null, 2)); // 🎯 LOG LIMPO COMPLETO
      return { success: false, error };
    }

    console.log('✅ PRODUTO CRIADO COM SUCESSO!');
    console.log('📋 ID:', data.id);
    console.log('📋 NOME:', data.name);
    console.log('📋 PREÇO:', data.price);
    console.log('📋 CATEGORY_ID:', data.category_id);
    console.log('📋 STATUS:', data.status);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    return { success: false, error };
  }
}

// =====================================================
// 🚀 EXECUTAR TESTE
// =====================================================
console.log('🚀 EXECUTANDO TESTE SIMPLES...');
testCreateSimpleDish().then(result => {
  console.log('\n📊 RESULTADO FINAL:');
  console.log('🍽️ Produto:', result.success ? '✅' : '❌');
  
  if (result.success) {
    console.log('\n🎉 PRODUTO SIMPLES CRIADO COM SUCESSO!');
    console.log('✅ Apenas campos essenciais');
    console.log('✅ Sem campos fantasma');
    console.log('✅ category_id snake_case');
    console.log('✅ status simples ACTIVE');
  } else {
    console.log('\n❌ FALHA AO CRIAR PRODUTO');
    console.log('🔍 Verifique o erro JSON acima');
  }
  
  console.log('\n🏁 TESTE SIMPLES CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
