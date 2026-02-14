<<<<<<< HEAD
# 💰 Sistema de Cálculo de Salários - Angola

## 📋 Visão Geral

Sistema completo de cálculo de salários baseado na legislação angolana, com impostos (IRT), contribuições sociais (INSS) e deduções automáticas.

---

## 🇦🇴 Estrutura de Salários em Angola

### Componentes do Salário

```
┌─────────────────────────────────────────┐
│  SALÁRIO BRUTO: 150.000 Kz              │
├─────────────────────────────────────────┤
│  - IRT (Imposto de Rendimento)          │
│  - INSS (3.6% - Segurança Social)       │
│  - Outras Deduções                      │
├─────────────────────────────────────────┤
│  = SALÁRIO LÍQUIDO                      │
└─────────────────────────────────────────┘
```

---

## 📊 Cálculo de IRT (Imposto sobre o Rendimento do Trabalho)

### Escalões 2024 (Angola)

| Intervalo de Salário | Taxa | Aplicação |
|---|---|---|
| 0 - 40.000 Kz | 0% | Isento |
| 40.000 - 100.000 Kz | 8% | Sobre o excesso |
| 100.000 - 200.000 Kz | 10% | Sobre o excesso |
| 200.000 - 300.000 Kz | 12% | Sobre o excesso |
| 300.000+ Kz | 15% | Sobre o excesso |

### Dedução de Independência Pessoal

- **Valor Fixo:** 50.000 Kz por mês
- **Aplicação:** Deduzido do salário antes de calcular IRT
- **Salário Tributável = Salário Bruto - 50.000 Kz**

### Exemplo de Cálculo de IRT

```
Funcionário: José Silva
Salário Bruto: 200.000 Kz

Passo 1: Salário Tributável
  200.000 - 50.000 (dedução) = 150.000 Kz

Passo 2: Identificar Escalão
  150.000 Kz está entre 100.000 - 200.000
  Taxa: 10%

Passo 3: Calcular IRT
  (150.000 - 100.000) × 0.10 = 50.000 × 0.10 = 5.000 Kz

IRT A Descontar: 5.000 Kz
```

---

## 💳 INSS - Contribuição do Trabalhador

### Percentagem Fixa

- **Taxa:** 3.6% do salário bruto
- **Órgão:** Instituto Nacional de Segurança Social
- **Finalidade:** Fundo de pensão e proteção social

### Cálculo INSS

```
INSS = Salário Bruto × 3.6%

Exemplo:
Salário Bruto: 150.000 Kz
INSS: 150.000 × 0.036 = 5.400 Kz
```

---

## 💵 Cálculo de Salário Líquido

### Fórmula Completa

```
Salário Líquido = Salário Bruto - IRT - INSS - Deduções

Exemplo Completo:
Salário Bruto:        150.000 Kz
- IRT:                  2.000 Kz (cálculo por escalão)
- INSS (3.6%):          5.400 Kz
- Deduções:                 0 Kz
─────────────────────────────────
= Salário Líquido:    142.600 Kz
```

---

## 📅 Cálculo de Salário Diário e Horário

### Salário Diário

```
Salário Diário = Salário Base / Dias Úteis por Mês

Padrão: 22 dias úteis/mês
Exemplo: 150.000 / 22 = 6.818 Kz/dia
```

### Salário Horário

```
Salário Horário = Salário Diário / Horas de Trabalho

Padrão: 8 horas/dia
Exemplo: 6.818 / 8 = 852 Kz/hora
```

### Hora Extra

```
Hora Extra = Salário Horário × 1.5 (150%)
Exemplo: 852 × 1.5 = 1.278 Kz/hora extra
```

---

## 📊 Dados de Funcionários de Exemplo

### Sistema Implementado

A aplicação inclui dados de exemplo para um restaurante em Luanda:

