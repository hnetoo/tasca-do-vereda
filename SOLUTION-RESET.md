# SOLUÇÃO DEFINITIVA - RESET COMPLETO

## PROBLEMA:
- Mudança de base de dados sem migração adequada
- Erro 406 persistente
- Login não funciona

## SOLUÇÃO:
Criar novo projeto limpo com configuração correta desde o início

## PASSOS:

### 1. CRIAR NOVO PROJETO NO SUPABASE
- Ir para https://supabase.com/dashboard
- Criar novo projeto: "tasca-do-vereda-v2"
- Copiar URL e keys

### 2. ATUALIZAR VARIÁVEIS DE AMBIENTE
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL="https://[NOVO-PROJETO].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[NOVA-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[NOVA-SERVICE-KEY]"
DATABASE_URL="[NOVA-DATABASE-URL]"
```

### 3. RODAR MIGRAÇÃO LIMPA
- Usar migration completa já criada
- Criar todas as tabelas do zero
- Inserir dados iniciais

### 4. TESTAR LOGIN IMEDIATAMENTE
- PIN: 1234
- Role: ADMIN
- Deve funcionar na primeira tentativa

## VANTAGENS:
✅ Sem conflitos de configuração
✅ Base de dados limpa
✅ Migração do zero
✅ Login funcional imediato
✅ Todos os recursos funcionando

## TEMPO ESTIMADO:
- Criar projeto Supabase: 2 min
- Atualizar variáveis: 1 min  
- Deploy: 2 min
- Testar: 1 min
- **TOTAL: 6 minutos**

Esta é a maneira mais rápida e garantida de resolver todos os problemas!
