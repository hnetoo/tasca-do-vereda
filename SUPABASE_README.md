
# Configuração do Supabase (Tauri MSI vs Web Vercel)

Este documento descreve a configuração do cliente Supabase para garantir compatibilidade híbrida entre o ambiente Desktop (Tauri) e Web (Vercel).

## Variáveis de Ambiente Obrigatórias

O cliente Supabase (`src/lib/supabase.ts`) requer as seguintes variáveis de ambiente:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (deve começar com `https://`) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anônima (mínimo 40 caracteres) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> **Nota:** As variáveis devem começar com `NEXT_PUBLIC_` para serem expostas ao browser no Next.js. O suporte a `VITE_` foi removido para garantir compatibilidade total.

## Comportamento Híbrido

O cliente detecta automaticamente o ambiente de execução (`isTauri()`) e ajusta as configurações de segurança:

### 1. Ambiente Web (Vercel/Browser)
- **Persistência de Sessão:** Ativada (`persistSession: true`).
- **Auto Refresh Token:** Ativado (`autoRefreshToken: true`).
- **Headers:** `x-client-source: web`.
- **Armazenamento:** Usa `localStorage` do navegador.

### 2. Ambiente Desktop (Tauri MSI)
- **Persistência de Sessão:** Desativada (`persistSession: false`) para evitar conflitos com o sistema de arquivos local e SQLite.
- **Auto Refresh Token:** Desativado (`autoRefreshToken: false`).
- **Headers:** `x-client-source: tauri`.
- **Segurança:** O Tauri gerencia a autenticação de forma isolada ou via API Rust, evitando vazamento de tokens no disco não criptografado.

## Tratamento de Erros e Fallback

Se a inicialização falhar (ex: variáveis ausentes ou inválidas):
1. Um erro crítico é logado no console (`FALHA FATAL NA INICIALIZAÇÃO DO SUPABASE`).
2. Um cliente "Mock" (falso) é retornado para evitar que a aplicação quebre (White Screen of Death).
3. O erro é exposto em `window.__SUPABASE_INIT_ERROR__` para diagnóstico rápido.

## Testes

Para validar a configuração, execute:
```bash
npm run test src/lib/supabase.test.ts
```
