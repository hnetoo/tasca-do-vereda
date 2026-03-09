// TESTE IMEDIATO - AÇÃO DIRETA NO SUPABASE
// Sem abstrações, sem complicações
// Execute no console do browser

import { directSupabaseService } from './src/services/directSupabaseService.js';

console.log('🚀 TESTE IMEDIATO - AÇÃO DIRETA NO SUPABASE');
console.log('📋 Tabelas: menu_categories, dishes, restaurant_tables, orders, order_items');

// =====================================================
// 🪑 TESTE 1: LISTAR MESAS
// =====================================================
async function testListTables() {
  console.log('\n🔍 TESTE 1: LISTAR MESAS');
  const result = await directSupabaseService.listTables();
  
  if (result.success) {
    console.log('✅ MESAS ENCONTRADAS:', result.data.length);
    result.data.forEach((table, index) => {
      console.log(`  ${index + 1}. Mesa ${table.number} - ${table.status}`);
    });
  } else {
    console.error('❌ ERRO AO LISTAR MESAS:', result.error);
  }
  
  return result;
}

// =====================================================
// 🍽️ TESTE 2: CRIAR CATEGORIA 'BEBIDAS'
// =====================================================
async function testCreateBebidas() {
  console.log('\n🔍 TESTE 2: CRIAR CATEGORIA "BEBIDAS"');
  
  const bebidasCategory = {
    id: crypto.randomUUID(),
    name: 'Bebidas',
    description: 'Todas as bebidas do menu',
    icon: '🥤',
    sort_order: 1,
    parent_id: null,
    isAvailableOnDigitalMenu: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('📋 DADOS DA CATEGORIA:', bebidasCategory);
  
  const result = await directSupabaseService.createCategory(bebidasCategory);
  
  if (result.success) {
    console.log('✅ CATEGORIA "BEBIDAS" CRIADA COM SUCESSO!');
    console.log('📋 ID:', result.data.id);
    console.log('📋 NOME:', result.data.name);
  } else {
    console.error('❌ ERRO AO CRIAR CATEGORIA:', result.error);
  }
  
  return result;
}

// =====================================================
// 🍽️ TESTE 3: LISTAR CATEGORIAS
// =====================================================
async function testListCategories() {
  console.log('\n🔍 TESTE 3: LISTAR CATEGORIAS');
  const result = await directSupabaseService.listCategories();
  
  if (result.success) {
    console.log('✅ CATEGORIAS ENCONTRADAS:', result.data.length);
    result.data.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (${category.icon}) - Ordem: ${category.sort_order}`);
    });
  } else {
    console.error('❌ ERRO AO LISTAR CATEGORIAS:', result.error);
  }
  
  return result;
}

// =====================================================
// 🍽️ TESTE 4: LISTAR PRATOS
// =====================================================
async function testListDishes() {
  console.log('\n🔍 TESTE 4: LISTAR PRATOS');
  const result = await directSupabaseService.listDishes();
  
  if (result.success) {
    console.log('✅ PRATOS ENCONTRADOS:', result.data.length);
    result.data.forEach((dish, index) => {
      console.log(`  ${index + 1}. ${dish.name} - ${dish.price} AKZ`);
    });
  } else {
    console.error('❌ ERRO AO LISTAR PRATOS:', result.error);
  }
  
  return result;
}

// =====================================================
// 🚀 EXECUÇÃO COMPLETA
// =====================================================
async function runFullTest() {
  console.log('🎯 INICIANDO TESTE COMPLETO...');
  
  const results = {
    tables: await testListTables(),
    createBebidas: await testCreateBebidas(),
    categories: await testListCategories(),
    dishes: await testListDishes()
  };
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('🪑 Mesas:', results.tables.success ? '✅' : '❌');
  console.log('🥤 Bebidas:', results.createBebidas.success ? '✅' : '❌');
  console.log('📋 Categorias:', results.categories.success ? '✅' : '❌');
  console.log('🍽️ Pratos:', results.dishes.success ? '✅' : '❌');
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  if (allSuccess) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! O CAMINHO ESTÁ 100% LIMPO!');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS ERROS ACIMA.');
  }
  
  return results;
}

// Executar teste completo
console.log('🚀 EXECUTANDO TESTE IMEDIATO...');
runFullTest().then(results => {
  console.log('\n🏁 TESTE CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
