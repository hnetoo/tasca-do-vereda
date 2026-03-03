# =============================================
# SUPABASE CLI - INSTRUÇÕES DE USO
# =============================================

# 1. INSTALAR SUPABASE CLI (se ainda não tiver)
# npm install -g supabase

# 2. FAZER LOGIN NO SUPABASE
# supabase login

# 3. LINKAR COM O PROJETO
# supabase link --project-ref <your-project-ref>

# 4. EXECUTAR A MIGRATION
# supabase db push

# 5. VERIFICAR STATUS
# supabase db status

# 6. GERAR TYPES (opcional)
# supabase gen types typescript --local > src/types/supabase.ts

# =============================================
# COMANDOS ÚTEIS
# =============================================

# Verificar migrações pendentes
# supabase db diff

# Resetar banco local (cuidado!)
# supabase db reset

# Verificar logs
# supabase logs

# =============================================
# ESTRUTURA CRIADA
# =============================================

# ✅ 21 tabelas completas
# ✅ Índices para performance
# ✅ Triggers para timestamps
# ✅ RLS (Row Level Security)
# ✅ Funções úteis
# ✅ Views para analytics
# ✅ Dados iniciais

# =============================================
# TABELAS CRIADAS
# =============================================

# 1. employees - Funcionários
# 2. roles - Cargos/Funções
# 3. restaurant_tables - Mesas
# 4. menu_categories - Categorias do Menu
# 5. suppliers - Fornecedores
# 6. dishes - Pratos/Produtos
# 7. customers - Clientes
# 8. orders - Pedidos
# 9. order_items - Itens dos Pedidos
# 10. expenses - Despesas
# 11. payroll - Folha Salarial (CORRIGIDA!)
# 12. reservations - Reservas
# 13. cash_shifts - Turnos de Caixa
# 14. deliveries - Entregas
# 15. revenues - Receitas
# 16. transactions - Transações
# 17. stock_items - Stock
# 18. attendance_records - Presença
# 19. daily_analytics - Analytics
# 20. audit_logs - Auditoria
# 21. settings - Configurações

# =============================================
# PROBLEMAS CORRIGIDOS
# =============================================

# ❌ payroll_records → ✅ payroll
# ❌ categories → ✅ menu_categories
# ❌ menu_items → ✅ order_items
# ❌ funcionarios → ✅ employees
# ❌ folha_pagamento → ✅ payroll

# =============================================
# COMPATIBILIDADE 100%
# =============================================

# Todas as APIs vão funcionar:
# ✅ /api/orders
# ✅ /api/expenses
# ✅ /api/payroll
# ✅ /api/dishes
# ✅ /api/tables
# ✅ /api/reservations
# ✅ /api/owner-data

# Forms vão salvar:
# ✅ Despesas (sem erro menu_items)
# ✅ Folha salarial (sem erro tabela)
# ✅ Pedidos (estrutura correta)
# ✅ Reservas (campos corretos)

# Owner mobile vai mostrar:
# ✅ Cards com dados reais
# ✅ Vendas, despesas, folha
# ✅ Analytics funcionando
