# 📘 DOCUMENTAÇÃO TÉCNICA DETALHADA
**Projeto:** Tasca Do VEREDA - Sistema de Gestão Inteligente
**Versão:** 1.1.36
**Data:** 01/02/2026

---

## 1. 🏗️ Arquitetura do Sistema

O sistema utiliza uma arquitetura **Desktop Híbrida** baseada em **Tauri v2**, combinando a performance e segurança do **Rust** no backend com a flexibilidade do **React** no frontend. Adicionalmente, integra-se com **Firebase** para sincronização em tempo real de menus digitais.

### 1.1. Diagrama de Camadas
```mermaid
graph TD
    UI[Frontend (React + TS)] <-->|IPC / Events| Core[Tauri Core (Rust)]
    UI -->|State| Store[Zustand Store]
    Store -->|Persist| Storage[Local Storage / FileSystem]
    Core -->|OS Calls| OS[Sistema Operativo (Windows)]
    UI -->|REST| AI[Google Gemini API]
    UI -->|XML| SAFT[Motor de Exportação AGT]
    UI -->|Sync| Firebase[Firebase Firestore/Storage]
```

### 1.2. Componentes Principais
*   **Frontend (UI/UX):** Responsável por toda a lógica de negócio, interação com utilizador e gestão de estado.
*   **Tauri Core (Backend):** Responsável pela gestão da janela, menu de sistema, sistema de arquivos e operações de baixo nível.
*   **Persistence Layer:** Camada de persistência de dados utilizando JSON Storage local.
*   **Integration Layer:** Serviços de comunicação com APIs externas (Google AI, Firebase).
*   **Sync Engine:** Sincronização automática de menus e imagens com Firebase para Menu Digital.

---

## 2. 🛠️ Stack Tecnológico

### 2.1. Frontend (Interface)
*   **Framework:** React 18
*   **Linguagem:** TypeScript 5.x
*   **Build Tool:** Vite 5.x
*   **Estilização:** TailwindCSS 3.4 + Autoprefixer
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts (para Dashboards)
*   **Internacionalização:** i18next (Suporte PT-AO)

### 2.2. State Management & Lógica
*   **Library:** Zustand 4.5
*   **Middleware:** `persist` (para salvaguarda de dados), `createJSONStorage`.
*   **Padrão:** Flux-like, com stores divididas por domínio (Users, Orders, Inventory, etc.).

### 2.3. Backend (Core)
*   **Runtime:** Tauri 2.9 (Rust 1.77+)
*   **Crates Principais:**
    *   `serde`/`serde_json`: Serialização de dados.
    *   `tauri-plugin-log`: Sistema de logs.
    *   `anyhow`: Gestão de erros.

### 2.4. Inteligência Artificial
*   **Provider:** Google Gemini (Google GenAI SDK)
*   **Modelos:** `gemini-3-flash-preview`
*   **Funcionalidades:** Análise de vendas, sugestão de menus, relatórios mensais automáticos.

### 2.5. Cloud & Sync
*   **Provider:** Firebase (Google)
*   **Serviços:** Firestore (Base de dados NoSQL), Hosting (Menu Digital Web).
*   **Features:** Sincronização automática de categorias e produtos, Otimização de Imagens.

---

## 3. 📦 Módulos do Sistema

### 3.1. POS (Ponto de Venda)
*   **Gestão de Mesas:** Grid interativo com estados (Livre, Ocupada, Pagamento).
*   **Pedidos:** Carrinho de compras com suporte a variantes e observações.
*   **Checkout:** Múltiplos métodos de pagamento (Numerário, TPA, Transferência).
*   **Faturação:** Emissão de documentos certificados (FT, FR, VD, NC).

### 3.2. Gestão de Stock (Inventário)
*   **Rastreio:** Atualização em tempo real após cada venda (dedução automática).
*   **Alertas:** Notificações de stock baixo baseadas em `minThreshold`.
*   **Fichas Técnicas:** Composição de pratos (Dish) baseada em ingredientes (StockItem).
*   **Otimização de Imagens:** Compressão automática via Canvas API (max 800px, JPEG 0.7) para performance no Menu Digital.

