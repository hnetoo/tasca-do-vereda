<<<<<<< HEAD
# 🔐 Sistema Completo de Utilizadores, Permissões, QR Code Menu e Funcionalidades POS

## 📋 O Que Foi Implementado

### 1️⃣ **Sistema Avançado de Permissões**

**Arquivo:** `services/permissionsService.ts` (150+ linhas)

#### Permissões Disponíveis:
- ✅ CREATE_ORDER - Criar novas encomendas/mesas
- ✅ EDIT_ORDER - Editar encomendas existentes
- ✅ DELETE_ORDER - Eliminar encomendas
- ✅ PAY_ORDER - Processar pagamentos
- ✅ VIEW_FINANCIAL - Ver dados financeiros
- ✅ MANAGE_USERS - Criar, editar e eliminar utilizadores
- ✅ MANAGE_INVENTORY - Gerenciar inventário
- ✅ VIEW_KITCHEN - Acesso ao KDS
- ✅ PRINT_BILL - Imprimir contas
- ✅ APPLY_DISCOUNT - Aplicar descontos
- ✅ ACCESS_REPORTS - Ver relatórios
- ✅ MANAGE_TABLES - Gerenciar mesas
- ✅ MANAGE_RESERVATIONS - Gerenciar reservas
- ✅ MANAGE_EMPLOYEES - Gerenciar funcionários
- ✅ QR_MENU_CONFIG - Configurar QR Code menu
- ✅ BIOMETRIC_SYNC - Sincronizar biometria
- ✅ EXPORT_DATA - Exportar dados

#### Permissões por Role:

**ADMIN** - Todas as 17 permissões
**CAIXA** - CREATE_ORDER, EDIT_ORDER, PAY_ORDER, VIEW_FINANCIAL, PRINT_BILL, APPLY_DISCOUNT, MANAGE_TABLES, MANAGE_RESERVATIONS
**GARCOM** - CREATE_ORDER, EDIT_ORDER, PRINT_BILL, MANAGE_TABLES, MANAGE_RESERVATIONS
**COZINHA** - VIEW_KITCHEN, ACCESS_REPORTS

#### Funções de Permissões:

```typescript
// Verificar se utilizador tem permissão
hasPermission(role: UserRole, permission: Permission): boolean

// Obter todas as permissões de um role
getPermissions(role: UserRole): Permission[]

// Verificar se pode gerir ordem
canManageOrder(role: UserRole, action: 'create' | 'edit' | 'delete' | 'pay'): boolean

// Verificar acesso a módulo
canAccessModule(role: UserRole, module: 'pos' | 'kitchen' | 'finance'): boolean

// Verificar se pode usar feature
canUseFeature(role: UserRole, feature: string): boolean
```

---

### 2️⃣ **Modal de Gestão de Utilizadores**

**Arquivo:** `components/UserManagementModal.tsx` (270+ linhas)

#### Funcionalidades:

✅ **Criar Novos Utilizadores**
- Nome completo
- Função/Role (ADMIN, CAIXA, GARCOM, COZINHA)
- PIN de acesso (4 dígitos)
- Cor de identificação personalizada

✅ **Editar Utilizadores**
- Modificar dados
- Alterar PIN
- Mudar Role
- Atualizar cor

✅ **Eliminar Utilizadores**
- Confirmação de segurança
- Remoção imediata

✅ **Ver Permissões**
- Exibição de todas as permissões do role selecionado
- Descrição detalhada de cada permissão
- Design visual organizado

#### Interface:
- Grid duplo: Formulário à esquerda, Lista + Permissões à direita
- Validação de dados obrigatórios
- Notificações de sucesso/erro
- Toggle para mostrar/esconder PIN

---

### 3️⃣ **Configuração de QR Code Menu Digital**

**Arquivo:** `components/QRMenuConfig.tsx` (200+ linhas)

#### Funcionalidades:

✅ **Configurar URL do Menu**
- URL personalizada ou padrão
- Validação de URLs
- Armazenamento seguro

✅ **Código Curto de Acesso**
- Geração automática
- Personalização manual

✅ **Pré-visualização QR Code**
- Imagem em tempo real
- 400x400 pixels com branding

✅ **Ações com QR Code**
- ✅ Copiar URL para clipboard
- ✅ Copiar link da imagem QR
- ✅ Baixar PNG do QR Code
- ✅ Testar menu no browser

