<<<<<<< HEAD
# 📋 Documentação - Campos de Identificação do Funcionário

## 🆔 Novas Funcionalidades de Identificação

Foram adicionados dois campos essenciais de identificação para cada funcionário:

### 1️⃣ BI (Bilhete de Identidade)

**O que é:**
- Documento de identidade oficial em Angola
- Cartão de identidade emitido pelo Serviço de Migração

**Formato:**
```
002345678LA078
├─ 002 = Número sequencial
├─ 345678 = Data de nascimento (DDMMYY)
├─ LA = Iniciais do nome/provincia
└─ 078 = Dígitos de verificação
```

**Exemplo de Valores:**
- António Luanda: `002345678LA078`
- Maria Benguela: `002567890BG089`
- João Huíla: `002789012HU090`
- Francisca Moçâmedes: `002901234MO091`
- Geraldo Cabinda: `002123456CB092`
- Célia Zaire: `002345678ZA093`

**Como Usar:**
1. Acesse **Gestão de Equipa**
2. Clique em **"Novo Funcionário"** ou **"Editar"**
3. Preencha o campo **"Bilhete de Identidade (BI)"**
4. Use formato: `00Xxxxxxx??0XX`

---

### 2️⃣ NIF (Número de Identificação Fiscal)

**O que é:**
- Número de identificação para fins fiscais
- Atribuído pela Administração Fiscal Angolana
- Obrigatório para documentação fiscal

**Formato:**
```
123456789001
├─ 123456789 = Código de identificação
└─ 001 = Dígitos de verificação
```

**Exemplo de Valores:**
- António Luanda: `123456789001`
- Maria Benguela: `123456789002`
- João Huíla: `123456789003`
- Francisca Moçâmedes: `123456789004`
- Geraldo Cabinda: `123456789005`
- Célia Zaire: `123456789006`

**Como Usar:**
1. Acesse **Gestão de Equipa**
2. Clique em **"Novo Funcionário"** ou **"Editar"**
3. Preencha o campo **"NIF (Identificação Fiscal)"**
4. Use 12 dígitos: `1234567890XX`

---

## 📍 Onde Ver os Dados

### Na Lista de Funcionários

Cada cartão de funcionário agora exibe:

```
┌────────────────────────────┐
│ [AA] Nome do Funcionário   │
│ FUNÇÃO: Garçom             │
│                            │
│ 📱 923000001              │
│ 🖥️ ZKTeco ID: BIO-001    │
│ 🆔 BI: 002345678LA078     │
│ 📄 NIF: 123456789001      │
│ 💰 150.000 Kz             │
└────────────────────────────┘
```

**Ícones:**
- 🆔 (Cartão) = Bilhete de Identidade
- 📄 (Documento) = NIF (Número de Identificação Fiscal)

---

## 🔄 Carregar Dados de Exemplo

Todos os 6 funcionários de exemplo já incluem BI e NIF:

1. Clique em **"Carregar Exemplo"**
2. 6 funcionários são adicionados com dados completos
3. Incluem BI e NIF válidos para Angola

**Dados Carregados:**

| Nome | Função | BI | NIF |
|------|--------|----|----|
| António Luanda | GARCOM | 002345678LA078 | 123456789001 |
| Maria Benguela | COZINHA | 002567890BG089 | 123456789002 |
| João Huíla | GARCOM | 002789012HU090 | 123456789003 |
| Francisca Moçâmedes | CAIXA | 002901234MO091 | 123456789004 |
| Geraldo Cabinda | ADMIN | 002123456CB092 | 123456789005 |
| Célia Zaire | GARCOM | 002345678ZA093 | 123456789006 |

---

## 📝 Como Preencher o Formulário

### Passo 1: Abrir Formulário
```
Gestão de Equipa 
  → "Novo Funcionário" ou "Editar"
```