### 3.3. Recursos Humanos (Compliance Angola)
*   **Processamento Salarial:**
    *   Cálculo automático de **IRT** (Tabela 2024 AGT).
    *   Cálculo de **INSS** (3.6% Trabalhador).
*   **Assiduidade:** Registo de Check-in/Check-out.
*   **Performance:** Avaliação automática baseada em vendas e assiduidade (algoritmo interno).

### 3.4. Compliance AGT (Fiscal)
*   **SAF-T (AO):** Motor de exportação XML compatível com v1.01.
*   **Assinatura Digital:** Algoritmo de hashing (RSA-SHA1 simulado/implementado) para encadeamento de faturas.
*   **Regras de Imutabilidade:** Bloqueio de edição de documentos fiscais após emissão.

### 3.5. Menu Digital (Web)
*   **Acesso:** Via QR Code.
*   **Sincronização:** Atualização automática quando o inventário é alterado no Desktop.
*   **Interface:** Otimizada para mobile, visualização de produtos e categorias.

### 3.6. Documentação Integrada
*   **Manual Interativo:** Visualizador de documentação in-app com parser Markdown.
*   **Conteúdo:** Manuais de Utilizador e Administrador acessíveis offline.
*   **Controle de Acesso:** Manual de Admin restrito a cargos de gestão (ADMIN, GERENTE).

---

## 4. 💾 Fluxo de Dados e Persistência

### 4.1. Estrutura da Store (Zustand)
O estado global é mantido num objeto monolítico persistido, contendo:
```typescript
interface StoreState {
  users: User[];            // Utilizadores e Permissões
  employees: Employee[];    // Dados de RH
  menu: Dish[];             // Catálogo de Produtos
  stock: StockItem[];       // Inventário
  activeOrders: Order[];    // Pedidos em aberto e histórico
  customers: Customer[];    // Base de dados de clientes
  settings: SystemSettings; // Configurações (NIF, Taxas, Impressoras)
  // ... (métodos de ação)
}
```

### 4.2. Persistência
*   **Mecanismo:** `localStorage` (Web) / JSON File (Desktop via Tauri Adapter).
*   **Estratégia:** `persist` middleware com `JSON.stringify`.
*   **Backup:** O sistema carrega o estado total na inicialização.

### 4.3. Backup e Restauro (Novo)
*   **Exportação:** Gera ficheiro JSON completo do estado atual (`tasca_backup_YYYY-MM-DD.json`).
*   **Importação:** Valida e carrega ficheiro JSON, substituindo o estado atual (Hard Reset).
*   **Segurança:** Apenas administradores podem restaurar backups.

---

## 5. 🤖 Integrações de IA

### 5.1. `GeminiService`
Serviço dedicado à comunicação com a Google AI.
*   **Análise de Negócio:** Envia totais de vendas e contagens para receber "Insights" estratégicos.
*   **Geração de Relatórios:** Criação de texto narrativo para relatórios mensais.
*   **Menu Engineering:** Sugestão de pratos baseados em ingredientes em excesso no stock (para redução de desperdício).

---

## 6. 🔒 Segurança

### 6.1. Autenticação e Autorização
*   **Login:** Baseado em PIN numérico.
*   **RBAC (Role-Based Access Control):**
    *   `ADMIN`: Acesso total.
    *   `GERENTE`: Acesso a relatórios e anulações.
    *   `CAIXA`: Acesso a POS e Pagamentos.
    *   `GARCOM`: Acesso apenas a Pedidos e Mesas.

### 6.2. Proteção de Dados
*   Isolamento de ambiente (Sandboxing do Tauri).
*   API Keys (Google AI, Firebase) injetadas via variáveis de ambiente.

---

## 7. 🚀 Build e Distribuição

### 7.1. Comandos de Build
*   **Dev:** `npm run tauri:dev` (Vite Server + Tauri Core).
*   **Prod:** `npm run tauri:build` (Otimização de assets + Compilação Rust + Criação de Instalador).

### 7.2. Formatos de Saída (Windows)
*   **MSI:** Microsoft Installer (recomendado para empresas).
*   **NSIS:** Executável de instalação padrão (.exe).

---

**Nota Técnica:** Este projeto foi migrado de uma base Electron para Tauri para melhorar a performance, reduzir o tamanho do executável (de ~100MB para ~10MB) e aumentar a segurança nativa.
