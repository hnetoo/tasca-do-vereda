# 📋 PASSO A PASSO - CORRIGIR PERMISSÃO SUPABASE

## 🎯 OBJETIVO
Corrigir o erro `ERROR: 42501: must be owner of table payroll` ajustando a role do usuário no Supabase.

---

## 🚀 PASSO A PASSO COMPLETO

### PASSO 1: ACESSAR SUPABASE DASHBOARD
1. **Abra o navegador**
2. **Vá para:** https://supabase.com/dashboard
3. **Faça login** com sua conta
4. **Selecione seu projeto:** `myppylcyupoirizyxhpo`

### PASSO 2: NAVEGAR ATÉ SETTINGS
1. **No menu lateral esquerdo**, clique em **⚙️ Settings**
2. **Aguarde carregar** a página de configurações
3. **Procure pela seção** **Database**

### PASSO 3: ACESSAR ROLES
1. **Na seção Database**, procure por:
   - **"Roles"** OU
   - **"Authentication"** OU
   - **"Database Settings"**
2. **Clique em "Roles"** para expandir

### PASSO 4: VERIFICAR ROLES ATUAIS
1. **Procure por:** `postgres`, `service_role`, `authenticated`, `anon`
2. **Verifique qual role** você está usando atualmente
3. **Anote** as roles disponíveis

### PASSO 5: AJUSTAR ROLE DO USUÁRIO
#### OPÇÃO A: USAR POSTGRES ROLE
1. **Se disponível**, selecione role `postgres`
2. **Clique em "Set as default"** ou similar
3. **Salve as alterações**

#### OPÇÃO B: USAR SERVICE ROLE
1. **Se disponível**, selecione role `service_role`
2. **Clique em "Set as default"**
3. **Salve as alterações**

### PASSO 6: OBTER CREDENCIAIS
1. **Vá para:** Settings → Database → **Connection string**
2. **Copie a string de conexão** da role correta
3. **Anote o usuário e senha** se necessário

### PASSO 7: TESTAR CONEXÃO
1. **Volte para:** SQL Editor
2. **Execute um comando simples:**
   ```sql
   SELECT current_user;
   ```
3. **Verifique se** a role está correta

### PASSO 8: EXECUTAR SCRIPTS
1. **Execute os comandos** do arquivo `fix_payroll_simples.sql`
2. **Um de cada vez** para evitar erros
3. **Verifique sucesso** de cada comando

---

## 🎯 SE NÃO FUNCIONAR - ALTERNATIVAS

### ALTERNATIVA 1: USAR CONNECTION STRING DIRETA
1. **Settings → Database → Connection string**
2. **Copie a URI** completa
3. **Use psql ou DBeaver** para conectar diretamente

### ALTERNATIVA 2: OBTER SERVICE ROLE KEY
1. **Settings → API**
2. **Copie `service_role` key**
3. **Use no seu código** em vez de `anon` key

### ALTERNATIVA 3: RECREAR TABELA
Se tudo falhar, use o script de recriação do arquivo `instrucoes_supabase.md`

---

## ✅ VERIFICAÇÃO FINAL

Após ajustar a role:
1. **Execute:** `SELECT current_user;`
2. **Execute:** `\dt payroll` (para verificar acesso)
3. **Execute um ALTER TABLE** simples para testar

---

## 🚨 DICAS IMPORTANTES

- **Não use role `anon`** para operações DDL
- **Role `postgres`** tem permissões máximas
- **Role `service_role`** também funciona para DDL
- **Salve sempre** antes de fazer alterações
- **Teste com comandos simples** antes de scripts complexos

---

## 📞 SUPORTE

Se ainda tiver problemas:
1. **Verifique logs** do Supabase
2. **Teste com diferentes roles**
3. **Considere recriar a tabela** como última opção

**Boa sorte! 🚀**
