# Fluxo de Autenticação e Gestão Mobile - Documentação Técnica

## 1. Visão Geral
Este documento descreve o fluxo de autenticação e gestão de segurança para a aplicação mobile e web do sistema de gestão TASCA DO VEREDA. O sistema utiliza um modelo híbrido de autenticação local (PIN) e remota (Supabase Auth) para garantir operação offline e sincronização segura.

## 2. Gestão de Credenciais e Persistência
O sistema implementa um mecanismo seguro para armazenamento de credenciais, visando melhorar a experiência do usuário sem comprometer a segurança.

### 2.1 Armazenamento Seguro (Client-Side)
As credenciais sensíveis (PINs de usuários) são armazenadas localmente utilizando a Web Crypto API (SubtleCrypto) com o algoritmo AES-GCM (256 bits).

**Fluxo de Armazenamento:**
1. **Entrada do Usuário:** O usuário insere o PIN na interface de login.
2. **Derivação de Chave:** Uma chave criptográfica é derivada do nome do restaurante (ou ID de instalação) combinada com um SALT estático utilizando PBKDF2 (100.000 iterações, SHA-256).
3. **Encriptação:** O PIN é encriptado com a chave derivada usando AES-GCM. Um vetor de inicialização (IV) aleatório de 12 bytes é gerado para cada operação.
4. **Persistência:** O par `(IV + Ciphertext)` é convertido para Base64 e armazenado no `localStorage` sob a chave `saved_user_pin_enc`, juntamente com o `saved_user_id`.

**Fluxo de Recuperação:**
1. **Verificação:** Ao iniciar, o sistema verifica a existência de credenciais salvas.
2. **Decriptação:** Quando o usuário solicita "Entrar Automaticamente", o sistema recupera o Base64, extrai o IV e o Ciphertext, e utiliza a mesma chave derivada para decriptar o PIN.
3. **Validação:** O PIN decriptado é submetido à função de login padrão (`useStore.login`) para validação final.

## 3. Autenticação Mobile e Tokens (Supabase)
Para a aplicação mobile e sincronização com a nuvem, o sistema utiliza o protocolo de autenticação do Supabase (baseado em JWT e OAuth 2.0).

### 3.1 Geração de Tokens
- **Método:** OAuth 2.0 / JWT (JSON Web Tokens).
- **Provedor:** Supabase GoTrue.
- **Tipos de Token:**
  - `access_token`: JWT de curta duração (padrão 1 hora) usado para autenticar requisições à API. Contém claims de usuário (ID, Role, Email).
  - `refresh_token`: Token opaco de longa duração usado para obter novos access tokens sem reautenticação do usuário.

### 3.2 Ciclo de Vida do Token
1. **Login:** O usuário autentica via Email/Senha ou PIN (mapeado para conta de serviço). O Supabase retorna um par `access_token` e `refresh_token`.
2. **Armazenamento:**
   - **Web:** `localStorage` (padrão do Supabase JS Client).
   - **Mobile (Tauri/Capacitor):** Armazenamento seguro do dispositivo (Keychain no iOS, Keystore no Android) via plugins nativos, ou `localStorage` encriptado em implementações híbridas simples.
3. **Validação:**
   - Cada requisição ao Supabase (Database/Storage) inclui o `access_token` no header `Authorization: Bearer <token>`.
   - As Row Level Security (RLS) policies no banco de dados validam o token e restringem o acesso com base no `user_id` e `role`.

### 3.3 Renovação Automática (Refresh Token Rotation)
O cliente Supabase (`@supabase/supabase-js`) gerencia automaticamente a renovação de tokens.
- **Processo:** Antes do `access_token` expirar, o cliente envia o `refresh_token` atual para o endpoint `/auth/v1/token?grant_type=refresh_token`.
- **Rotação:** O servidor invalida o `refresh_token` antigo e retorna um novo par `access_token` + `refresh_token`. Isso garante segurança adicional em caso de vazamento do refresh token (Replay Attack Protection).
- **Tratamento de Expiração:** Se a renovação falhar (ex: token revogado ou expirado por inatividade prolongada), o usuário é desconectado e redirecionado para a tela de login.

## 4. Funcionalidades de Storage e Segurança (Correções)
As funcionalidades que anteriormente exibiam mensagens de "em breve" foram implementadas e integradas:

- **Storage Bucket:** Configurado para armazenar backups e imagens de menu. Políticas de acesso (RLS) garantem que apenas usuários autenticados possam fazer upload, enquanto a leitura pode ser pública (para imagens de menu) ou restrita (para backups).
- **Logs de Auditoria:** Todas as operações críticas (Login, Alteração de Configurações, Exclusão de Dados) geram logs imutáveis na tabela `audit_logs`, sincronizados com a nuvem para redundância.

## 5. Procedimentos de Teste e Validação
Para garantir a integridade do sistema de autenticação:

1. **Teste Unitário (CryptoService):** Validar que `encrypt(text) -> decrypt(result) === text`.
2. **Teste de Integração (Login):**
   - Verificar se credenciais são salvas apenas quando o checkbox é marcado.
   - Verificar se "Esquecer" remove os dados do localStorage.
   - Simular falha de login com credenciais salvas (ex: alteração de PIN no backend) e garantir que o sistema solicita novo login.
3. **Auditoria de Segurança:** Verificar logs no Supabase para confirmar registros de acesso e falhas de autenticação.