#### Como Usar:

1. Acesse **Configurações → Digital Menu**
2. Clique **Configurar Menu QR**
3. Defina a URL personalizada (ou use padrão)
4. Clique **Guardar Configuração**
5. Baixe, imprima ou compartilhe o QR Code

---

### 4️⃣ **Integração no Settings**

**Arquivo:** `pages/Settings.tsx` (ATUALIZADO)

#### Novas Abas:
- ✅ **Acessos POS** - Gerenciar utilizadores e permissões
- ✅ **Digital Menu** - Configurar QR Code e URL menu

#### Campos Adicionados em SystemSettings:
```typescript
qrMenuUrl?: string;         // URL personalizada menu
qrMenuShortCode?: string;   // Código de acesso curto
```

---

### 5️⃣ **Layout de Sala - Funcionalidades Existentes**

**Arquivo:** `pages/TableLayout.tsx` (419 linhas - JÁ COMPLETO)

#### Funcionalidades:
- ✅ Visualizar todas as mesas
- ✅ Drag & drop para reorganizar
- ✅ Filtrar por zona (INTERIOR/EXTERIOR/BALCÃO)
- ✅ Estatísticas em tempo real
- ✅ Modo edição/visualização
- ✅ Status das mesas (LIVRE, OCUPADO, RESERVADO, PAGAMENTO)
- ✅ Tempo de ocupação
- ✅ Total de vendas por mesa
- ✅ Impressora térmica configurável

#### Como Usar:
1. Clique em "Mesas" no menu
2. Selecione zona (INTERIOR/EXTERIOR)
3. Clique "Editar Layout" para rearranjar
4. Clique em mesa para abrir ordem POS
5. Status atualiza em tempo real

---

### 6️⃣ **POS Terminal - Funcionalidades**

**Arquivo:** `pages/POS.tsx` (785 linhas - FUNCIONAL)

#### Funcionalidades Implementadas:

✅ **Gestão de Mesas**
- Seleção rápida de mesa
- Múltiplas contas por mesa
- Status visual (cores)

✅ **Gestão de Ordens**
- Adicionar itens do menu
- Remover itens
- Alterar quantidade
- Criar sub-contas

✅ **Pagamento**
- Múltiplos métodos: NUMERÁRIO, TPA, TRANSFERÊNCIA, CONTA CORRENTE, QR_CODE
- Processamento de pagamento
- Cálculo automático com IVA

✅ **Gestão de Turnos**
- Abrir turno com saldo inicial
- Fechar turno
- Controlo de caixa

✅ **Impressão**
- Imprimir conta
- Imprimir cozinha (KDS)
- Múltiplas impressoras

✅ **Pesquisa e Filtros**
- Procurar por nome do prato
- Filtrar por categoria
- Visualizar por categoria

✅ **Display do Cliente**
- Exibição em monitor externo
- Atualização em tempo real

#### Como Usar:

1. **Selecione Mesa** - Clique em mesa no layout
2. **Adicione Itens** - Procure no menu e clique para adicionar
3. **Revise Ordem** - Modifique quantidades se necessário
4. **Processe Pagamento** - Clique "Checkout"
5. **Selecione Método** - Escolha forma de pagamento
6. **Finalize** - Confirme pagamento

---

## 📊 Fluxo de Utilizadores

### Scenario 1: Admin Gerencia Utilizadores

```
1. Admin entra no SISTEMA (Login)
2. Vai para CONFIGURAÇÕES → Acessos POS
3. Clica GERENCIAR UTILIZADORES
4. Modal abre com:
   - Formulário para criar novo
   - Lista de utilizadores
   - Permissões do role selecionado
5. Admin cria "João - GARCOM"
6. Sistema exibe todas as permissões de GARCOM
7. João agora pode fazer login e usar POS com restrições
```

### Scenario 2: Cliente Scaneaia QR Code Menu

```
1. Cliente em mesa ve QR code impresso
2. Abre câmara do telemóvel
3. Scanneia QR code
4. Browser abre URL configurada do menu
5. Menu digital exibe em HTML responsivo
6. Cliente vê prato, preço, descrição
7. Clica para fazer pedido (integração futura)
```

### Scenario 3: Operador Processa Venda

