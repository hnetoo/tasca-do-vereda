# RLS para Owner Dashboard

## Objetivo
- Permitir leitura apenas por usuários com role "owner" em todas as tabelas visíveis no dashboard.
- Proteger dados sensíveis com políticas específicas e verificações de permissão.

## Política: owner_can_select_categories
- Tabela: public.categories
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê lista de categorias.

## Política: public_can_select_categories_active
- Tabela: public.categories
- Operação: SELECT
- Condição: deleted_at IS NULL
- Propósito: Menu Digital lê categorias ativas sem autenticação (anon).

## Política: owner_can_select_menu_items
- Tabela: public.menu_items
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê itens do menu disponíveis.

## Política: public_can_select_menu_items_available
- Tabela: public.menu_items
- Operação: SELECT
- Condição: available = true AND deleted_at IS NULL
- Propósito: Menu Digital lê itens disponíveis sem autenticação (anon).
## Política: owner_can_select_restaurant_tables
- Tabela: public.restaurant_tables
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê layout e estado das mesas.

## Política: owner_can_select_employees
- Tabela: public.employees
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê funcionários e dados básicos.

## Política: owner_can_select_attendance_records
- Tabela: public.attendance_records
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê presença diária.

## Política: owner_can_select_payroll_records
- Tabela: public.payroll_records
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê registos de folha salarial.

## Política: owner_can_select_revenues
- Tabela: public.revenues
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê receitas para métricas financeiras.

## Política: owner_can_select_expenses
- Tabela: public.expenses
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê despesas para métricas financeiras.

## Política: owner_can_select_dashboard_summary
- Tabela: public.dashboard_summary
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê resumo agregado do dashboard.

## Política: owner_can_select_users
- Tabela: public.users
- Operação: SELECT
- Condição: auth.jwt() ->> 'role' = 'owner'
- Propósito: Dono vê utilizadores ativos para acesso ao dashboard.

## Verificações de permissão
- Todas as políticas exigem que o utilizador esteja autenticado (TO authenticated).
- Verificação via claim `role` presente no JWT.
- Recomenda-se incluir claim `role=owner` no JWT dos utilizadores owner.

## Testes de segurança
- Usuários sem claim `role=owner` devem receber erro 401/permission denied ao consultar.
- Testar acesso direto via REST da Supabase e via SDK para cada tabela.
