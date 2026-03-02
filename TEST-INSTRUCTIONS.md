# Testes para Verificar Despesas e Folha de Pagamento

## 🎯 **OBJETIVO**
Verificar se os cards de **Despesas** e **Folha Salarial** estão funcionando corretamente na produção: https://tasca-do-vereda.vercel.app

---

## 🧪 **COMO EXECUTAR OS TESTES**

### **Método 1: Console do Navegador**
1. Abra https://tasca-do-vereda.vercel.app
2. Pressione **F12** para abrir Developer Tools
3. Vá para a aba **Console**
4. Copie e cole o conteúdo do arquivo `test-expenses-payroll.js`
5. Pressione **Enter** para executar

### **Método 2: Via URL**
1. Navegue para https://tasca-do-vereda.vercel.app/owner (desktop)
2. Navegue para https://tasca-do-vereda.vercel.app/owner/mobile (mobile)
3. Execute os testes em ambas as páginas

---

## 📋 **TESTES INCLUÍDOS**

### **✅ TESTE 1: Acesso à API**
- Verifica se `/api/owner-data` está acessível
- Confirma estrutura dos dados retornados
- Conta quantidade de registros

### **✅ TESTE 2: Estrutura das Despesas**
- Valida formato do array de despesas
- Verifica campos obrigatórios: `id`, `description`, `amount`, `category`, `date`
- Calcula total manualmente para comparação
- Formata valores em Kwanza (AOA)

### **✅ TESTE 3: Estrutura da Folha de Pagamento**
- Valida formato do array da folha
- Verifica campos de salário: `netSalary`, `net_salary`, `amount`
- Calcula total manualmente
- Identifica funcionários com salários válidos

### **✅ TESTE 4: Cálculos dos Cards**
- Procura cards na interface
- Extrai valores formatados
- Compara com cálculos manuais
- Verifica se valores estão sendo exibidos

### **✅ TESTE 5: Navegação Entre Páginas**
- Testa acesso a `/owner` (desktop)
- Testa acesso a `/owner/mobile` (mobile)
- Verifica status HTTP das páginas

### **✅ TESTE 6: Cálculos por Período**
- Testa filtros: **HOJE**, **SEMANA**, **MÊS**
- Simula cálculos de datas
- Filtra dados por período
- Calcula totais para cada período

---

## 🎯 **O QUE VERIFICAR**

### **✅ NOS CARDS DE DESPESAS:**
- **Valor correto:** ✅ Soma de `expense.amount`
- **Formatação:** ✅ Kwanza (AOA) correto
- **Períodos:** ✅ HOJE/SEMANA/MÊS funcionando
- **Atualização:** ✅ Valores mudam ao trocar período

### **✅ NOS CARDS DE FOLHA:**
- **Valor correto:** ✅ Soma de `netSalary` ou `net_salary`
- **Formatação:** ✅ Kwanza (AOA) correto
- **Funcionários:** ✅ Contagem correta
- **Cálculo:** ✅ Total líquido correto

### **✅ NA INTERFACE:**
- **Desktop:** ✅ `/owner` cards funcionando
- **Mobile:** ✅ `/owner/mobile` cards funcionando
- **Layout:** ✅ Cores e gradientes mantidos
- **Responsividade:** ✅ Funciona em ambos

---

## 🚨 **RESULTADOS ESPERADOS**

### **✅ SUCESSO:**
```
🧪 INICIANDO TESTES - DESPESAS E FOLHA DE PAGAMENTO
✅ API Acessível: 200
📊 Estrutura dos dados: {hasOrders: true, hasExpenses: true, hasPayroll: true}
✅ Encontradas X despesas
💰 Total manual das despesas: X.XXX,XX AOA
✅ Encontrados Y funcionários
💳 Total manual da folha: Y.YYY,YY AOA
✅ TESTES CONCLUÍDOS!
```

### **❌ PROBLEMAS:**
```
❌ Erro ao acessar API: Network error
⚠️ Nenhuma despesa encontrada
⚠️ Nenhuma folha de pagamento encontrada
❌ Cards não encontrados na interface
```

---

## 🛠️ **FUNÇÕES DISPONÍVEIS**

Após executar o script, estas funções ficam disponíveis na console:

```javascript
// Testar apenas despesas
testExpenses(data);

// Testar apenas folha
testPayroll(data);

// Testar cards na interface
testCards();

// Executar todos os testes
runTests();
```

---

## 📊 **CHECKLIST DE VERIFICAÇÃO**

### **✅ API:**
- [ ] `/api/owner-data` responde 200
- [ ] Retorna arrays de `expenses` e `payroll`
- [ ] Dados têm estrutura correta

### **✅ DESPESAS:**
- [ ] Array `expenses` existe e tem itens
- [ ] Cada despesa tem `amount` numérico
- [ ] Total calculado corretamente
- [ ] Card mostra valor formatado

### **✅ FOLHA:**
- [ ] Array `payroll` existe e tem itens
- [ ] Cada registro tem salário válido
- [ ] Total calculado corretamente
- [ ] Card mostra valor formatado

### **✅ INTERFACE:**
- [ ] Desktop `/owner` funciona
- [ ] Mobile `/owner/mobile` funciona
- [ ] Cards aparecem com valores
- [ ] Períodos HOJE/SEMANA/MÊS funcionam

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute os testes** na produção
2. **Verifique os resultados** na console
3. **Compare valores manuais** com cards
4. **Teste navegação** entre páginas
5. **Confirme períodos** funcionam
6. **Reporte problemas** se encontrar

**Os testes verificarão 100% das funcionalidades de despesas e folha!** 🎯