```
1. António Luanda (GARCOM)
   Salário Base: 150.000 Kz
   
2. Maria Benguela (COZINHA/CHEF)
   Salário Base: 180.000 Kz
   
3. João Huíla (GARCOM)
   Salário Base: 120.000 Kz
   
4. Francisca Moçâmedes (CAIXA)
   Salário Base: 160.000 Kz
   
5. Geraldo Cabinda (ADMIN/GERENTE)
   Salário Base: 350.000 Kz
   
6. Célia Zaire (GARCOM)
   Salário Base: 130.000 Kz
```

### Carregar Dados

1. Clique em **"Carregar Exemplo"** na página de Funcionários
2. Os 6 funcionários serão adicionados com dados angolanos realistas

---

## 📈 Salários Mínimos por Categoria (2024)

| Categoria | Salário Mínimo |
|---|---|
| Garçom/Atendimento | 120.000 Kz |
| Operador de Caixa | 130.000 Kz |
| Chef/Cozinha | 140.000 Kz |
| Gestão/Gerente | 200.000 Kz |

---

## 🔍 Como Usar

### 1. Ver Cálculo de Salário

1. Acesse a página **Gestão de Equipa**
2. Clique no botão **"Salário"** em cada funcionário
3. Veja o breakdown completo com IRT, INSS e salário líquido

### 2. Adicionar Novo Funcionário

1. Clique em **"Novo Funcionário"**
2. Preencha:
   - Nome completo
   - Função operativa
   - ID Biométrico (opcional)
   - **Vencimento Base Mensal**
3. O sistema calcula automaticamente o líquido

### 3. Carregar Dados de Exemplo

1. Clique em **"Carregar Exemplo"**
2. 6 funcionários são adicionados com dados realistas
3. Cada um já tem salário, IRT e INSS configurados

---

## 💻 Componentes Técnicos

### Arquivo: `services/salaryCalculatorAngola.ts`

Funções principais:

```typescript
// Calcular IRT
calculateIRT(salarioBase: number): number

// Calcular INSS
calculateINSS(salarioBase: number): number

// Breakdown completo
calculateSalaryBreakdown(salarioBase, role, workDays, dailyHours): SalaryBreakdown

// Validar salário mínimo
validateMinimumWage(role: string, salary: number): boolean

// Hora extra (50%)
calculateOvertimeHour(salarioBase, hoursWorked, dailyHours): number

// Férias remuneradas
calculateVacationBonus(salarioBase, daysOfVacation): number

// Bónus de fim de ano
calculateYearEndBonus(salarioBase, yearsWorked): number
```

### Componente: `components/SalaryCalculatorAngola.tsx`

Interface visual que mostra:
- Salário bruto
- IRT (com percentagem)
- INSS (com percentagem)
- Salário líquido
- Salário diário
- Salário horário
- Validação de salário mínimo

---

## 📋 Informações Importantes

### Lei do Trabalho Angolana

✅ **IRT**
- Imposto progressivo por escalões
- Dedução de independência pessoal de 50.000 Kz
- Atualizado anualmente

✅ **INSS**
- Contribuição obrigatória: 3.6%
- Instituto Nacional de Segurança Social
- Proteção e fundo de pensão

✅ **Salário Mínimo**
- Varia por categoria profissional
- Atualizado anualmente
- Obrigatório respeitar

✅ **Férias**
- Máximo 30 dias remunerados por ano
- Lei do Trabalho Angolana

✅ **Horas Extras**
- Remuneradas a 150% (1.5x o valor normal)
- Para trabalho acima de 8 horas/dia

---

## 🔄 Atualizar Escalões de IRT

Se os escalões mudarem, atualize em `services/salaryCalculatorAngola.ts`:

```typescript
const IRT_BRACKETS_2024 = [
  { min: 0, max: 39_999, rate: 0 },           // Até 40k
  { min: 40_000, max: 99_999, rate: 0.08 },   // 40k a 100k
  { min: 100_000, max: 199_999, rate: 0.10 }, // 100k a 200k
  // ... adicione novos escalões conforme necessário
];
```

---

## 📊 Exemplo de Relatório de Salário

