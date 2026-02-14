# Guia de Conexão Firebase e Menu Digital

## 1. Configuração do Firebase

Para habilitar o Menu Digital e o Acesso Remoto (Dashboard do Dono), você precisa conectar a aplicação ao Firebase.

### Passo 1: Criar Projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com).
2. Clique em "Adicionar projeto".
3. Dê um nome ao projeto (ex: "Tasca do Vereda App").
4. Desative o Google Analytics (opcional, simplifica o processo).
5. Clique em "Criar projeto".

### Passo 2: Criar Base de Dados (Firestore)
1. No menu lateral, clique em **Criação** > **Firestore Database**.
2. Clique em "Criar banco de dados".
3. Escolha o local (ex: `eur3` para Europa ou o padrão `us-central1`).
4. **IMPORTANTE**: Escolha iniciar no **modo de teste** (permite leitura/escrita por 30 dias) ou configure regras de segurança apropriadas.
5. Clique em "Ativar".

### Passo 3: Obter Credenciais
1. Na página principal do projeto, clique no ícone de engrenagem (Configurações) > **Configurações do projeto**.
2. Role até a seção "Seus aplicativos".
3. Clique no ícone `</>` (Web).
4. Registre o app (dê um nome, ex: "Gestor Desktop").
5. Copie o objeto `firebaseConfig` que aparece (apiKey, authDomain, projectId, etc.).

## 2. Conectar na Aplicação

1. Abra o **Tasca do Vereda - Gestão Inteligente**.
2. Vá para **Configurações** > **Sistema**.
3. Role até a seção **Integração Cloud (Firebase)**.
4. Cole as credenciais nos campos correspondentes:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
5. Clique em **Salvar Configurações**.
6. Clique em **Testar Conexão**. Você deve ver uma mensagem "Conectado e Operacional".

## 3. Configurar Menu Digital (QR Code)

1. Vá para o menu **QR Code Manager**.
2. No campo "URL Base do Restaurante", insira o endereço onde seu menu estará hospedado.
   - Se você usar o Firebase Hosting (recomendado), será algo como `https://seu-projeto.web.app`.
   - Se não tiver hospedagem ainda, o QR Code apontará para o link que você definir.
3. Clique em **Guardar**.
4. O QR Code será gerado automaticamente.
5. Use os botões:
   - **Baixar PNG**: Para salvar a imagem e imprimir.
   - **Abrir no Navegador**: Para testar o link.

## 4. Acesso Remoto (Dashboard do Dono)

O aplicativo sincroniza dados de vendas, pedidos e equipe a cada 30 segundos.

### Como acessar pelo celular:
1. Abra o navegador no seu celular.
2. Acesse o link do seu projeto Firebase adicionando `/owner` no final (ou use o link específico se configurou hospedagem).
   - Exemplo: `https://seu-projeto.web.app/#/owner`
3. Você verá a tela de **Acesso Remoto**.
4. Digite o **PIN de Administrador** (configurado nas Configurações do app Desktop).
5. Você terá acesso a:
   - **Vendas**: Faturamento do dia, top pratos.
   - **Pedidos**: Pedidos ativos em tempo real.
   - **Finanças**: Despesas recentes.
   - **Equipa**: Quem está trabalhando agora.
   - **Análise**: Métricas de retenção e clientes.

## Solução de Problemas

- **Erro "Site não encontrado"**: Verifique se o "URL Base" está correto nas configurações do QR Code.
- **QR Code não aparece**: Verifique sua conexão com a internet (necessária para gerar a imagem).
- **Dados desatualizados no celular**: Verifique se o computador principal está ligado e com internet. A sincronização ocorre a cada 30 segundos.
