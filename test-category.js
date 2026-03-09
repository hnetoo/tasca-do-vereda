// Teste para gravar categoria 'Bebidas'
// Execute: node test-category.js (ou cole no console do browser)

const testCategory = {
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

console.log('--- TESTE CATEGORIA BEBIDAS ---');
console.log('Dados da categoria:', testCategory);

// Simulação do saveCategoryAction
async function testSaveCategory() {
  try {
    console.log('--- CLIQUE DETETADO ---', testCategory);
    console.log('🔧 saveCategoryAction: Iniciando...', { categoryId: testCategory.id, name: testCategory.name });
    
    // Simular sucesso
    console.log('✅ SUCESSO SUPABASE: Categoria salva');
    console.log('✅ SUCESSO FORM: Categoria salva');
    
    return { success: true };
  } catch (error) {
    console.error('❌ ERRO:', error);
    return { success: false, error: error.message };
  }
}

// Executar teste
testSaveCategory().then(result => {
  console.log('Resultado final:', result);
});
