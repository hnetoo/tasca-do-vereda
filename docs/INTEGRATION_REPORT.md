# Relatório de Integração e Performance - Encomendas & Menu Digital

**Data:** 2026-02-02
**Estado:** Concluído
**Versão:** 1.0.0

## 1. Visão Geral
Este documento detalha a implementação da integração entre o sistema de Encomendas, Menu Digital e Controlo de Stock em Tempo Real. A solução visa garantir a integridade do inventário, validação de pedidos e auditoria completa.

## 2. Correções Críticas (Hotfixes)
### 2.1. Erro de Tela Branca (Preview)
- **Problema:** A aplicação apresentava tela branca ao iniciar (`net::ERR_CONNECTION_REFUSED` ou falha silenciosa).
- **Causa Raiz:** O componente `App.tsx` dependia da função `setOnlineStatus` do `useStore`, que não estava definida na interface do estado global.
- **Resolução:** Adicionada a propriedade `onlineStatus` e a ação `setOnlineStatus` ao `useStore.ts`.

## 3. Integração de Stock em Tempo Real
### 3.1. Validação de Stock (`addToOrder`)
- **Lógica Implementada:**
  - Antes de adicionar qualquer item ao pedido, o sistema verifica se existe stock suficiente na tabela `StockItem`.
  - Se a quantidade solicitada exceder a disponível, o sistema bloqueia a ação e exibe uma notificação de erro.
  - **Fluxo:** `Dish` -> `stockItemId` -> `StockItem.quantity`.

### 3.2. Sincronização Automática
- **Dedução:** Ao adicionar um item ao pedido (`addToOrder`), o stock é **imediatamente deduzido**. Isso garante que o stock "reservado" não seja vendido para outro cliente (concorrência).
- **Restauração:**
  - **Remover Item:** Ao remover um item do pedido (`removeFromOrder`), o stock é restaurado.
  - **Cancelar Pedido:** Ao limpar um pedido (`clearDraftOrder`), todo o stock é devolvido.
  - **Libertar Mesa:** Ao fechar uma mesa sem finalizar venda (`closeTableWithoutOrders`), o stock dos pedidos abertos é restaurado.

### 3.3. API RESTful (`OrderService`)
- Os métodos do `orderService` foram atualizados para utilizar as ações seguras do `store`.
- `createOrder`: Delega a dedução de stock para o `addToOrder` para evitar duplicidade.
- `cancelOrder`: Utiliza `clearDraftOrder` para garantir restauração consistente.

## 4. Auditoria e Logs
Todas as transações críticas agora geram logs de auditoria (`AuditLog`):
- `STOCK_UPDATE`: Registado sempre que o stock muda (automático no `updateStockQuantity`).
- `ORDER_CREATED`: Registado ao criar um pedido via API/Menu Digital.
- `ORDER_CANCELLED`: Registado ao cancelar um pedido.
- `ORDER_FIRED`: Registado ao enviar pedido para a cozinha.

## 5. Testes de Cenário
### 5.1. Cenário de Erro
- **Teste:** Tentar adicionar 10 unidades de um item com apenas 5 em stock.
- **Resultado:** Notificação "Stock insuficiente... Restam: 5". Ação bloqueada.

### 5.2. Cenário de Concorrência
- **Teste:** Dois utilizadores tentam comprar o último item.
- **Resultado:** O primeiro a clicar reserva o stock. O segundo recebe erro de stock insuficiente (devido à dedução imediata).

## 6. Próximos Passos
- Implementar fila de sincronização offline para pedidos criados sem internet.
- Adicionar painel visual de "Logs de Integração" no Dashboard administrativo.