```
╔═════════════════════════════════════════════════╗
║              CÁLCULO DE SALÁRIO                 ║
║            António Luanda - GARCOM              ║
╚═════════════════════════════════════════════════╝

SALÁRIO BRUTO:                    150.000 Kz
─────────────────────────────────────────────
Descontos:
  IRT (Imposto)                  -2.000 Kz
  INSS (3.6%)                    -5.400 Kz
  ────────────────────────────────────────
  Total Descontos                -7.400 Kz
═════════════════════════════════════════════════
SALÁRIO LÍQUIDO:                 142.600 Kz

Desempenho:
  Salário Diário:                6.818 Kz
  Salário Horário:                 852 Kz
  Hora Extra (150%):            1.278 Kz
═════════════════════════════════════════════════
```

---

## ✅ Checklist de Integração

- [x] Cálculo de IRT por escalões
- [x] Cálculo de INSS (3.6%)
- [x] Dedução de independência pessoal
- [x] Validação de salário mínimo
- [x] Cálculo de salário diário
- [x] Cálculo de salário horário
- [x] Interface visual de breakdown
- [x] Dados de exemplo Angola
- [x] Integração na página de Funcionários
- [x] Button "Carregar Exemplo"

---

## 📞 Notas Importantes

⚠️ **Legislação:**
- Consultar Lei do Trabalho Angolana mais recente
- Impostos podem mudar anualmente
- Validar com departamento fiscal

⚠️ **Salários:**
- Sempre respeitar salário mínimo legal
- INSS é obrigatório
- IRT é descontado automaticamente

⚠️ **Registos:**
- Manter registos de pagamentos
- Documentar horas extras
- Guardar comprovantes

---

## 🎯 Próximos Passos

1. **Carregar Dados:** Clique em "Carregar Exemplo"
2. **Ver Cálculos:** Clique em "Salário" em cada funcionário
3. **Adicionar Novos:** Use "Novo Funcionário" para criar

---

**Última Atualização:** Janeiro 2024
**Versão:** 1.0.0
**Status:** ✅ Implementado e Funcional

=======
# 💰 Sistema de Cálculo de Salários - Angola

## 📋 Visão Geral

Sistema completo de cálculo de salários baseado na legislação angolana, com impostos (IRT), contribuições sociais (INSS) e deduções automáticas.

---

## 🇦🇴 Estrutura de Salários em Angola

### Componentes do Salário

```
┌─────────────────────────────────────────┐
│  SALÁRIO BRUTO: 150.000 Kz              │
├─────────────────────────────────────────┤
│  - IRT (Imposto de Rendimento)          │
│  - INSS (3.6% - Segurança Social)       │
│  - Outras Deduções                      │
├─────────────────────────────────────────┤
│  = SALÁRIO LÍQUIDO                      │
└─────────────────────────────────────────┘
```

---

## 📊 Cálculo de IRT (Imposto sobre o Rendimento do Trabalho)

### Escalões 2024 (Angola)

| Intervalo de Salário | Taxa | Aplicação |
|---|---|---|
| 0 - 40.000 Kz | 0% | Isento |
| 40.000 - 100.000 Kz | 8% | Sobre o excesso |
| 100.000 - 200.000 Kz | 10% | Sobre o excesso |
| 200.000 - 300.000 Kz | 12% | Sobre o excesso |
| 300.000+ Kz | 15% | Sobre o excesso |

### Dedução de Independência Pessoal

- **Valor Fixo:** 50.000 Kz por mês
- **Aplicação:** Deduzido do salário antes de calcular IRT
- **Salário Tributável = Salário Bruto - 50.000 Kz**

### Exemplo de Cálculo de IRT

```
Funcionário: José Silva
Salário Bruto: 200.000 Kz

Passo 1: Salário Tributável
  200.000 - 50.000 (dedução) = 150.000 Kz

Passo 2: Identificar Escalão
  150.000 Kz está entre 100.000 - 200.000
  Taxa: 10%

Passo 3: Calcular IRT
  (150.000 - 100.000) × 0.10 = 50.000 × 0.10 = 5.000 Kz

IRT A Descontar: 5.000 Kz
```

