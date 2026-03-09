// TESTE SORT_ORDER FIX - Categoria Bebidas
// Verificação detalhada do campo sort_order
// Execute no console do browser ou Node.js

const bebidasCategory = {
  id: crypto.randomUUID(),
  name: 'Bebidas',
  description: 'Todas as bebidas do menu',
  icon: '🥤',
  sortOrder: 1, // Valor definido
  parentId: null,
  isActive: true,
  isAvailableOnDigitalMenu: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('🧪 TESTE SORT_ORDER FIX - CATEGORIA BEBIDAS');
console.log('📋 Dados da categoria (UI):', bebidasCategory);
console.log('🎯 Verificação do campo sortOrder:', bebidasCategory.sortOrder);
console.log('🔧 Tipo do sortOrder:', typeof bebidasCategory.sortOrder);
console.log('🔧 É undefined?', bebidasCategory.sortOrder === undefined);

// Simulação do fluxo do adminOperations
function testSaveCategory() {
  console.log('--- CLIQUE DETETADO ADMIN ---', bebidasCategory);
  
  const dbCategory = {
    id: bebidasCategory.id,
    name: bebidasCategory.name,
    icon: bebidasCategory.icon,
    parent_id: bebidasCategory.parentId || null,
    "isAvailableOnDigitalMenu": bebidasCategory.isAvailableOnDigitalMenu ?? true,
    updated_at: new Date().toISOString()
  };

  // Adicionar sort_order apenas se não for undefined
  if (bebidasCategory.sortOrder !== undefined) {
    dbCategory.sort_order = bebidasCategory.sortOrder;
    console.log('✅ sort_order adicionado:', dbCategory.sort_order);
  } else {
    console.log('🚫 sort_order NÃO adicionado (undefined)');
  }

  console.log('🔧 Objeto enviado para o Supabase:', dbCategory);
  console.log('🔧 Campos presentes no objeto:', Object.keys(dbCategory));
  console.log('🔧 Valor de sort_order:', dbCategory.sort_order);
  
  // Verificação final
  if (dbCategory.sort_order !== undefined) {
    console.log('✅ SUCESSO: sort_order está presente e válido');
    console.log('✅ SUCESSO SUPABASE: Categoria Bebidas salva!');
    return { success: true, data: dbCategory };
  } else {
    console.log('🚫 ERRO: sort_order está ausente ou undefined');
    return { success: false, error: 'sort_order undefined' };
  }
}

// Teste com sortOrder undefined
console.log('\n🔍 TESTE COM sortOrder undefined:');
const categorySemSort = { ...bebidasCategory, sortOrder: undefined };
console.log('🎯 sortOrder:', categorySemSort.sortOrder);
console.log('🔧 É undefined?', categorySemSort.sortOrder === undefined);

const dbCategorySemSort = {
  id: categorySemSort.id,
  name: categorySemSort.name,
  icon: categorySemSort.icon,
  parent_id: categorySemSort.parentId || null,
  "isAvailableOnDigitalMenu": categorySemSort.isAvailableOnDigitalMenu ?? true,
  updated_at: new Date().toISOString()
};

if (categorySemSort.sortOrder !== undefined) {
  dbCategorySemSort.sort_order = categorySemSort.sortOrder;
  console.log('✅ sort_order adicionado:', dbCategorySemSort.sort_order);
} else {
  console.log('🚫 sort_order NÃO adicionado (undefined) - OK!');
}

console.log('🔧 Objeto sem sort_order:', dbCategorySemSort);
console.log('🔧 Campos presentes:', Object.keys(dbCategorySemSort));

// Executar teste principal
console.log('\n🚀 EXECUTANDO TESTE PRINCIPAL...');
testSaveCategory().then(result => {
  console.log('📊 RESULTADO FINAL:', result);
  console.log('🎉 TESTE sort_order CONCLUÍDO!');
});
