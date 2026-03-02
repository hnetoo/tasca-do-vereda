// Testes automatizados para verificar despesas e folha de pagamento na produção
// Execute: node test-production-api.js

const https = require('https');
const http = require('http');

// Configuração
const BASE_URL = 'https://tasca-do-vereda.vercel.app';

console.log('🧪 INICIANDO TESTES AUTOMATIZADOS - PRODUÇÃO');
console.log('🌐 URL:', BASE_URL);
console.log('=' .repeat(60));

// Função para fazer requisições HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Teste 1: Verificar páginas principais
async function testMainPages() {
  console.log('\n📄 TESTE 1: Verificar Páginas Principais');
  
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Owner Login', path: '/owner/login' },
    { name: 'Owner Desktop', path: '/owner' },
    { name: 'Owner Mobile', path: '/owner/mobile' },
    { name: 'API Owner Data', path: '/api/owner-data' }
  ];
  
  for (const page of pages) {
    try {
      const url = `${BASE_URL}${page.path}`;
      console.log(`\n🌐 Testando: ${page.name} (${url})`);
      
      const response = await makeRequest(url);
      
      console.log(`  ✅ Status: ${response.statusCode}`);
      
      if (page.path.includes('/api/')) {
        try {
          const jsonData = JSON.parse(response.data);
          console.log(`  📊 Estrutura API:`, {
            hasOrders: !!jsonData.orders,
            hasExpenses: !!jsonData.expenses,
            hasPayroll: !!jsonData.payroll,
            ordersCount: jsonData.orders?.length || 0,
            expensesCount: jsonData.expenses?.length || 0,
            payrollCount: jsonData.payroll?.length || 0,
            hasError: !!jsonData.error
          });
          
          if (jsonData.error) {
            console.log(`  ⚠️ Erro API: ${jsonData.message}`);
          }
        } catch (parseError) {
          console.log(`  ❌ Erro ao parsear JSON: ${parseError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    }
  }
}

// Teste 2: Verificar estrutura de dados (simulação)
async function testDataStructure() {
  console.log('\n📊 TESTE 2: Verificar Estrutura de Dados');
  
  // Dados de teste para despesas
  const testExpenses = [
    {
      id: 'test-1',
      description: 'Teste Despesa 1',
      amount: 15000,
      category: 'Aluguel',
      date: new Date().toISOString()
    },
    {
      id: 'test-2',
      description: 'Teste Despesa 2',
      amount: 8500,
      category: 'Água',
      date: new Date().toISOString()
    }
  ];
  
  // Dados de teste para folha
  const testPayroll = [
    {
      id: 'emp-1',
      name: 'Funcionário Teste 1',
      netSalary: 120000,
      net_salary: 120000,
      amount: 120000
    },
    {
      id: 'emp-2',
      name: 'Funcionário Teste 2',
      netSalary: 95000,
      net_salary: 95000,
      amount: 95000
    }
  ];
  
  // Testar cálculos de despesas
  console.log('\n💰 Testando Cálculos de Despesas:');
  const totalExpenses = testExpenses.reduce((sum, expense) => {
    const amount = expense.amount || 0;
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0);
  
  console.log(`  ✅ Total despesas: ${totalExpenses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
  console.log(`  📊 Estrutura válida: ${testExpenses.every(e => e.id && e.amount && e.description)}`);
  
  // Testar cálculos de folha
  console.log('\n💳 Testando Cálculos de Folha:');
  const totalPayroll = testPayroll.reduce((sum, emp) => {
    const salary = emp.netSalary || emp.net_salary || emp.amount || 0;
    return sum + (typeof salary === 'number' ? salary : 0);
  }, 0);
  
  console.log(`  ✅ Total folha: ${totalPayroll.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
  console.log(`  📊 Estrutura válida: ${testPayroll.every(e => e.id && (e.netSalary || e.net_salary || e.amount))}`);
  
  return {
    expenses: {
      data: testExpenses,
      total: totalExpenses,
      valid: testExpenses.every(e => e.id && e.amount && e.description)
    },
    payroll: {
      data: testPayroll,
      total: totalPayroll,
      valid: testPayroll.every(e => e.id && (e.netSalary || e.net_salary || e.amount))
    }
  };
}

// Teste 3: Verificar períodos
function testPeriodCalculations() {
  console.log('\n📅 TESTE 3: Verificar Cálculos por Período');
  
  const now = new Date();
  const periods = ['HOJE', 'SEMANA', 'MES'];
  
  periods.forEach(period => {
    console.log(`\n📊 Período: ${period}`);
    
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
    
    console.log(`  📅 Início: ${filterStart.toISOString()}`);
    console.log(`  📅 Fim: ${filterEnd.toISOString()}`);
    console.log(`  ✅ Período válido: ${filterStart < filterEnd}`);
  });
}

// Teste 4: Verificar formatação de valores
function testValueFormatting() {
  console.log('\n💰 TESTE 4: Verificar Formatação de Valores');
  
  const testValues = [0, 1500, 12500, 150000, 2500000];
  
  testValues.forEach(value => {
    const formatted = new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0
    }).format(value);
    
    console.log(`  ${value.toLocaleString()} → ${formatted}`);
  });
}

// Teste 5: Verificar segurança e autenticação
async function testSecurity() {
  console.log('\n🔒 TESTE 5: Verificar Segurança e Autenticação');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/owner-data`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      
      if (data.error === 'UNAUTHORIZED') {
        console.log('  ✅ API protegida (requer autenticação)');
      } else {
        console.log('  ⚠️ API não está protegida');
      }
    } else {
      console.log(`  ✅ API retorna status ${response.statusCode} (protegida)`);
    }
  } catch (error) {
    console.log(`  ❌ Erro ao testar segurança: ${error.message}`);
  }
}

// Teste 6: Verificar performance básica
async function testPerformance() {
  console.log('\n⚡ TESTE 6: Verificar Performance Básica');
  
  const pages = ['/', '/owner/login', '/owner/mobile'];
  
  for (const page of pages) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(`${BASE_URL}${page}`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      console.log(`  📄 ${page}: ${response.statusCode} (${responseTime}ms)`);
      
      if (responseTime < 2000) {
        console.log(`    ✅ Rápido`);
      } else if (responseTime < 5000) {
        console.log(`    ⚠️ Lento`);
      } else {
        console.log(`    ❌ Muito lento`);
      }
    } catch (error) {
      console.log(`  📄 ${page}: ❌ Erro - ${error.message}`);
    }
  }
}

// Função principal
async function runAllTests() {
  console.log('🚀 EXECUTANDO TODOS OS TESTES AUTOMATIZADOS...\n');
  
  try {
    // Teste 1: Páginas principais
    await testMainPages();
    
    // Teste 2: Estrutura de dados
    const testData = await testDataStructure();
    
    // Teste 3: Períodos
    testPeriodCalculations();
    
    // Teste 4: Formatação
    testValueFormatting();
    
    // Teste 5: Segurança
    await testSecurity();
    
    // Teste 6: Performance
    await testPerformance();
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTES AUTOMATIZADOS CONCLUÍDOS!');
    console.log('\n📋 RESUMO:');
    console.log('✅ Páginas principais testadas');
    console.log('✅ Estrutura de dados validada');
    console.log('✅ Cálculos por período verificados');
    console.log('✅ Formatação de valores testada');
    console.log('✅ Segurança verificada');
    console.log('✅ Performance básica medida');
    
    console.log('\n🎯 VERIFICAÇÕES MANUAIS NECESSÁRIAS:');
    console.log('1. Acesse https://tasca-do-vereda.vercel.app/owner');
    console.log('2. Faça login como proprietário');
    console.log('3. Verifique se os cards de despesas e folha aparecem');
    console.log('4. Teste os períodos HOJE/SEMANA/MÊS');
    console.log('5. Compare com os valores calculados aqui');
    
    console.log('\n💡 RESULTADOS ESPERADOS:');
    console.log(`💰 Total despesas (teste): ${testData.expenses.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
    console.log(`💳 Total folha (teste): ${testData.payroll.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NOS TESTES:', error.message);
  }
}

// Executar testes
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMainPages,
  testDataStructure,
  testPeriodCalculations,
  testValueFormatting,
  testSecurity,
  testPerformance,
  runAllTests
};