```
1. GARCOM seleciona mesa no POS
2. Adiciona pratos do menu
3. Clica CHECKOUT
4. Sistema calcula total com IVA
5. CAIXA processa pagamento (se não é GARCOM)
6. Conta é impressa
7. Mesa é liberada
```

---

## 🔐 Matriz de Permissões

| Permissão | ADMIN | CAIXA | GARCOM | COZINHA |
|-----------|-------|-------|--------|---------|
| CREATE_ORDER | ✅ | ✅ | ✅ | ❌ |
| EDIT_ORDER | ✅ | ✅ | ✅ | ❌ |
| DELETE_ORDER | ✅ | ❌ | ❌ | ❌ |
| PAY_ORDER | ✅ | ✅ | ❌ | ❌ |
| VIEW_FINANCIAL | ✅ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |
| VIEW_KITCHEN | ✅ | ❌ | ❌ | ✅ |
| PRINT_BILL | ✅ | ✅ | ✅ | ❌ |
| APPLY_DISCOUNT | ✅ | ✅ | ❌ | ❌ |
| MANAGE_TABLES | ✅ | ✅ | ✅ | ❌ |
| QR_MENU_CONFIG | ✅ | ❌ | ❌ | ❌ |

---

## 📁 Arquivos Criados/Modificados

### ✨ Novos Arquivos:
1. **services/permissionsService.ts** - Sistema de permissões (150 linhas)
2. **components/UserManagementModal.tsx** - Gestão de utilizadores (270 linhas)
3. **components/QRMenuConfig.tsx** - Configuração QR Menu (200 linhas)

### 🔧 Arquivos Modificados:
1. **types.ts** - Adicionado qrMenuUrl, qrMenuShortCode
2. **pages/Settings.tsx** - Integração de novos componentes e abas

---

## 🚀 Como Testar

### 1. Criar Novo Utilizador:
1. Acesse http://localhost:5173/#/settings
2. Clique aba "Acessos POS"
3. Clique "Gerenciar Utilizadores"
4. Preencha dados e clique "Criar Utilizador"
5. Novo utilizador aparece na lista

### 2. Testar Permissões:
1. Mude Role para "CAIXA" no formulário
2. Veja que as permissões mudam dinamicamente
3. Crie utilizador com cada role
4. Login com cada um e veja menus diferentes

### 3. Configurar QR Code Menu:
1. Acesse aba "Digital Menu"
2. Clique "Configurar Menu QR"
3. Deixe URL vazia (usa padrão) ou insira personalizada
4. Clique "Guardar Configuração"
5. Clique "Testar Menu no Browser"
6. Clique "Baixar QR Code (PNG)"

### 4. Usar POS Terminal:
1. Acesse http://localhost:5173/#/pos
2. Clique em uma mesa no painel esquerdo
3. Procure item no menu ("Pizza", "Cerveja", etc.)
4. Clique para adicionar
5. Clique "Checkout"
6. Selecione método de pagamento
7. Confirme

---

## ✅ Checklist de Implementação

- [x] Sistema de permissões com 17 permissões
- [x] Modal de gestão de utilizadores (criar, editar, eliminar)
- [x] Exibição de permissões por role
- [x] Configuração de QR Code Menu digital
- [x] URL personalizada ou padrão
- [x] Pré-visualização e download de QR Code
- [x] Integração em Settings com novas abas
- [x] Suporte a layout de sala (já funcional)
- [x] POS terminal completo (já funcional)
- [x] Controlo de permissões integrado

---

## 🎯 Próximas Melhorias (Opcional)

1. **Auditoria** - Log de quem fez cada ação
2. **2FA** - Autenticação em dois fatores
3. **Histórico de Utilizadores** - Ver ações por utilizador
4. **Relatórios de Permissões** - Quem tem acesso a quê
5. **Exportação de QR Codes** - Em lote para várias mesas
6. **Integração Biométrica** - FingerPrint para login

---

## 📞 Suporte

Para adicionar novas permissões:
1. Abra `services/permissionsService.ts`
2. Adicione à type `Permission`
3. Adicione ao objeto `rolePermissions`
4. Adicione descrição em `permissionDescriptions`

