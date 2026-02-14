# Sistema de Sincronização e Recuperação de Categorias

## Visão Geral
Este documento descreve a implementação técnica do sistema de robustez para sincronização de categorias do menu, desenhado para prevenir perda de dados e garantir consistência entre o estado local (POS) e a cloud (Firebase).

## Problema Resolvido
O sistema anterior sofria de "perda implícita" de categorias, onde uma falha de carregamento ou estado vazio local poderia sobrescrever os dados na cloud durante a sincronização automática, resultando na perda de categorias previamente criadas.

## Arquitetura da Solução

### 1. Camada de Backup Local (`backupService.ts`)
Implementamos um serviço de backup local que persiste os dados críticos no `localStorage` do navegador/Tauri.

- **Auto-Backup**: Executado automaticamente antes de operações de sincronização.
- **Backup Manual**: Disponível para operações críticas.
- **Verificação de Integridade**: Um algoritmo heurístico verifica se o estado atual das categorias é válido antes de permitir operações destrutivas.
  - *Heurística*: Se o número de categorias cair drasticamente (ex: >80% de perda) em comparação com o backup, o sistema marca como `CORRUPTED`.

### 2. Sincronização Inteligente com Firebase (`firebaseService.ts`)

#### Mecanismo de Retry (Exponential Backoff)
Todas as operações críticas de rede agora utilizam um wrapper `retryOperation` que tenta reexecutar falhas transientes com atraso exponencial (1s, 2s, 4s...), garantindo resiliência contra instabilidade de rede.

#### Resolução de Conflitos (Merge Strategy)
Ao sincronizar, o sistema não sobrescreve cegamente. Ele aplica uma estratégia de **União (Merge)**:
1. Carrega categorias existentes na Cloud.
2. Combina com categorias locais.
3. Preserva categorias da Cloud que não existem localmente (recuperação automática).
4. Atualiza categorias locais na Cloud.

#### Safety Block (Bloqueio de Segurança)
Foi implementada uma guarda lógica que **impede** explicitamente que uma lista local vazia (`[]`) sobrescreva uma lista na Cloud que contenha dados. Se isso ocorrer, uma exceção é lançada e a sincronização é abortada.

### 3. Inicialização e Auto-Recuperação (`useStore.ts`)
No arranque da aplicação (`initializeStore`), o sistema executa:
1. **Check de Integridade**: Compara estado atual com backups.
2. **Auto-Restore**: Se o estado local estiver vazio ou corrompido:
   - Tenta restaurar do backup local.
   - Se falhar, tenta restaurar diretamente do Firebase (`restoreCategoriesFromCloud`).
3. **Notificação**: Informa o utilizador se dados foram recuperados automaticamente.

## Detalhes de Implementação

### Arquivos Principais
- `services/backupService.ts`: Lógica de persistência local e validação.
- `services/firebaseService.ts`: Lógica de sync, retry e merge.
- `store/useStore.ts`: Integração no ciclo de vida da aplicação.

### Testes (`services/categorySync.test.ts`)
Foram criados testes unitários utilizando `Vitest` para validar:
- Criação e leitura de backups.
- Validação de integridade (Detecção de estados `EMPTY`, `CORRUPTED`, `OK`).
- Filtragem de dados inválidos.

## Procedimento de Recuperação Manual
Caso a recuperação automática falhe, o sistema mantém backups no `localStorage` sob as chaves:
- `tasca_categories_backup_v1` (Backup manual/estável)
- `tasca_categories_auto_backup` (Último estado válido conhecido)

É possível extrair estes dados via DevTools (Application > Local Storage) se necessário.

## Conclusão
Esta arquitetura garante que:
1. Dados nunca são perdidos por sobrescrita acidental.
2. Falhas de rede são toleradas.
3. O sistema se autocorrige ao reiniciar em caso de falha catastrófica de estado em memória.
