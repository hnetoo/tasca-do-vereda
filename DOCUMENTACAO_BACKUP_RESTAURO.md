# 💾 Manual de Backup e Restauro de Dados
**Tasca Do VEREDA - Sistema de Gestão Inteligente**

---

Este documento descreve os procedimentos para realizar cópias de segurança (backup) e restaurar os dados do sistema, garantindo a segurança da informação e facilitando a migração para novas instalações.

## 1. Método Recomendado (In-App)

O sistema possui uma ferramenta integrada de backup e restauro que é a forma mais segura e simples de gerir os seus dados.

### 1.1. Como fazer Backup
1.  Abra a aplicação e faça login com um utilizador com permissões de **ADMIN** ou **GERENTE**.
2.  Aceda ao menu **Definições** (⚙️) na barra lateral.
3.  Selecione a aba **Database** (ícone de base de dados).
4.  Localize a secção **Backup e Restauro**.
5.  Clique no botão **"Fazer Backup"**.
6.  O sistema irá gerar um ficheiro `.json` (ex: `tasca_backup_2024-02-01.json`) contendo todos os dados (Menu, Vendas, Clientes, Configurações).
7.  Guarde este ficheiro num local seguro (pen drive, cloud, ou disco externo).

### 1.2. Como Restaurar Dados (ou Migrar para Novo PC)
Este procedimento substitui todos os dados atuais pelos dados do backup.

1.  Numa nova instalação (ou na atual, se pretender recuperar dados antigos):
2.  Aceda a **Definições** -> **Database**.
3.  Na secção **Backup e Restauro**, clique em **"Restaurar Backup"**.
4.  Selecione o ficheiro `.json` que gerou anteriormente.
5.  Confirme a operação na mensagem de aviso.
6.  O sistema irá carregar os dados e reiniciar automaticamente.

---

## 2. Método Manual (Avançado)

Caso não consiga aceder à aplicação, pode copiar manualmente os ficheiros de dados do sistema operativo. Este método requer conhecimentos técnicos.

### 2.1. Localização dos Dados (Windows)
Os dados da aplicação (baseada em Tauri/WebView2) estão localizados em:

`%LOCALAPPDATA%\com.tasca-do-vereda.app\`

Para fazer backup manual:
1.  Feche completamente a aplicação.
2.  Navegue até à pasta acima (pode colar o caminho na barra de endereço do Explorador de Ficheiros).
3.  Copie toda a pasta `EBWebView` para um local seguro.

### 2.2. Restaurar Manualmente
1.  Instale a aplicação no novo computador.
2.  Abra-a uma vez e feche-a (para criar as pastas iniciais).
3.  Vá até `%LOCALAPPDATA%\com.tasca-do-vereda.app\` no novo computador.
4.  Substitua a pasta `EBWebView` pela sua cópia de segurança.
5.  Abra a aplicação.

> **Nota:** Este método copia também a sessão de login e cache do navegador, podendo ser mais instável que o método In-App.

---

## 3. Base de Dados SQL (Opcional)

Se o sistema estiver configurado para usar SQLite (modo avançado definido em `services/database/config.ts`), deve também fazer backup do ficheiro da base de dados.

*   **Ficheiro:** `tasca.db`
*   **Localização:** Diretório de instalação ou diretório de dados da aplicação.

Para restaurar, basta substituir o ficheiro `tasca.db` na nova instalação.

---

**Suporte Técnico:**
Em caso de dúvidas ou corrupção de dados, contacte o suporte técnico antes de tentar procedimentos manuais avançados.