Para customizar roles:
1. Modifique `rolePermissions` conforme necessário
2. As permissões atualizam automaticamente nos componentes

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Completo e Funcional
=======
# 🔐 Sistema Completo de Utilizadores, Permissões, QR Code Menu e Funcionalidades POS

## 📋 O Que Foi Implementado

### 1️⃣ **Sistema Avançado de Permissões**

**Arquivo:** `services/permissionsService.ts` (150+ linhas)

#### Permissões Disponíveis:
- ✅ CREATE_ORDER - Criar novas encomendas/mesas
- ✅ EDIT_ORDER - Editar encomendas existentes
- ✅ DELETE_ORDER - Eliminar encomendas
- ✅ PAY_ORDER - Processar pagamentos
- ✅ VIEW_FINANCIAL - Ver dados financeiros
- ✅ MANAGE_USERS - Criar, editar e eliminar utilizadores
- ✅ MANAGE_INVENTORY - Gerenciar inventário
- ✅ VIEW_KITCHEN - Acesso ao KDS
- ✅ PRINT_BILL - Imprimir contas
- ✅ APPLY_DISCOUNT - Aplicar descontos
- ✅ ACCESS_REPORTS - Ver relatórios
- ✅ MANAGE_TABLES - Gerenciar mesas
- ✅ MANAGE_RESERVATIONS - Gerenciar reservas
- ✅ MANAGE_EMPLOYEES - Gerenciar funcionários
- ✅ QR_MENU_CONFIG - Configurar QR Code menu
- ✅ BIOMETRIC_SYNC - Sincronizar biometria
- ✅ EXPORT_DATA - Exportar dados

#### Permissões por Role:

**ADMIN** - Todas as 17 permissões
**CAIXA** - CREATE_ORDER, EDIT_ORDER, PAY_ORDER, VIEW_FINANCIAL, PRINT_BILL, APPLY_DISCOUNT, MANAGE_TABLES, MANAGE_RESERVATIONS
**GARCOM** - CREATE_ORDER, EDIT_ORDER, PRINT_BILL, MANAGE_TABLES, MANAGE_RESERVATIONS
**COZINHA** - VIEW_KITCHEN, ACCESS_REPORTS

#### Funções de Permissões:

```typescript
// Verificar se utilizador tem permissão
hasPermission(role: UserRole, permission: Permission): boolean

// Obter todas as permissões de um role
getPermissions(role: UserRole): Permission[]

// Verificar se pode gerir ordem
canManageOrder(role: UserRole, action: 'create' | 'edit' | 'delete' | 'pay'): boolean

// Verificar acesso a módulo
canAccessModule(role: UserRole, module: 'pos' | 'kitchen' | 'finance'): boolean

// Verificar se pode usar feature
canUseFeature(role: UserRole, feature: string): boolean
```

---

### 2️⃣ **Modal de Gestão de Utilizadores**

**Arquivo:** `components/UserManagementModal.tsx` (270+ linhas)

#### Funcionalidades:

✅ **Criar Novos Utilizadores**
- Nome completo
- Função/Role (ADMIN, CAIXA, GARCOM, COZINHA)
- PIN de acesso (4 dígitos)
- Cor de identificação personalizada

✅ **Editar Utilizadores**
- Modificar dados
- Alterar PIN
- Mudar Role
- Atualizar cor

✅ **Eliminar Utilizadores**
- Confirmação de segurança
- Remoção imediata

✅ **Ver Permissões**
- Exibição de todas as permissões do role selecionado
- Descrição detalhada de cada permissão
- Design visual organizado

#### Interface:
- Grid duplo: Formulário à esquerda, Lista + Permissões à direita
- Validação de dados obrigatórios
- Notificações de sucesso/erro
- Toggle para mostrar/esconder PIN

---

### 3️⃣ **Configuração de QR Code Menu Digital**

**Arquivo:** `components/QRMenuConfig.tsx` (200+ linhas)

#### Funcionalidades:

✅ **Configurar URL do Menu**
- URL personalizada ou padrão
- Validação de URLs
- Armazenamento seguro

✅ **Código Curto de Acesso**
- Geração automática
- Personalização manual

✅ **Pré-visualização QR Code**
- Imagem em tempo real
- 400x400 pixels com branding

✅ **Ações com QR Code**
- ✅ Copiar URL para clipboard
- ✅ Copiar link da imagem QR
- ✅ Baixar PNG do QR Code
- ✅ Testar menu no browser

