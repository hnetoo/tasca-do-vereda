// TESTE REAL DE PERSISTÊNCIA DE PRATOS
// Execute no console do browser para ver o erro real

import { directSupabaseService } from './src/services/directSupabaseService.js';

console.log('🚀 TESTE REAL DE PERSISTÊNCIA DE PRATOS');

// =====================================================
// 🍽️ TESTE: CRIAR PRATO COM CATEGORIA BEBIDAS
// =====================================================
async function testCreateDishReal() {
  console.log('\n🔍 TESTE: CRIAR PRATO COM CATEGORIA BEBIDAS');
  
  try {
    // 1. Buscar categorias para pegar ID da Bebidas
    console.log('📋 1. Buscando categorias...');
    const categoriesResult = await directSupabaseService.listCategories();
    
    if (!categoriesResult.success) {
      console.error('❌ ERRO AO BUSCAR CATEGORIAS:', categoriesResult.error);
      return;
    }
    
    console.log('✅ CATEGORIAS ENCONTRADAS:', categoriesResult.data.length);
    
    const bebidasCategory = categoriesResult.data.find(cat => cat.name === 'Bebidas');
    
    if (!bebidasCategory) {
      console.error('❌ CATEGORIA BEBIDAS NÃO ENCONTRADA!');
      console.log('📋 CATEGORIAS DISPONÍVEIS:');
      categoriesResult.data.forEach((cat, i) => {
        console.log(`  ${i+1}. ${cat.name} (ID: ${cat.id})`);
      });
      return;
    }
    
    console.log('✅ CATEGORIA BEBIDAS ENCONTRADA:', bebidasCategory);
    console.log('   ID:', bebidasCategory.id);
    
    // 2. Criar prato com categoria_id
    console.log('\n📋 2. Criando prato...');
    
    const newDish = {
      id: crypto.randomUUID(),
      name: 'Coca-Cola Lata',
      description: 'Refrigerante Coca-Cola 350ml',
      price: 350.00, // 3.50 AKZ em centavos
      cost_price: 200.00, // 2.00 AKZ em centavos
      category_id: bebidasCategory.id, // 🔥 IMPORTANTE: category_id em snake_case
      image_url: null,
      tax_code: null,
      tax_percentage: 14.0,
      preparation_time: 1,
      is_active: true,
      available: true,
      is_available_on_digital_menu: true,
      track_stock: false,
      stock_quantity: 100,
      min_stock_quantity: 10,
      max_stock_quantity: null,
      unit: 'unidade',
      supplier_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔧 DADOS DO PRATO:', newDish);
    console.log('🔧 category_id:', newDish.category_id);
    console.log('🔧 Tipo do category_id:', typeof newDish.category_id);
    console.log('🔧 category_id é UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(newDish.category_id));
    
    // 3. Inserir no Supabase diretamente
    console.log('\n📋 3. Inserindo no Supabase...');
    
    const { data, error } = await supabase
      .from('dishes')
      .insert(newDish)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO REAL DO SUPABASE:', error.message, error.details, error.hint);
      console.error('❌ CÓDIGO DO ERRO:', error.code);
      console.error('❌ DETALHES:', error);
      return;
    }

    console.log('✅ PRATO CRIADO COM SUCESSO:', data);
    console.log('📋 NOME:', data.name);
    console.log('📋 PREÇO:', data.price);
    console.log('📋 CATEGORIA_ID:', data.category_id);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('❌ MENSAGEM:', error.message);
    console.error('❌ STACK:', error.stack);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🚀 EXECUTAR TESTE
// =====================================================
console.log('🚀 EXECUTANDO TESTE REAL DE PERSISTÊNCIA...');
testCreateDishReal().then(result => {
  console.log('\n📊 RESULTADO FINAL:', result);
  
  if (result.success) {
    console.log('🎉 PRATO PERSISTIDO COM SUCESSO!');
  } else {
    console.log('❌ FALHA NA PERSISTÊNCIA - VERIFIQUE O ERRO ACIMA');
  }
  
  console.log('\n🏁 TESTE CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
