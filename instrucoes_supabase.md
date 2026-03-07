# 🔧 CORRIGIR ERRO DE PERMISSÃO SUPABASE

## PROBLEMA
```
ERROR: 42501: must be owner of table payroll
```

## CAUSA
O usuário atual não tem permissão de owner na tabela payroll no Supabase.

## SOLUÇÕES

### OPÇÃO 1: USAR ROLE CORRETO
1. Vá para [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `myppylcyupoirizyxhpo`
3. Vá para **Settings** → **Database**
4. Procure por **"Roles"** ou **"Authentication"**
5. Verifique se você tem a role correta (postgres, service_role, etc.)

### OPÇÃO 2: CONECTAR COM USUÁRIO OWNER
1. No Supabase Dashboard, vá para **Settings** → **Database**
2. Encontre **"Connection string"** ou **"Connection parameters"**
3. Use as credenciais do owner do banco
4. Conecte diretamente com psql ou ferramenta de DB

### OPÇÃO 3: VIA API COM SERVICE ROLE
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` no seu `.env`
2. Use a service role key em vez da anon key
3. A service role tem permissões elevadas

### OPÇÃO 4: RECREAR TABELA (DRÁSTICO)
```sql
-- Backup dos dados existentes
CREATE TABLE payroll_backup AS SELECT * FROM payroll;

-- Deletar tabela atual
DROP TABLE payroll;

-- Recriar tabela com todas as colunas
CREATE TABLE payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  staff_name VARCHAR(255) DEFAULT '',
  month VARCHAR(7) DEFAULT '',
  year INTEGER DEFAULT 2026,
  base_salary DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  overtime_rate DECIMAL(12,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  bonuses DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Restaurar dados
INSERT INTO payroll SELECT * FROM payroll_backup;

-- Limpar backup
DROP TABLE payroll_backup;
```

## RECOMENDAÇÃO
**Use a OPÇÃO 4 (recriar tabela)** apenas se tiver backup dos dados ou se a tabela estiver vazia.

**Para produção, use a OPÇÃO 1 ou 2** para manter os dados existentes.
