# Guia de Migração e Deploy - Tasca do Vereda

Este documento descreve a migração abrangente criada para estruturar o banco de dados Supabase da aplicação, garantindo segurança, integridade de dados e funcionalidades em tempo real para o dashboard financeiro.

## Visão Geral

A migração (`supabase/migrations/20260222130000_comprehensive_schema.sql`) define a estrutura completa do banco de dados, incluindo tabelas, políticas de segurança (RLS), gatilhos (triggers) e configurações de tempo real.

### Principais Componentes

1.  **Tabelas Estruturadas:**
    *   `employees`: Usuários do sistema com roles (ADMIN, OWNER, WAITER, etc.).
    *   `menu_categories`, `dishes`, `stock_items`: Gestão de inventário e menu.
    *   `restaurant_tables`: Layout e estado das mesas.
    *   `orders`, `order_items`: Pedidos e itens associados.
    *   `expenses`, `revenues`, `payroll_records`: Registos financeiros detalhados.
    *   `transactions`: Tabela consolidada para o dashboard financeiro em tempo real.
    *   `cash_shifts`: Gestão de turnos de caixa.

2.  **Segurança (Row Level Security - RLS):**
    *   **Admin/Owner:** Acesso total a todas as tabelas, especialmente financeiras (`transactions`, `expenses`, `revenues`).
    *   **Staff:** Acesso restrito a leitura/escrita em `orders`, `order_items`, `restaurant_tables`. Sem acesso direto a dados financeiros sensíveis.
    *   **Público:** Leitura de `menu_categories` e `dishes` (para menu digital).

3.  **Automação Financeira (Triggers):**
    *   Implementamos **Database Triggers** para garantir que qualquer inserção em `expenses`, `revenues`, `payroll_records` ou conclusão de `orders` gere automaticamente um registo na tabela `transactions`.
    *   Isso assegura que o **Dashboard Financeiro (Admin/Owner)** mostre dados em tempo real sem depender da lógica do frontend, garantindo consistência total.

4.  **Realtime:**
    *   Habilitado para tabelas críticas: `orders` (para cozinha/bar), `transactions` (para admin), `restaurant_tables` (para sala).

## Instruções de Deploy

Para aplicar esta migração ao seu projeto Supabase:

### Pré-requisitos
*   Supabase CLI instalado e autenticado.
*   Projeto Supabase criado.

### Passos
1.  **Navegue até a raiz do projeto:**
    ```bash
    cd c:\Users\hneto\tasca-do-vereda---gestão_msi_vscode
    ```

2.  **Aplique a migração:**
    ```bash
    supabase db push
    ```
    *Ou, se estiver usando apenas a interface web do Supabase:*
    *   Copie o conteúdo de `supabase/migrations/20260222130000_comprehensive_schema.sql`.
    *   Cole no Editor SQL do Supabase Dashboard.
    *   Execute o script.

3.  **Verificação:**
    *   Acesse o Supabase Dashboard -> Table Editor.
    *   Verifique se as tabelas (`transactions`, `orders`, etc.) foram criadas.
    *   Verifique em Database -> Replication se `supabase_realtime` inclui as tabelas mencionadas.

## Instruções de Rollback

Caso seja necessário reverter as alterações, utilize o script de rollback fornecido:

1.  **Localize o script:** `supabase/migrations/20260222130000_comprehensive_schema_down.sql`
2.  **Execute via SQL Editor:** Copie e cole o conteúdo no SQL Editor do Supabase e execute.
    *   *Atenção:* Isso apagará todas as tabelas e dados criados pela migração.

## Testes e Validação

Para validar que as políticas de segurança e a estrutura do banco de dados estão corretas:

1.  **Execute o script de teste:**
    *   Arquivo: `supabase/tests/security_policies.sql`
    *   Ferramenta: Supabase SQL Editor ou CLI (`supabase test db`)
    *   Este script utiliza `pgTAP` para verificar a existência de tabelas, RLS ativado, políticas e triggers.

## Decisões de Design

*   **Tabela `transactions` Consolidada:** Optamos por uma tabela central de transações alimentada por triggers para performance e simplicidade no frontend. O dashboard apenas "escuta" esta tabela.
*   **Triggers vs Aplicação:** A lógica de inserção financeira foi movida para o banco de dados (Triggers) para evitar discrepâncias caso a aplicação falhe ou existam múltiplas fontes de dados (ex: app móvel, painel web).
*   **Foreign Keys em `transactions`:** Adicionamos `expense_id`, `revenue_id`, `order_id` para rastreabilidade total. É possível clicar numa transação e saber exatamente qual pedido ou despesa a originou.
*   **Roles:** Uso estrito de `is_admin_or_owner()` para proteger dados financeiros.

## Suporte

Para dúvidas ou ajustes, consulte a documentação oficial do Supabase ou contacte o administrador do sistema.
