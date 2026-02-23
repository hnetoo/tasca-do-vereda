# Guia de Deploy e Correção de Erros (Vercel + Supabase)

Este documento descreve as correções aplicadas para resolver o erro `404: DEPLOYMENT_NOT_FOUND` e o problema de carregamento do menu.

## 1. Correções Aplicadas no Código

### A. Redirecionamento de Rotas (`next.config.mjs`)
- **Problema:** A rota `/menu-digital` não existia no projeto, causando erro 404.
- **Solução:** Adicionado um redirecionamento automático de `/menu-digital` para `/menu` (onde o componente `MenuDigital` está localizado).
- **Código:**
  ```javascript
  async redirects() {
    return [
      {
        source: '/menu-digital',
        destination: '/menu',
        permanent: true,
      },
      // ...
    ];
  }
  ```

### B. Versão do Node.js (`package.json`)
- **Problema:** A versão do Node estava fixada em `22.22.0`, o que pode causar falhas de build na Vercel se essa versão específica não estiver disponível.
- **Solução:** Alterado para `>=20.0.0` para maior compatibilidade.

## 2. Ações Necessárias no Painel da Vercel (CRÍTICO)

Para que o deploy funcione corretamente e o menu carregue os dados do Supabase, você **DEVE** configurar as variáveis de ambiente no painel da Vercel.

1.  Acesse seu projeto na Vercel.
2.  Vá em **Settings** > **Environment Variables**.
3.  Adicione as seguintes variáveis (copie do seu arquivo `.env.local` ou `.env`):

    | Key | Value |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | `https://ratzyxwpzrqbtpheygch.supabase.co` |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Sua chave pública anon key)* |

    > **Nota:** Sem essas variáveis, o build pode falhar ou as páginas carregarão em branco porque o cliente Supabase não conseguirá inicializar.

4.  Após adicionar as variáveis, vá em **Deployments** e clique em **Redeploy** no último commit para que as alterações surtam efeito.

## 3. Verificação de Build

O comando de build local (`npm run build`) foi executado com sucesso e gerou todas as rotas estáticas corretamente.

- Rota `/owner`: **OK** (Gerada estaticamente)
- Rota `/menu`: **OK** (Gerada estaticamente)
- Rota `/menu-digital`: **Redirecionada para /menu**

## 4. Diagnóstico de "Failed to load menu"

O erro "Failed to load menu exclusively from SQL" ocorre quando o `supabaseService` não consegue se conectar. Isso confirma que as variáveis de ambiente estavam faltando ou incorretas no ambiente de produção (Vercel). Ao configurar as variáveis acima, esse erro deve desaparecer.

## 5. CI/CD Recomendado

Para prevenir falhas futuras:
1.  Sempre rode `npm run build` localmente antes de fazer push (já configurado no script).
2.  Mantenha o arquivo `next.config.mjs` atualizado com quaisquer novas rotas ou redirecionamentos.
3.  Verifique os logs de Build na Vercel imediatamente após o push se o status não for "Ready".
