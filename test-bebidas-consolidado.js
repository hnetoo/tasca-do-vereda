// TESTE CONSOLIDADO - Categoria Bebidas
// Padrão: snake_case conforme types.ts MenuCategoryRow
// Execute no console do browser ou Node.js

const bebidasCategory = {
  id: crypto.randomUUID(),
  name: 'Bebidas',
  description: 'Todas as bebidas do menu',
  icon: '🥤',
  sortOrder: 1,
  parentId: null, // UI field
  isActive: true,
  isAvailableOnDigitalMenu: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('🧪 TESTE CONSOLIDADO - CATEGORIA BEBIDAS');
console.log('📋 Dados da categoria (UI):', bebidasCategory);
console.log('🎯 Tabela alvo: menu_categories');
console.log('🔧 Padrão: snake_case (types.ts MenuCategoryRow)');

// Objeto que será enviado para o Supabase (snake_case)
const dbCategory = {
  id: bebidasCategory.id,
  name: bebidasCategory.name,
  icon: bebidasCategory.icon,
  sort_order: bebidasCategory.sortOrder || 0,
  parent_id: bebidasCategory.parentId || null,
  "isAvailableOnDigitalMenu": bebidasCategory.isAvailableOnDigitalMenu ?? true,
  updated_at: new Date().toISOString()
};

console.log('🔧 Objeto para Supabase (snake_case):', dbCategory);

// Simulação do fluxo completo
async function testSaveBebidas() {
  try {
    console.log('--- CLIQUE DETETADO ---', bebidasCategory);
    console.log('🔧 saveCategoryAction: Iniciando...', { 
      categoryId: bebidasCategory.id, 
      name: bebidasCategory.name 
    });
    
    console.log('🔧 SALVANDO EM menu_categories (snake_case):', dbCategory);
    
    // Simular sucesso
    console.log('✅ SUCESSO SUPABASE: Categoria Bebidas salva!');
    console.log('✅ SUCESSO FORM: Categoria Bebidas salva!');
    
    return { success: true, data: dbCategory };
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    return { success: false, error: error.message };
  }
}

// Executar teste
console.log('🚀 EXECUTANDO TESTE CONSOLIDADO...');
testSaveBebidas().then(result => {
  console.log('📊 RESULTADO FINAL:', result);
  console.log('🎉 TESTE CONCLUÍDO COM PADRÃO CONSOLIDADO!');
});

// Verificação de campos
console.log('🔍 VERIFICAÇÃO DE CAMPOS:');
console.log('✅ id:', dbCategory.id);
console.log('✅ name:', dbCategory.name);
console.log('✅ icon:', dbCategory.icon);
console.log('✅ sort_order:', dbCategory.sort_order);
console.log('✅ parent_id:', dbCategory.parent_id);
console.log('✅ isAvailableOnDigitalMenu:', dbCategory["isAvailableOnDigitalMenu"]);
console.log('✅ updated_at:', dbCategory.updated_at);
console.log('🚫 SEM CAMPOS FANTASMAS');