#### Como Usar:

1. Acesse **Configurações → Digital Menu**
2. Clique **Configurar Menu QR**
3. Defina a URL personalizada (ou use padrão)
4. Clique **Guardar Configuração**
5. Baixe, imprima ou compartilhe o QR Code

---

### 4️⃣ **Integração no Settings**

**Arquivo:** `pages/Settings.tsx` (ATUALIZADO)

#### Novas Abas:
- ✅ **Acessos POS** - Gerenciar utilizadores e permissões
- ✅ **Digital Menu** - Configurar QR Code e URL menu

#### Campos Adicionados em SystemSettings:
```typescript
qrMenuUrl?: string;         // URL personalizada menu
qrMenuShortCode?: string;   // Código de acesso curto
```

---

### 5️⃣ **Layout de Sala - Funcionalidades Existentes**

**Arquivo:** `pages/TableLayout.tsx` (419 linhas - JÁ COMPLETO)

#### Funcionalidades:
- ✅ Visualizar todas as mesas
- ✅ Drag & drop para reorganizar
- ✅ Filtrar por zona (INTERIOR/EXTERIOR/BALCÃO)
- ✅ Estatísticas em tempo real
- ✅ Modo edição/visualização
- ✅ Status das mesas (LIVRE, OCUPADO, RESERVADO, PAGAMENTO)
- ✅ Tempo de ocupação
- ✅ Total de vendas por mesa
- ✅ Impressora térmica configurável

#### Como Usar:
1. Clique em "Mesas" no menu
2. Selecione zona (INTERIOR/EXTERIOR)
3. Clique "Editar Layout" para rearranjar
4. Clique em mesa para abrir ordem POS
5. Status atualiza em tempo real

---

### 6️⃣ **POS Terminal - Funcionalidades**

**Arquivo:** `pages/POS.tsx` (785 linhas - FUNCIONAL)

#### Funcionalidades Implementadas:

✅ **Gestão de Mesas**
- Seleção rápida de mesa
- Múltiplas contas por mesa
- Status visual (cores)

✅ **Gestão de Ordens**
- Adicionar itens do menu
- Remover itens
- Alterar quantidade
- Criar sub-contas

✅ **Pagamento**
- Múltiplos métodos: NUMERÁRIO, TPA, TRANSFERÊNCIA, CONTA CORRENTE, QR_CODE
- Processamento de pagamento
- Cálculo automático com IVA

✅ **Gestão de Turnos**
- Abrir turno com saldo inicial
- Fechar turno
- Controlo de caixa

✅ **Impressão**
- Imprimir conta
- Imprimir cozinha (KDS)
- Múltiplas impressoras

✅ **Pesquisa e Filtros**
- Procurar por nome do prato
- Filtrar por categoria
- Visualizar por categoria

✅ **Display do Cliente**
- Exibição em monitor externo
- Atualização em tempo real

#### Como Usar:

1. **Selecione Mesa** - Clique em mesa no layout
2. **Adicione Itens** - Procure no menu e clique para adicionar
3. **Revise Ordem** - Modifique quantidades se necessário
4. **Processe Pagamento** - Clique "Checkout"
5. **Selecione Método** - Escolha forma de pagamento
6. **Finalize** - Confirme pagamento

---

## 📊 Fluxo de Utilizadores

### Scenario 1: Admin Gerencia Utilizadores

```
1. Admin entra no SISTEMA (Login)
2. Vai para CONFIGURAÇÕES → Acessos POS
3. Clica GERENCIAR UTILIZADORES
4. Modal abre com:
   - Formulário para criar novo
   - Lista de utilizadores
   - Permissões do role selecionado
5. Admin cria "João - GARCOM"
6. Sistema exibe todas as permissões de GARCOM
7. João agora pode fazer login e usar POS com restrições
```

### Scenario 2: Cliente Scaneaia QR Code Menu

```
1. Cliente em mesa ve QR code impresso
2. Abre câmara do telemóvel
3. Scanneia QR code
4. Browser abre URL configurada do menu
5. Menu digital exibe em HTML responsivo
6. Cliente vê prato, preço, descrição
7. Clica para fazer pedido (integração futura)
```

### Scenario 3: Operador Processa Venda

