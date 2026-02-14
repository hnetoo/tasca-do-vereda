# Processo de Backup e Restauro Seguro (V2)

## Visão Geral
Este documento descreve o novo processo de restauração segura implementado na versão 1.1.59+, desenhado para garantir a integridade total dos dados e eliminar inconsistências históricas (como a criação indevida da categoria "Bebidas" ou produtos órfãos).

## Principais Alterações
1.  **Limpeza Profunda (Deep Wipe):** Antes de qualquer restauro, o sistema executa uma limpeza completa:
    *   **SQL:** `DROP TABLE` e `CREATE TABLE` são executados para `menu_categories` e `dishes`, garantindo um schema limpo e sem resíduos.
    *   **State:** O estado da aplicação em memória é zerado (`[]`).
2.  **Schema Estrito:** O schema do banco de dados foi alinhado para incluir `sort_order` e `is_active`, garantindo consistência entre SQL e Aplicação.
3.  **Regras de Negócio de Integridade:**
    *   **Proibição de Adivinhação:** O sistema NUNCA tenta adivinhar a categoria de um produto se o ID não for encontrado.
    *   **Fallback Seguro:** Produtos sem categoria válida são atribuídos explicitamente à categoria `uncategorized` ("Sem Categoria").
    *   **Extinção de "Bebidas":** A lógica que criava ou restaurava automaticamente "Bebidas" como fallback foi removida.

## Fluxo de Restauro (`restoreMenuData`)

1.  **Notificação:** Informa o utilizador do início do processo seguro.
2.  **Recreação do Schema:** Chama `databaseOperations.recreateMenuSchema()` para resetar as tabelas SQLite.
3.  **Reset de Estado:** Define `categories` e `menu` como arrays vazios.
4.  **Carregamento de Backup:**
    *   Tenta carregar do **Backup Local** (`backupService`) primeiro.
    *   Se o local estiver vazio, tenta carregar da **Cloud (Firebase)**.
5.  **Validação e Reparação:**
    *   Verifica cada produto restaurado.
    *   Se a categoria do produto não existe no set de categorias restauradas, o `categoryId` é alterado para `'uncategorized'`.
    *   Se necessário, cria a categoria "Sem Categoria".
6.  **Aplicação:** O estado limpo e validado é aplicado à store.
7.  **Persistência:** O novo estado é salvo imediatamente como o novo "Auto Backup".

## Validação de Integridade
O sistema garante que:
*   Não existem produtos com `categoryId` apontando para IDs inexistentes.
*   Não existem categorias duplicadas.
*   A ordem das categorias é preservada (se suportada pelo backup).

## Testes
Os testes unitários para este processo encontram-se em `services/restore.test.ts` e validam:
*   Limpeza do DB antes do restauro.
*   Atribuição correta de produtos órfãos.
*   Fallback para Cloud.