### Passo 2: Preencher Dados Pessoais
```
├─ Nome: [Preencha com nome completo]
├─ Função: [Selecione a função]
├─ Telefone: [Número de contato]
```

### Passo 3: Preencher Identificação
```
├─ ID Biométrico: [ZKTeco ID, ex: BIO-001]
├─ BI: [Bilhete de Identidade, ex: 002345678LA078]
└─ NIF: [Número Fiscal, ex: 123456789001]
```

### Passo 4: Preencher Salário
```
└─ Vencimento: [Valor em Kz]
   (Líquido é calculado automaticamente)
```

### Passo 5: Confirmar
```
Botão: "Confirmar Cadastro"
```

---

## 🔍 Visualizar Identificação Completa

### No Card do Funcionário

Os campos aparecem em ordem:
1. **Telefone** (📱)
2. **ZKTeco ID** (🖥️) - ID biométrico
3. **BI** (🆔) - Bilhete de Identidade
4. **NIF** (📄) - Número Fiscal
5. **Salário** (💰)

### No Modal de Edição

Todos os campos aparecem no formulário:
- Campo: "Bilhete de Identidade (BI)"
- Campo: "NIF (Identificação Fiscal)"

**Comportamento:**
- BI converte automaticamente para MAIÚSCULAS
- NIF aceita apenas números
- Ambos são opcionais no formulário

---

## 📊 Base de Dados

### Estrutura na Interface Employee

```typescript
interface Employee {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  salary: number;
  status: 'ATIVO' | 'FERIAS' | 'INATIVO';
  color: string;
  workDaysPerMonth: number;
  dailyWorkHours: number;
  externalBioId?: string;  // ZKTeco ID
  bi?: string;             // ✨ NOVO: Bilhete de Identidade
  nif?: string;            // ✨ NOVO: Número de Identificação Fiscal
}
```

### Como São Armazenados

- **BI**: Guardado como texto (máx 15 caracteres)
- **NIF**: Guardado como texto (máx 12 caracteres)
- **Ambos**: Armazenados no Zustand store

### Exportação

Quando exportar dados (futuro):
```csv
Nome,Telefone,BI,NIF,Função,Salário
António Luanda,923000001,002345678LA078,123456789001,GARCOM,150000
Maria Benguela,923000002,002567890BG089,123456789002,COZINHA,180000
```

---

## ⚙️ Configuração Técnica

### Arquivo: `types.ts`

```typescript
export interface Employee {
  // ... campos existentes ...
  bi?: string;             // Bilhete de Identidade
  nif?: string;            // Número de Identificação Fiscal
}
```

### Arquivo: `pages/Employees.tsx`

**Adições:**
- Imports: `Card`, `FileText` (ícones Lucide)
- Estado: `bi` e `nif` no `empForm`
- Display: Ícones diferentes para BI e NIF
- Form: Campos dedicados com validação

### Arquivo: `services/salaryCalculatorAngola.ts`

**MOCK_EMPLOYEES_ANGOLA agora inclui:**
```typescript
{
  name: 'António Luanda',
  role: 'GARCOM',
  phone: '923000001',
  salarioBase: 150_000,
  color: '#06b6d4',
  workDaysPerMonth: 22,
  dailyWorkHours: 8,
  externalBioId: 'BIO-001',
  bi: '002345678LA078',       // ✨ Novo
  nif: '123456789001',        // ✨ Novo
}
```

---

## 🎯 Casos de Uso

### 1. Registrar Novo Funcionário
1. Abrir "Novo Funcionário"
2. Preencher BI e NIF
3. Dados ficam vinculados ao funcionário permanentemente

### 2. Atualizar Identificação
1. Clicar "Editar" no funcionário
2. Modificar BI ou NIF
3. Salvar alterações

### 3. Verificar Documentação
1. Ver card do funcionário
2. Conferir BI e NIF visíveis
3. Modal de edição tem detalhes completos

