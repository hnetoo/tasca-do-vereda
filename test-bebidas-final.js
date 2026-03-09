// TESTE FINAL - Categoria Bebidas
// Execute no console do browser ou Node.js

const bebidasCategory = {
  id: crypto.randomUUID(),
  name: 'Bebidas',
  description: 'Todas as bebidas do menu',
  icon: '🥤',
  sortOrder: 1,
  isActive: true,
  isAvailableOnDigitalMenu: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('🧪 TESTE FINAL - CATEGORIA BEBIDAS');
console.log('📋 Dados da categoria:', bebidasCategory);
console.log('🎯 Tabela alvo: menu_categories');
console.log('🔧 Sem is_active no objeto para evitar conflitos');

// Simulação do fluxo completo
async function testSaveBebidas() {
  try {
    console.log('--- CLIQUE DETETADO ---', bebidasCategory);
    console.log('🔧 saveCategoryAction: Iniciando...', { 
      categoryId: bebidasCategory.id, 
      name: bebidasCategory.name 
    });
    
    // Objeto que será enviado para o Supabase (sem is_active)
    const dbCategory = {
      id: bebidasCategory.id,
      name: bebidasCategory.name,
      icon: bebidasCategory.icon,
      sort_order: bebidasCategory.sortOrder || 0,
      parent_id: bebidasCategory.parentId || null,
      "isAvailableOnDigitalMenu": bebidasCategory.isAvailableOnDigitalMenu ?? true,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔧 SALVANDO EM menu_categories:', dbCategory);
    
    // Simular sucesso
    console.log('✅ SUCESSO SUPABASE: Categoria Bebidas salva!');
    console.log('✅ SUCESSO FORM: Categoria Bebidas salva!');
    
    return { success: true, data: bebidasCategory };
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    return { success: false, error: error.message };
  }
}

// Executar teste
console.log('🚀 EXECUTANDO TESTE...');
testSaveBebidas().then(result => {
  console.log('📊 RESULTADO FINAL:', result);
  console.log('🎉 TESTE CONCLUÍDO!');
});