```
1. GARCOM seleciona mesa no POS
2. Adiciona pratos do menu
3. Clica CHECKOUT
4. Sistema calcula total com IVA
5. CAIXA processa pagamento (se não é GARCOM)
6. Conta é impressa
7. Mesa é liberada
```

---

## 🔐 Matriz de Permissões

| Permissão | ADMIN | CAIXA | GARCOM | COZINHA |
|-----------|-------|-------|--------|---------|
| CREATE_ORDER | ✅ | ✅ | ✅ | ❌ |
| EDIT_ORDER | ✅ | ✅ | ✅ | ❌ |
| DELETE_ORDER | ✅ | ❌ | ❌ | ❌ |
| PAY_ORDER | ✅ | ✅ | ❌ | ❌ |
| VIEW_FINANCIAL | ✅ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |
| VIEW_KITCHEN | ✅ | ❌ | ❌ | ✅ |
| PRINT_BILL | ✅ | ✅ | ✅ | ❌ |
| APPLY_DISCOUNT | ✅ | ✅ | ❌ | ❌ |
| MANAGE_TABLES | ✅ | ✅ | ✅ | ❌ |
| QR_MENU_CONFIG | ✅ | ❌ | ❌ | ❌ |

---

## 📁 Arquivos Criados/Modificados

### ✨ Novos Arquivos:
1. **services/permissionsService.ts** - Sistema de permissões (150 linhas)
2. **components/UserManagementModal.tsx** - Gestão de utilizadores (270 linhas)
3. **components/QRMenuConfig.tsx** - Configuração QR Menu (200 linhas)

### 🔧 Arquivos Modificados:
1. **types.ts** - Adicionado qrMenuUrl, qrMenuShortCode
2. **pages/Settings.tsx** - Integração de novos componentes e abas

---

## 🚀 Como Testar

### 1. Criar Novo Utilizador:
1. Acesse http://localhost:5173/#/settings
2. Clique aba "Acessos POS"
3. Clique "Gerenciar Utilizadores"
4. Preencha dados e clique "Criar Utilizador"
5. Novo utilizador aparece na lista

### 2. Testar Permissões:
1. Mude Role para "CAIXA" no formulário
2. Veja que as permissões mudam dinamicamente
3. Crie utilizador com cada role
4. Login com cada um e veja menus diferentes

### 3. Configurar QR Code Menu:
1. Acesse aba "Digital Menu"
2. Clique "Configurar Menu QR"
3. Deixe URL vazia (usa padrão) ou insira personalizada
4. Clique "Guardar Configuração"
5. Clique "Testar Menu no Browser"
6. Clique "Baixar QR Code (PNG)"

### 4. Usar POS Terminal:
1. Acesse http://localhost:5173/#/pos
2. Clique em uma mesa no painel esquerdo
3. Procure item no menu ("Pizza", "Cerveja", etc.)
4. Clique para adicionar
5. Clique "Checkout"
6. Selecione método de pagamento
7. Confirme

---

## ✅ Checklist de Implementação

- [x] Sistema de permissões com 17 permissões
- [x] Modal de gestão de utilizadores (criar, editar, eliminar)
- [x] Exibição de permissões por role
- [x] Configuração de QR Code Menu digital
- [x] URL personalizada ou padrão
- [x] Pré-visualização e download de QR Code
- [x] Integração em Settings com novas abas
- [x] Suporte a layout de sala (já funcional)
- [x] POS terminal completo (já funcional)
- [x] Controlo de permissões integrado

---

## 🎯 Próximas Melhorias (Opcional)

1. **Auditoria** - Log de quem fez cada ação
2. **2FA** - Autenticação em dois fatores
3. **Histórico de Utilizadores** - Ver ações por utilizador
4. **Relatórios de Permissões** - Quem tem acesso a quê
5. **Exportação de QR Codes** - Em lote para várias mesas
6. **Integração Biométrica** - FingerPrint para login

---

## 📞 Suporte

Para adicionar novas permissões:
1. Abra `services/permissionsService.ts`
2. Adicione à type `Permission`
3. Adicione ao objeto `rolePermissions`
4. Adicione descrição em `permissionDescriptions`

Para customizar roles:
1. Modifique `rolePermissions` conforme necessário
2. As permissões atualizam automaticamente nos componentes

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Completo e Funcional
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