### 4. Conformidade Legal
- BI: Necessário para identificação legal em Angola
- NIF: Obrigatório para registros fiscais
- Ambos: Essenciais para documentação de folha de pagamento

---

## ⚠️ Notas Importantes

### Validação

- ✅ BI: Auto-converte para MAIÚSCULAS
- ✅ NIF: Aceita apenas números
- ⚠️ Ambos: Campos opcionais (podem ser deixados em branco)
- ⚠️ Sem validação de checksum (pode ser adicionada depois)

### Formatação

**BI - Formato Recomendado:**
```
00X000000XX0XX
```

**NIF - Formato Recomendado:**
```
000000000000 (12 dígitos)
```

### Integrações Futuras

- 📱 Sincronização com sistemas de RH
- 💼 Integração com folha de pagamento
- 🏛️ Conformidade com Lei do Trabalho Angolana
- 📊 Relatórios e auditorias

---

## ✅ Resumo de Implementação

| Item | Status | Detalhes |
|------|--------|----------|
| Campo BI | ✅ Implementado | Texto, máx 15 caracteres |
| Campo NIF | ✅ Implementado | Texto, máx 12 caracteres |
| Exibição no Card | ✅ Implementado | Ícones diferentes |
| Formulário | ✅ Implementado | Campos com placeholders |
| Mock Data | ✅ Implementado | 6 funcionários com BI e NIF |
| Auto-maiúscula | ✅ Implementado | BI converte para MAIÚSCULAS |
| Tipos TypeScript | ✅ Implementado | Interface Employee atualizada |

---

## 🚀 Próximos Passos

1. **Usar o Sistema:**
   - Clique "Carregar Exemplo"
   - Veja BI e NIF nos cards
   - Edite um funcionário para modificar

2. **Adicionar Novos:**
   - Clique "Novo Funcionário"
   - Preencha BI e NIF
   - Confirme cadastro

3. **Validações Futuras:**
   - Implementar checksum de BI
   - Validação de formato NIF
   - Verificação de duplicação

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Implementado e Funcional
=======
# 📋 Documentação - Campos de Identificação do Funcionário

## 🆔 Novas Funcionalidades de Identificação

Foram adicionados dois campos essenciais de identificação para cada funcionário:

### 1️⃣ BI (Bilhete de Identidade)

**O que é:**
- Documento de identidade oficial em Angola
- Cartão de identidade emitido pelo Serviço de Migração

**Formato:**
```
002345678LA078
├─ 002 = Número sequencial
├─ 345678 = Data de nascimento (DDMMYY)
├─ LA = Iniciais do nome/provincia
└─ 078 = Dígitos de verificação
```

**Exemplo de Valores:**
- António Luanda: `002345678LA078`
- Maria Benguela: `002567890BG089`
- João Huíla: `002789012HU090`
- Francisca Moçâmedes: `002901234MO091`
- Geraldo Cabinda: `002123456CB092`
- Célia Zaire: `002345678ZA093`

**Como Usar:**
1. Acesse **Gestão de Equipa**
2. Clique em **"Novo Funcionário"** ou **"Editar"**
3. Preencha o campo **"Bilhete de Identidade (BI)"**
4. Use formato: `00Xxxxxxx??0XX`

---

### 2️⃣ NIF (Número de Identificação Fiscal)

**O que é:**
- Número de identificação para fins fiscais
- Atribuído pela Administração Fiscal Angolana
- Obrigatório para documentação fiscal

**Formato:**
```
123456789001
├─ 123456789 = Código de identificação
└─ 001 = Dígitos de verificação
```

**Exemplo de Valores:**
- António Luanda: `123456789001`
- Maria Benguela: `123456789002`
- João Huíla: `123456789003`
- Francisca Moçâmedes: `123456789004`
- Geraldo Cabinda: `123456789005`
- Célia Zaire: `123456789006`

**Como Usar:**
1. Acesse **Gestão de Equipa**
2. Clique em **"Novo Funcionário"** ou **"Editar"**
3. Preencha o campo **"NIF (Identificação Fiscal)"**
4. Use 12 dígitos: `1234567890XX`