---

## 💳 INSS - Contribuição do Trabalhador

### Percentagem Fixa

- **Taxa:** 3.6% do salário bruto
- **Órgão:** Instituto Nacional de Segurança Social
- **Finalidade:** Fundo de pensão e proteção social

### Cálculo INSS

```
INSS = Salário Bruto × 3.6%

Exemplo:
Salário Bruto: 150.000 Kz
INSS: 150.000 × 0.036 = 5.400 Kz
```

---

## 💵 Cálculo de Salário Líquido

### Fórmula Completa

```
Salário Líquido = Salário Bruto - IRT - INSS - Deduções

Exemplo Completo:
Salário Bruto:        150.000 Kz
- IRT:                  2.000 Kz (cálculo por escalão)
- INSS (3.6%):          5.400 Kz
- Deduções:                 0 Kz
─────────────────────────────────
= Salário Líquido:    142.600 Kz
```

---

## 📅 Cálculo de Salário Diário e Horário

### Salário Diário

```
Salário Diário = Salário Base / Dias Úteis por Mês

Padrão: 22 dias úteis/mês
Exemplo: 150.000 / 22 = 6.818 Kz/dia
```

### Salário Horário

```
Salário Horário = Salário Diário / Horas de Trabalho

Padrão: 8 horas/dia
Exemplo: 6.818 / 8 = 852 Kz/hora
```

### Hora Extra

```
Hora Extra = Salário Horário × 1.5 (150%)
Exemplo: 852 × 1.5 = 1.278 Kz/hora extra
```

---

## 📊 Dados de Funcionários de Exemplo

### Sistema Implementado

A aplicação inclui dados de exemplo para um restaurante em Luanda:

```
1. António Luanda (GARCOM)
   Salário Base: 150.000 Kz
   
2. Maria Benguela (COZINHA/CHEF)
   Salário Base: 180.000 Kz
   
3. João Huíla (GARCOM)
   Salário Base: 120.000 Kz
   
4. Francisca Moçâmedes (CAIXA)
   Salário Base: 160.000 Kz
   
5. Geraldo Cabinda (ADMIN/GERENTE)
   Salário Base: 350.000 Kz
   
6. Célia Zaire (GARCOM)
   Salário Base: 130.000 Kz
```

### Carregar Dados

1. Clique em **"Carregar Exemplo"** na página de Funcionários
2. Os 6 funcionários serão adicionados com dados angolanos realistas

---

## 📈 Salários Mínimos por Categoria (2024)

| Categoria | Salário Mínimo |
|---|---|
| Garçom/Atendimento | 120.000 Kz |
| Operador de Caixa | 130.000 Kz |
| Chef/Cozinha | 140.000 Kz |
| Gestão/Gerente | 200.000 Kz |

---

## 🔍 Como Usar

### 1. Ver Cálculo de Salário

1. Acesse a página **Gestão de Equipa**
2. Clique no botão **"Salário"** em cada funcionário
3. Veja o breakdown completo com IRT, INSS e salário líquido

### 2. Adicionar Novo Funcionário

1. Clique em **"Novo Funcionário"**
2. Preencha:
   - Nome completo
   - Função operativa
   - ID Biométrico (opcional)
   - **Vencimento Base Mensal**
3. O sistema calcula automaticamente o líquido

### 3. Carregar Dados de Exemplo

1. Clique em **"Carregar Exemplo"**
2. 6 funcionários são adicionados com dados realistas
3. Cada um já tem salário, IRT e INSS configurados

---

## 💻 Componentes Técnicos

### Arquivo: `services/salaryCalculatorAngola.ts`

Funções principais:

```typescript
// Calcular IRT
calculateIRT(salarioBase: number): number

// Calcular INSS
calculateINSS(salarioBase: number): number

// Breakdown completo
calculateSalaryBreakdown(salarioBase, role, workDays, dailyHours): SalaryBreakdown

// Validar salário mínimo
validateMinimumWage(role: string, salary: number): boolean

// Hora extra (50%)
calculateOvertimeHour(salarioBase, hoursWorked, dailyHours): number

// Férias remuneradas
calculateVacationBonus(salarioBase, daysOfVacation): number

// Bónus de fim de ano
calculateYearEndBonus(salarioBase, yearsWorked): number
```

### Componente: `components/SalaryCalculatorAngola.tsx`

Interface visual que mostra:
- Salário bruto
- IRT (com percentagem)
- INSS (com percentagem)
- Salário líquido
- Salário diário
- Salário horário
- Validação de salário mínimo

---

## 📋 Informações Importantes

### Lei do Trabalho Angolana

✅ **IRT**
- Imposto progressivo por escalões
- Dedução de independência pessoal de 50.000 Kz
- Atualizado anualmente

✅ **INSS**
- Contribuição obrigatória: 3.6%
- Instituto Nacional de Segurança Social
- Proteção e fundo de pensão

✅ **Salário Mínimo**
- Varia por categoria profissional
- Atualizado anualmente
- Obrigatório respeitar

✅ **Férias**
- Máximo 30 dias remunerados por ano
- Lei do Trabalho Angolana

✅ **Horas Extras**
- Remuneradas a 150% (1.5x o valor normal)
- Para trabalho acima de 8 horas/dia

---

## 🔄 Atualizar Escalões de IRT

Se os escalões mudarem, atualize em `services/salaryCalculatorAngola.ts`:

```typescript
const IRT_BRACKETS_2024 = [
  { min: 0, max: 39_999, rate: 0 },           // Até 40k
  { min: 40_000, max: 99_999, rate: 0.08 },   // 40k a 100k
  { min: 100_000, max: 199_999, rate: 0.10 }, // 100k a 200k
  // ... adicione novos escalões conforme necessário
];
```

---

## 📊 Exemplo de Relatório de Salário

```
╔═════════════════════════════════════════════════╗
║              CÁLCULO DE SALÁRIO                 ║
║            António Luanda - GARCOM              ║
╚═════════════════════════════════════════════════╝

SALÁRIO BRUTO:                    150.000 Kz
─────────────────────────────────────────────
Descontos:
  IRT (Imposto)                  -2.000 Kz
  INSS (3.6%)                    -5.400 Kz
  ────────────────────────────────────────
  Total Descontos                -7.400 Kz
═════════════════════════════════════════════════
SALÁRIO LÍQUIDO:                 142.600 Kz

Desempenho:
  Salário Diário:                6.818 Kz
  Salário Horário:                 852 Kz
  Hora Extra (150%):            1.278 Kz
═════════════════════════════════════════════════
```

---

## ✅ Checklist de Integração

- [x] Cálculo de IRT por escalões
- [x] Cálculo de INSS (3.6%)
- [x] Dedução de independência pessoal
- [x] Validação de salário mínimo
- [x] Cálculo de salário diário
- [x] Cálculo de salário horário
- [x] Interface visual de breakdown
- [x] Dados de exemplo Angola
- [x] Integração na página de Funcionários
- [x] Button "Carregar Exemplo"

---

## 📞 Notas Importantes

⚠️ **Legislação:**
- Consultar Lei do Trabalho Angolana mais recente
- Impostos podem mudar anualmente
- Validar com departamento fiscal

⚠️ **Salários:**
- Sempre respeitar salário mínimo legal
- INSS é obrigatório
- IRT é descontado automaticamente

⚠️ **Registos:**
- Manter registos de pagamentos
- Documentar horas extras
- Guardar comprovantes

---

## 🎯 Próximos Passos

1. **Carregar Dados:** Clique em "Carregar Exemplo"
2. **Ver Cálculos:** Clique em "Salário" em cada funcionário
3. **Adicionar Novos:** Use "Novo Funcionário" para criar

---

**Última Atualização:** Janeiro 2024
**Versão:** 1.0.0
**Status:** ✅ Implementado e Funcional

>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
