# Guia de Configuração SQL - Tasca do Vereda

Este guia explica como configurar e alternar entre os diferentes modos de base de dados suportados pela aplicação (LocalStorage, SQLite, PostgreSQL, MySQL).

## 1. Visão Geral da Arquitetura

A aplicação suporta um modelo híbrido de armazenamento de dados:

*   **LocalStorage (Padrão):** Dados armazenados no navegador/webview. Ideal para testes rápidos e desenvolvimento sem dependências externas.
*   **SQL Nativo:** Conexão direta via Rust/Tauri para bancos de dados robustos. Recomendado para produção.

## 2. Pré-requisitos

Para utilizar os drivers SQL, certifique-se de que as dependências estão instaladas:

1.  A aplicação deve estar rodando em ambiente Desktop (Tauri).
2.  As dependências do Rust devem ter sido compiladas com o plugin SQL (já configurado no `src-tauri/Cargo.toml`).

## 3. Como Configurar

A configuração é centralizada num único arquivo TypeScript.

**Arquivo:** [`services/database/config.ts`](file:///c:/Users/hneto/tasca-do-vereda---gestão-inteligente_msi_vscode/services/database/config.ts)

### Passo a Passo:

1.  Abra o arquivo [`services/database/config.ts`](file:///c:/Users/hneto/tasca-do-vereda---gestão-inteligente_msi_vscode/services/database/config.ts).
2.  Localize a constante `dbConfig`.
3.  Altere o `type` e a `connectionString` conforme o banco desejado.

### Exemplos de Configuração

#### A. SQLite (Arquivo Local)
Ideal para instalações locais sem servidor de banco de dados complexo.

```typescript
export const dbConfig: DatabaseConfig = {
  type: 'sqlite',
  connectionString: 'sqlite:tasca.db', // Cria o arquivo na raiz da execução
};
```

#### B. PostgreSQL
Ideal para ambientes multi-usuário e alta performance.

```typescript
export const dbConfig: DatabaseConfig = {
  type: 'postgres',
  connectionString: 'postgres://usuario:senha@localhost:5432/nome_do_banco',
};
```

#### C. MySQL / MariaDB

```typescript
export const dbConfig: DatabaseConfig = {
  type: 'mysql',
  connectionString: 'mysql://usuario:senha@localhost:3306/nome_do_banco',
};
```

#### D. Voltar para LocalStorage (Padrão)

```typescript
export const dbConfig: DatabaseConfig = {
  type: 'local_storage',
  // connectionString não é necessário
};
```

## 4. Aplicando as Mudanças

Após alterar o arquivo de configuração:

1.  **Reinicie a Aplicação:** Como a conexão é estabelecida na inicialização dos serviços, é recomendável recarregar a aplicação (F5 ou reiniciar o executável).
2.  **Verifique a Conexão:**
    *   Vá para **Definições** > Aba **Integrações**.
    *   Role até a seção **Base de Dados (SQL Nativo)**.
    *   Verifique se o "Driver Ativo" corresponde à sua configuração.
    *   Clique em **Testar Conexão**.

## 5. Solução de Problemas

*   **Erro "Connection string is required":** Verifique se você definiu a `connectionString` no arquivo de configuração ao usar um tipo SQL.
*   **Erro de Conexão Recusada:** Verifique se o servidor de banco de dados (Postgres/MySQL) está rodando e se as credenciais estão corretas.
*   **SQLite não encontra o arquivo:** O caminho `sqlite:tasca.db` é relativo ao diretório de execução do binário. Para caminhos absolutos, use o formato adequado do seu sistema operacional.
*   **Plugin não carregado:** Se ocorrer erros de "plugin not found", certifique-se de ter rodado `npm install` e reconstruído o backend Rust (`npm run tauri dev` ou `npm run tauri build`).

## 6. Notas Técnicas

*   A camada de abstração está em [`services/database/connection.ts`](file:///c:/Users/hneto/tasca-do-vereda---gestão-inteligente_msi_vscode/services/database/connection.ts).
*   Funções disponíveis para desenvolvedores: `executeQuery` (para INSERT/UPDATE/DELETE) e `selectQuery` (para SELECT).
