# 🚀 **Abordagem JSONB para Estrutura Flexível**

## 📋 **Problema Resolvido**
O sistema estava dando erros de "coluna não encontrada" ao tentar acessar campos como `bonus`, `hora_extra`, `deducoes` que não existiam fisicamente nas tabelas do Supabase.

## ✅ **Solução Implementada**
Adotamos uma abordagem **JSONB** para armazenar dados flexíveis sem precisar alterar o schema do banco de dados.

---

## 🏗️ **Estrutura das Tabelas**

### 📊 **Tabela Payroll (payroll_records)**
```sql
-- Colunas principais fixas
id | staff_id | staff_name | base_salary | subsidies | deductions | net_total | reference_month | status_pagamento | created_at | updated_at

-- Coluna flexível JSONB
metadata: JSONB {
  "bonus": 10000.00,
  "hora_extra": {
    "horas": 8,
    "valor_hora": 2500.00,
    "total": 20000.00
  },
  "subsidios": {
    "alimentacao": 3000.00,
    "transporte": 2000.00,
    "outros": 1000.00
  },
  "deducoes": {
    "irs": 5000.00,
    "seguranca_social": 3000.00,
    "outros": 500.00
  },
  "observacoes": "Bónus por bom desempenho"
}
```

### 🛒 **Tabela Orders**
```sql
-- Colunas principais fixas
id | table_id | shift_id | status | total | created_at | updated_at

-- Coluna flexível JSONB
metadata: JSONB {
  "customer_name": "João Silva",
  "customer_phone": "+244 923 456 789",
  "payment_method": "MULTIBANCO",
  "table_name": "Mesa 5",
  "created_via": "POS",
  "items_count": 3,
  "subtotal": 15000.00,
  "tax_amount": 975.00,
  "waiter_id": "staff_123",
  "special_requests": "Sem cebola"
}
```

### 🪑 **Tabela Restaurant Tables**
```sql
-- Colunas principais fixas
id | label | number | seats | status | x | y | zone | shape | rotation | color | is_active | created_at | updated_at

-- Coluna flexível JSONB
metadata: JSONB {
  "capacity_max": 6,
  "min_reservation": 2,
  "special_features": ["vista_mar", "acesso_deficiencia"],
  "equipment": ["tv", "ar_condicionado"],
  "notes": "Mesa preferencial para eventos"
}
```

---

## 🔧 **Benefícios da Abordagem JSONB**

### ✅ **Vantagens**
1. **Sem erros de coluna não encontrada** - Todos os campos extras ficam no JSONB
2. **Schema flexível** - Adicionar novos campos sem ALTER TABLE
3. **Performance otimizada** - Índices GIN para queries JSONB
4. **Backward compatibility** - Campos tradicionais continuam funcionando
5. **Queries complexas** - Operadores JSONB do PostgreSQL

### 📈 **Performance**
- ✅ **Índices GIN** criados para todas as colunas metadata
- ✅ **Queries otimizadas** com operadores JSONB específicos
- ✅ **Cache eficiente** para dados frequentemente acessados

---

## 🚀 **Implementação no Código**

### 📝 **Exemplo de Criação com Metadata**
```typescript
// Criar payroll com bónus e hora extra
const payrollRecord = {
  staff_id: 'staff_123',
  staff_name: 'João Silva',
  base_salary: 150000.00,
  subsidies: 0,
  deductions: 0,
  net_total: 0, // Será calculado automaticamente
  reference_month: '2026-03',
  status_pagamento: 'pago',
  metadata: {
    bonus: 10000.00,
    hora_extra: {
      horas: 8,
      valor_hora: 2500.00,
      total: 20000.00
    },
    subsidios: {
      alimentacao: 3000.00,
      transporte: 2000.00
    },
    deducoes: {
      irs: 5000.00,
      seguranca_social: 3000.00
    },
    observacoes: 'Bónus por excelente desempenho'
  }
};
```

### 🔍 **Exemplo de Query com Metadata**
```typescript
// Buscar payroll com filtros JSONB
const { data } = await supabase
  .from('payroll_records')
  .select('*')
  .eq('status_pagamento', 'pago')
  .gte('metadata->>bonus', '5000') // Bónus maior que 5000
  .contains('metadata->subsidios', '{"alimentacao": true}') // Tem subsídio alimentação
  .order('created_at', { ascending: false });
```

### ⚡ **Funções Auxiliares**
```typescript
// Adicionar bónus a um payroll existente
await addBonusToPayroll('payroll_id_123', 15000.00, 'Bónus de Natal');

// Adicionar hora extra
await addHoraExtraToPayroll('payroll_id_123', 4, 3000.00);

// Atualizar metadata específico
await updatePayrollMetadata('payroll_id_123', {
  observacoes: 'Atualizado em Março',
  bonus: 20000.00
});
```

---

## 📊 **Queries SQL Exemplo**

### 🔎 **Buscar com Filtros JSONB**
```sql
-- Buscar payroll com bónus
SELECT 
  staff_name,
  base_salary,
  metadata->>'bonus' as bonus,
  metadata->'hora_extra'->>'total' as hora_extra_total
FROM payroll_records 
WHERE metadata->>'bonus' IS NOT NULL
  AND metadata->>'bonus'::numeric > 10000;

-- Buscar orders por método de pagamento
SELECT 
  id,
  total,
  metadata->>'payment_method' as payment_method,
  metadata->>'customer_name' as customer
FROM orders 
WHERE metadata->>'payment_method' = 'MULTIBANCO';

-- Buscar mesas com características especiais
SELECT 
  label,
  seats,
  metadata->'special_features' as features
FROM restaurant_tables 
WHERE metadata->'special_features' ? 'vista_mar';
```

### 📈 **Queries de Agregação**
```sql
-- Total de bónus pagos no mês
SELECT 
  SUM((metadata->>'bonus')::numeric) as total_bonus
FROM payroll_records 
WHERE reference_month = '2026-03'
  AND status_pagamento = 'pago';

-- Média de hora extra por funcionário
SELECT 
  staff_name,
  AVG((metadata->'hora_extra'->>'total')::numeric) as avg_hora_extra
FROM payroll_records 
WHERE metadata->'hora_extra' IS NOT NULL
GROUP BY staff_name;
```

---

## 🎯 **Próximos Passos**

### 📋 **O que foi implementado:**
- ✅ **Coluna metadata JSONB** em todas as tabelas principais
- ✅ **Índices GIN** para performance otimizada
- ✅ **Funções auxiliares** para manipular metadata
- ✅ **Cálculos automáticos** incluindo valores do metadata
- ✅ **Queries otimizadas** no dashboard e relatórios

### 🚀 **O que pode ser adicionado:**
- 📊 **Relatórios avançados** usando operadores JSONB
- 🔍 **Busca full-text** em metadata
- 📈 **Analytics** sobre padrões de metadata
- 🎛️ **Interface administrativa** para gerenciar metadata
- 📱 **API endpoints** específicos para metadata

---

## 🏆 **Resultado Final**

**🎉 Sem mais erros de "coluna não encontrada"!**

O sistema agora é:
- **Flexível** - Adicione campos sem alterar schema
- **Robusto** - Sem erros de colunas inexistentes
- **Performático** - Índices otimizados para JSONB
- **Escalável** - Suporta qualquer estrutura de dados
- **Compatível** - Mantém campos tradicionais funcionando

**A abordagem JSONB resolveu definitivamente o problema de colunas fixas e proporcionou uma arquitetura muito mais flexível para o futuro!** 🚀
