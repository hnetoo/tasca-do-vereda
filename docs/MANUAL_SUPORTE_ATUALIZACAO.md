# Manual de Suporte Técnico e Procedimentos de Atualização (v1.1.45)

Este documento descreve os procedimentos técnicos para a instalação, atualização e rollback do aplicativo **Tasca do Vereda - Gestão Inteligente**.

## 1. Pré-requisitos de Sistema

Antes de iniciar a instalação da versão 1.1.45, certifique-se de que o ambiente atende aos seguintes requisitos:

*   **Sistema Operacional**: Windows 10 (versão 1809 ou superior) ou Windows 11 (64-bit).
*   **Permissões**: Acesso de Administrador local para instalação.
*   **Espaço em Disco**: Mínimo de 500 MB livres.
*   **Runtime**: WebView2 Runtime (geralmente pré-instalado no Windows 10/11).

## 2. Procedimentos de Backup (Antes da Atualização)

Embora o instalador seja projetado para preservar os dados, recomenda-se realizar um backup preventivo.

### 2.1. Backup dos Dados Locais (Configurações e Logs)
Os dados da aplicação são armazenados no diretório `AppData`.

1.  Feche completamente a aplicação.
2.  Abra o **Executar** (`Win + R`) e digite `%localappdata%`.
3.  Localize a pasta `com.tasca-do-vereda.client` (ou `tasca-do-vereda`).
4.  Copie esta pasta para um local seguro (ex: `C:\Backups\TascaVereda_v1.1.43`).

### 2.2. Verificação de Sincronização
Certifique-se de que todos os dados críticos (pedidos, menu) foram sincronizados com o Firebase antes de fechar a aplicação. Verifique o indicador de status de conexão no canto superior direito da aplicação.

## 3. Instalação da Atualização (Versão 1.1.45)

A versão 1.1.45 é distribuída como um pacote MSI.

### 3.1. Instalação Padrão (Interface Gráfica)
1.  Execute o arquivo `Tasca Do VEREDA_1.1.45_x64_en-US.msi`.
2.  Siga as instruções do assistente de instalação.
3.  A versão anterior será detectada e atualizada automaticamente.

### 3.2. Instalação Silenciosa (Deployment em Massa)
Para administradores de sistema, utilize o seguinte comando no PowerShell ou CMD (como Administrador):

```powershell
msiexec /i "Tasca Do VEREDA_1.1.45_x64_en-US.msi" /quiet /norestart
```

### 3.3. Instalação com Log Detalhado
Para diagnosticar problemas durante a instalação, gere um log detalhado:

```powershell
msiexec /i "Tasca Do VEREDA_1.1.45_x64_en-US.msi" /l*v "install_log.txt"
```

## 4. Verificação Pós-Instalação

Após a instalação:
1.  Inicie a aplicação.
2.  Verifique se a versão exibida nas Configurações é `1.1.45`.
3.  Confirme se o login automático (se configurado) funcionou.
4.  Verifique se os itens do menu e histórico de pedidos estão visíveis.

**Correções Incluídas na v1.1.45:**
*   Correção crítica na navegação de submenus do Menu Digital (Public Menu).
*   Resolução de problema onde a seleção de categorias após "Fast Food" falhava.
*   Otimização da renderização de categorias para evitar IDs duplicados.
*   Correção do desaparecimento aleatório de elementos da UI (Logger integrado).
*   Melhorias de segurança e performance.

## 5. Procedimentos de Rollback (Reversão)

Caso a nova versão apresente instabilidade crítica, siga estes passos para reverter para a versão anterior.

### 5.1. Desinstalação da Versão Atual
1.  Acesse **Configurações > Aplicativos > Aplicativos Instalados**.
2.  Localize "Tasca Do VEREDA".
3.  Clique em **Desinstalar**.

### 5.2. Reinstalação da Versão Anterior
1.  Localize o instalador da versão anterior (ex: v1.1.43 ou v1.1.42).
2.  Execute a instalação padrão.

### 5.3. Restauração de Dados (Se necessário)
Se houver perda de configurações locais:
1.  Feche a aplicação recém-instalada.
2.  Acesse `%localappdata%`.
3.  Substitua a pasta `com.tasca-do-vereda.client` pela cópia de backup realizada no passo 2.1.
4.  Reinicie a aplicação.

## 6. Suporte Técnico

Para reportar erros, envie o arquivo de log gerado pela aplicação:
*   **Local do Log**: Acessível via Console de Desenvolvedor ou exportado nas Configurações (quando disponível).
*   **Logs de Instalação**: Envie o arquivo `install_log.txt` se o erro ocorreu durante o setup.

---
**Data de Emissão**: 2026-02-02
**Responsável**: Equipa de Desenvolvimento REST AI