---

## 📍 Onde Ver os Dados

### Na Lista de Funcionários

Cada cartão de funcionário agora exibe:

```
┌────────────────────────────┐
│ [AA] Nome do Funcionário   │
│ FUNÇÃO: Garçom             │
│                            │
│ 📱 923000001              │
│ 🖥️ ZKTeco ID: BIO-001    │
│ 🆔 BI: 002345678LA078     │
│ 📄 NIF: 123456789001      │
│ 💰 150.000 Kz             │
└────────────────────────────┘
```

**Ícones:**
- 🆔 (Cartão) = Bilhete de Identidade
- 📄 (Documento) = NIF (Número de Identificação Fiscal)

---

## 🔄 Carregar Dados de Exemplo

Todos os 6 funcionários de exemplo já incluem BI e NIF:

1. Clique em **"Carregar Exemplo"**
2. 6 funcionários são adicionados com dados completos
3. Incluem BI e NIF válidos para Angola

**Dados Carregados:**

| Nome | Função | BI | NIF |
|------|--------|----|----|
| António Luanda | GARCOM | 002345678LA078 | 123456789001 |
| Maria Benguela | COZINHA | 002567890BG089 | 123456789002 |
| João Huíla | GARCOM | 002789012HU090 | 123456789003 |
| Francisca Moçâmedes | CAIXA | 002901234MO091 | 123456789004 |
| Geraldo Cabinda | ADMIN | 002123456CB092 | 123456789005 |
| Célia Zaire | GARCOM | 002345678ZA093 | 123456789006 |

---

## 📝 Como Preencher o Formulário

### Passo 1: Abrir Formulário
```
Gestão de Equipa 
  → "Novo Funcionário" ou "Editar"
```

### Passo 2: Preencher Dados Pessoais
```
├─ Nome: [Preencha com nome completo]
├─ Função: [Selecione a função]
├─ Telefone: [Número de contato]
```

### Passo 3: Preencher Identificação
```
├─ ID Biométrico: [ZKTeco ID, ex: BIO-001]
├─ BI: [Bilhete de Identidade, ex: 002345678LA078]
└─ NIF: [Número Fiscal, ex: 123456789001]
```

### Passo 4: Preencher Salário
```
└─ Vencimento: [Valor em Kz]
   (Líquido é calculado automaticamente)
```

### Passo 5: Confirmar
```
Botão: "Confirmar Cadastro"
```

---

## 🔍 Visualizar Identificação Completa

### No Card do Funcionário

Os campos aparecem em ordem:
1. **Telefone** (📱)
2. **ZKTeco ID** (🖥️) - ID biométrico
3. **BI** (🆔) - Bilhete de Identidade
4. **NIF** (📄) - Número Fiscal
5. **Salário** (💰)

### No Modal de Edição

Todos os campos aparecem no formulário:
- Campo: "Bilhete de Identidade (BI)"
- Campo: "NIF (Identificação Fiscal)"

**Comportamento:**
- BI converte automaticamente para MAIÚSCULAS
- NIF aceita apenas números
- Ambos são opcionais no formulário

---

## 📊 Base de Dados

### Estrutura na Interface Employee

```typescript
interface Employee {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  salary: number;
  status: 'ATIVO' | 'FERIAS' | 'INATIVO';
  color: string;
  workDaysPerMonth: number;
  dailyWorkHours: number;
  externalBioId?: string;  // ZKTeco ID
  bi?: string;             // ✨ NOVO: Bilhete de Identidade
  nif?: string;            // ✨ NOVO: Número de Identificação Fiscal
}
```

### Como São Armazenados

- **BI**: Guardado como texto (máx 15 caracteres)
- **NIF**: Guardado como texto (máx 12 caracteres)
- **Ambos**: Armazenados no Zustand store

