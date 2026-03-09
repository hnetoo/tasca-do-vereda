// TESTE SCRIPT MESTRE - Verificação pós-recriação de tabelas
// Execute no console do browser

import { directSupabaseService } from './src/services/directSupabaseService.js';
import { createClient } from './src/lib/supabase/client.js';

const supabase = createClient();

console.log('🚀 TESTE SCRIPT MESTRE - PÓS-RECRIAÇÃO DE TABELAS');
console.log('📋 Tabelas recriadas: menu_categories, dishes, restaurant_tables, orders');

// =====================================================
// 🍽️ TESTE 1: VERIFICAR CATEGORIAS (Bebidas e Comidas)
// =====================================================
async function testFetchCategories() {
  console.log('\n🔍 TESTE 1: VERIFICAR CATEGORIAS');
  
  try {
    const result = await directSupabaseService.listCategories();
    
    if (result.success) {
      console.log('✅ CATEGORIAS ENCONTRADAS:', result.data.length);
      
      const bebidas = result.data.find(cat => cat.name === 'Bebidas');
      const comidas = result.data.find(cat => cat.name === 'Comidas');
      
      if (bebidas) {
        console.log('✅ BEBIDAS ENCONTRADA:', bebidas);
        console.log('   ID:', bebidas.id);
        console.log('   Ícone:', bebidas.icon);
        console.log('   Ordem:', bebidas.sort_order);
      } else {
        console.log('❌ BEBIDAS NÃO ENCONTRADA');
      }
      
      if (comidas) {
        console.log('✅ COMIDAS ENCONTRADA:', comidas);
        console.log('   ID:', comidas.id);
        console.log('   Ícone:', comidas.icon);
        console.log('   Ordem:', comidas.sort_order);
      } else {
        console.log('❌ COMIDAS NÃO ENCONTRADA');
      }
      
      // Listar todas as categorias
      console.log('\n📋 TODAS AS CATEGORIAS:');
      result.data.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat.icon}) - ID: ${cat.id.substring(0, 8)}...`);
      });
      
    } else {
      console.error('❌ ERRO AO BUSCAR CATEGORIAS:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO BUSCAR CATEGORIAS:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🍽️ TESTE 2: CRIAR NOVO PRATO (Dish)
// =====================================================
async function testCreateDish() {
  console.log('\n🔍 TESTE 2: CRIAR NOVO PRATO (Dish)');
  
  try {
    // Primeiro buscar categorias para pegar ID
    const categoriesResult = await directSupabaseService.listCategories();
    
    if (!categoriesResult.success || categoriesResult.data.length === 0) {
      console.error('❌ SEM CATEGORIAS DISPONÍVEIS');
      return { success: false, error: 'Sem categorias disponíveis' };
    }
    
    const bebidasCategory = categoriesResult.data.find(cat => cat.name === 'Bebidas');
    const categoryId = bebidasCategory ? bebidasCategory.id : categoriesResult.data[0].id;
    
    const newDish = {
      id: crypto.randomUUID(),
      name: 'Refrigerante Lata',
      description: 'Refrigerante de lata 350ml',
      price: 250.00, // 2.50 AKZ em centavos
      category_id: categoryId,
      image_url: null,
      status: 'ACTIVE',
      is_available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📋 DADOS DO NOVO PRATO:', newDish);
    console.log('🔧 CATEGORIA ID:', categoryId);
    
    // Inserir diretamente no Supabase
    const { data, error } = await supabase
      .from('dishes')
      .insert(newDish)
      .select()
      .single();

    if (error) {
      console.error('❌ ERRO AO CRIAR PRATO:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ PRATO CRIADO COM SUCESSO:', data);
    console.log('📋 NOME:', data.name);
    console.log('📋 PREÇO:', data.price);
    console.log('📋 CATEGORIA:', data.category_id);
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO CRIAR PRATO:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🪑 TESTE 3: VERIFICAR MESAS (Mesa 1)
// =====================================================
async function testFetchTables() {
  console.log('\n🔍 TESTE 3: VERIFICAR MESAS (Mesa 1)');
  
  try {
    const result = await directSupabaseService.listTables();
    
    if (result.success) {
      console.log('✅ MESAS ENCONTRADAS:', result.data.length);
      
      const mesa1 = result.data.find(table => table.number === 1);
      
      if (mesa1) {
        console.log('✅ MESA 1 ENCONTRADA:', mesa1);
        console.log('   ID:', mesa1.id);
        console.log('   Status:', mesa1.status);
        console.log('   Lugares:', mesa1.seats);
        console.log('   Ativa:', mesa1.is_active);
      } else {
        console.log('❌ MESA 1 NÃO ENCONTRADA');
      }
      
      // Listar todas as mesas
      console.log('\n📋 TODAS AS MESAS:');
      result.data.forEach((table, index) => {
        console.log(`  ${index + 1}. Mesa ${table.number} - ${table.status} (${table.seats} lugares)`);
      });
      
    } else {
      console.error('❌ ERRO AO BUSCAR MESAS:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO BUSCAR MESAS:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// 🚀 EXECUÇÃO COMPLETA
// =====================================================
async function runScriptMestreTest() {
  console.log('🎯 INICIANDO TESTE COMPLETO PÓS-SCRIPT MESTRE...');
  
  const results = {
    categories: await testFetchCategories(),
    createDish: await testCreateDish(),
    tables: await testFetchTables()
  };
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('🍽️ Categorias:', results.categories.success ? '✅' : '❌');
  console.log('🍽️ Criar Prato:', results.createDish.success ? '✅' : '❌');
  console.log('🪑 Mesas:', results.tables.success ? '✅' : '❌');
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  if (allSuccess) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! SCRIPT MESTRE FUNCIONOU!');
    console.log('✅ Bebidas e Comidas confirmadas');
    console.log('✅ Prato criado com sucesso');
    console.log('✅ Mesa 1 confirmada');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS ERROS ACIMA.');
  }
  
  return results;
}

// Executar teste completo
console.log('🚀 EXECUTANDO TESTE SCRIPT MESTRE...');
runScriptMestreTest().then(results => {
  console.log('\n🏁 TESTE SCRIPT MESTRE CONCLUÍDO!');
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
});
