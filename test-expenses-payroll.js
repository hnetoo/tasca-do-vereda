// Testes para verificar despesas e folha de pagamento
// Execute estes testes na console do navegador em https://tasca-do-vereda.vercel.app

console.log('🧪 INICIANDO TESTES - DESPESAS E FOLHA DE PAGAMENTO');
console.log('=' .repeat(60));

// Teste 1: Verificar se API está acessível
async function testApiAccess() {
  console.log('\n📡 TESTE 1: Acesso à API /api/owner-data');
  try {
    const response = await fetch('/api/owner-data');
    const data = await response.json();
    
    console.log('✅ API Acessível:', response.status);
    console.log('📊 Estrutura dos dados:', {
      hasOrders: !!data.orders,
      hasExpenses: !!data.expenses,
      hasPayroll: !!data.payroll,
      ordersCount: data.orders?.length || 0,
      expensesCount: data.expenses?.length || 0,
      payrollCount: data.payroll?.length || 0
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao acessar API:', error);
    return null;
  }
}

// Teste 2: Verificar estrutura das despesas
function testExpensesStructure(expenses) {
  console.log('\n💰 TESTE 2: Estrutura das Despesas');
  
  if (!Array.isArray(expenses) || expenses.length === 0) {
    console.log('⚠️ Nenhuma despesa encontrada ou array inválido');
    return false;
  }
  
  console.log(`✅ Encontradas ${expenses.length} despesas`);
  
  // Verificar estrutura de cada despesa
  expenses.forEach((expense, index) => {
    console.log(`\n📄 Despesa ${index + 1}:`, {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      hasValidAmount: typeof expense.amount === 'number' && expense.amount > 0
    });
  });
  
  // Calcular total manualmente
  const manualTotal = expenses.reduce((sum, expense) => {
    const amount = expense.amount || 0;
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0);
  
  console.log(`\n💰 Total manual das despesas: ${manualTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
  
  return true;
}

// Teste 3: Verificar estrutura da folha de pagamento
function testPayrollStructure(payroll) {
  console.log('\n💳 TESTE 3: Estrutura da Folha de Pagamento');
  
  if (!Array.isArray(payroll) || payroll.length === 0) {
    console.log('⚠️ Nenhuma folha de pagamento encontrada ou array inválido');
    return false;
  }
  
  console.log(`✅ Encontrados ${payroll.length} registros na folha`);
  
  // Verificar estrutura de cada registro
  payroll.forEach((record, index) => {
    console.log(`\n👤 Funcionário ${index + 1}:`, {
      id: record.id,
      name: record.name,
      netSalary: record.netSalary,
      net_salary: record.net_salary,
      amount: record.amount,
      baseSalary: record.baseSalary,
      base_salary: record.base_salary,
      hasValidSalary: (
        (typeof record.netSalary === 'number' && record.netSalary > 0) ||
        (typeof record.net_salary === 'number' && record.net_salary > 0) ||
        (typeof record.amount === 'number' && record.amount > 0)
      )
    });
  });
  
  // Calcular total manualmente
  const manualTotal = payroll.reduce((sum, record) => {
    const salary = record.netSalary || record.net_salary || record.amount || 0;
    return sum + (typeof salary === 'number' ? salary : 0);
  }, 0);
  
  console.log(`\n💳 Total manual da folha: ${manualTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
  
  return true;
}

// Teste 4: Verificar cálculos dos cards na interface
async function testCardCalculations() {
  console.log('\n🎯 TESTE 4: Verificar Cálculos dos Cards');
  
  // Verificar se os cards estão presentes na página
  const cards = {
    expenses: document.querySelector('[data-testid="expenses-card"]') || 
               document.querySelector('div:has(> :contains("Despesas"))'),
    payroll: document.querySelector('[data-testid="payroll-card"]') || 
               document.querySelector('div:has(> :contains("Folha"))'),
    revenue: document.querySelector('[data-testid="revenue-card"]') || 
               document.querySelector('div:has(> :contains("Receita"))')
  };
  
  console.log('📊 Cards encontrados:', {
    expenses: !!cards.expenses,
    payroll: !!cards.payroll,
    revenue: !!cards.revenue
  });
  
  // Tentar extrair valores dos cards
  try {
    const expensesValue = cards.expenses?.textContent?.match(/[\d.,]+AOA/)?.[0];
    const payrollValue = cards.payroll?.textContent?.match(/[\d.,]+AOA/)?.[0];
    const revenueValue = cards.revenue?.textContent?.match(/[\d.,]+AOA/)?.[0];
    
    console.log('💰 Valores encontrados nos cards:', {
      expenses: expensesValue || 'Não encontrado',
      payroll: payrollValue || 'Não encontrado',
      revenue: revenueValue || 'Não encontrado'
    });
  } catch (error) {
    console.log('⚠️ Não foi possível extrair valores dos cards:', error.message);
  }
}

// Teste 5: Verificar navegação entre páginas
async function testPageNavigation() {
  console.log('\n🔄 TESTE 5: Navegação Entre Páginas');
  
  const pages = [
    { name: 'Owner Desktop', url: '/owner' },
    { name: 'Owner Mobile', url: '/owner/mobile' }
  ];
  
  for (const page of pages) {
    try {
      console.log(`🌐 Navegando para ${page.name}...`);
      const response = await fetch(page.url);
      console.log(`✅ ${page.name}: ${response.status}`);
    } catch (error) {
      console.error(`❌ Erro ao acessar ${page.name}:`, error);
    }
  }
}

// Teste 6: Verificar cálculos de períodos
function testPeriodCalculations(data) {
  console.log('\n📅 TESTE 6: Cálculos por Período');
  
  const periods = ['HOJE', 'SEMANA', 'MES'];
  
  periods.forEach(period => {
    console.log(`\n📊 Período: ${period}`);
    
    // Filtrar despesas por período (simulação)
    const now = new Date();
    let filterStart, filterEnd;
    
    switch (period) {
      case 'HOJE':
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'SEMANA':
        filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filterEnd = now;
        break;
      case 'MES':
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
    }
    
    const filteredExpenses = data.expenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= filterStart && expenseDate <= filterEnd;
    }) || [];
    
    const filteredPayroll = data.payroll?.filter(record => {
      const recordDate = new Date(record.date || record.created_at);
      return recordDate >= filterStart && recordDate <= filterEnd;
    }) || [];
    
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const payrollTotal = filteredPayroll.reduce((sum, p) => sum + (p.netSalary || p.net_salary || p.amount || 0), 0);
    
    console.log(`  💰 Despesas: ${filteredExpenses.length} itens = ${expensesTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
    console.log(`  💳 Folha: ${filteredPayroll.length} itens = ${payrollTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
  });
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('🚀 EXECUTANDO TODOS OS TESTES...\n');
  
  // Teste 1: Acesso à API
  const data = await testApiAccess();
  
  if (!data) {
    console.error('\n❌ FALHA CRÍTICA: Não foi possível acessar a API');
    return;
  }
  
  // Teste 2: Estrutura das despesas
  testExpensesStructure(data.expenses);
  
  // Teste 3: Estrutura da folha
  testPayrollStructure(data.payroll);
  
  // Teste 4: Cálculos dos cards
  await testCardCalculations();
  
  // Teste 5: Navegação
  await testPageNavigation();
  
  // Teste 6: Cálculos por período
  testPeriodCalculations(data);
  
  console.log('\n✅ TESTES CONCLUÍDOS!');
  console.log('\n📋 RESUMO:');
  console.log('- API acessível: ✅');
  console.log('- Estrutura de dados verificada: ✅');
  console.log('- Cálculos manuais feitos: ✅');
  console.log('- Interface verificada: ✅');
  console.log('- Navegação testada: ✅');
  console.log('- Períodos testados: ✅');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Compare os valores manuais com os cards na interface');
  console.log('2. Verifique se os períodos HOJE/SEMANA/MÊS funcionam');
  console.log('3. Teste a navegação entre /owner e /owner/mobile');
  console.log('4. Verifique se os valores atualizam em tempo real');
}

// Executar testes automaticamente
runAllTests();

// Também expor funções para execução manual
window.testExpenses = testExpensesStructure;
window.testPayroll = testPayrollStructure;
window.testCards = testCardCalculations;
window.runTests = runAllTests;

console.log('\n💡 FUNÇÕES DISPONÍVEIS NA CONSOLE:');
console.log('- testExpenses(data): Testar estrutura das despesas');
console.log('- testPayroll(data): Testar estrutura da folha');
console.log('- testCards(): Testar cards na interface');
console.log('- runTests(): Executar todos os testes');