### Exportação

Quando exportar dados (futuro):
```csv
Nome,Telefone,BI,NIF,Função,Salário
António Luanda,923000001,002345678LA078,123456789001,GARCOM,150000
Maria Benguela,923000002,002567890BG089,123456789002,COZINHA,180000
```

---

## ⚙️ Configuração Técnica

### Arquivo: `types.ts`

```typescript
export interface Employee {
  // ... campos existentes ...
  bi?: string;             // Bilhete de Identidade
  nif?: string;            // Número de Identificação Fiscal
}
```

### Arquivo: `pages/Employees.tsx`

**Adições:**
- Imports: `Card`, `FileText` (ícones Lucide)
- Estado: `bi` e `nif` no `empForm`
- Display: Ícones diferentes para BI e NIF
- Form: Campos dedicados com validação

### Arquivo: `services/salaryCalculatorAngola.ts`

**MOCK_EMPLOYEES_ANGOLA agora inclui:**
```typescript
{
  name: 'António Luanda',
  role: 'GARCOM',
  phone: '923000001',
  salarioBase: 150_000,
  color: '#06b6d4',
  workDaysPerMonth: 22,
  dailyWorkHours: 8,
  externalBioId: 'BIO-001',
  bi: '002345678LA078',       // ✨ Novo
  nif: '123456789001',        // ✨ Novo
}
```

---

## 🎯 Casos de Uso

### 1. Registrar Novo Funcionário
1. Abrir "Novo Funcionário"
2. Preencher BI e NIF
3. Dados ficam vinculados ao funcionário permanentemente

### 2. Atualizar Identificação
1. Clicar "Editar" no funcionário
2. Modificar BI ou NIF
3. Salvar alterações

### 3. Verificar Documentação
1. Ver card do funcionário
2. Conferir BI e NIF visíveis
3. Modal de edição tem detalhes completos

### 4. Conformidade Legal
- BI: Necessário para identificação legal em Angola
- NIF: Obrigatório para registros fiscais
- Ambos: Essenciais para documentação de folha de pagamento

---

## ⚠️ Notas Importantes

### Validação

- ✅ BI: Auto-converte para MAIÚSCULAS
- ✅ NIF: Aceita apenas números
- ⚠️ Ambos: Campos opcionais (podem ser deixados em branco)
- ⚠️ Sem validação de checksum (pode ser adicionada depois)

### Formatação

**BI - Formato Recomendado:**
```
00X000000XX0XX
```

**NIF - Formato Recomendado:**
```
000000000000 (12 dígitos)
```

### Integrações Futuras

- 📱 Sincronização com sistemas de RH
- 💼 Integração com folha de pagamento
- 🏛️ Conformidade com Lei do Trabalho Angolana
- 📊 Relatórios e auditorias

---

## ✅ Resumo de Implementação

| Item | Status | Detalhes |
|------|--------|----------|
| Campo BI | ✅ Implementado | Texto, máx 15 caracteres |
| Campo NIF | ✅ Implementado | Texto, máx 12 caracteres |
| Exibição no Card | ✅ Implementado | Ícones diferentes |
| Formulário | ✅ Implementado | Campos com placeholders |
| Mock Data | ✅ Implementado | 6 funcionários com BI e NIF |
| Auto-maiúscula | ✅ Implementado | BI converte para MAIÚSCULAS |
| Tipos TypeScript | ✅ Implementado | Interface Employee atualizada |

---

## 🚀 Próximos Passos

1. **Usar o Sistema:**
   - Clique "Carregar Exemplo"
   - Veja BI e NIF nos cards
   - Edite um funcionário para modificar

2. **Adicionar Novos:**
   - Clique "Novo Funcionário"
   - Preencha BI e NIF
   - Confirme cadastro

3. **Validações Futuras:**
   - Implementar checksum de BI
   - Validação de formato NIF
   - Verificação de duplicação

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Implementado e Funcional
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
