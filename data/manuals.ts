export const MANUAL_UTILIZADOR = `
# Manual do Utilizador

## 1. Introdução
Bem-vindo ao Tasca do Vereda - Sistema de Gestão Inteligente. Este manual cobre as operações diárias para Caixas e Garçons.

## 2. Acesso ao Sistema
*   **Login:** Utilize o seu PIN pessoal de 4 a 6 dígitos.
*   **Logout:** Sempre faça logout ao terminar seu turno clicando no ícone de saída no menu lateral.

## 3. Ponto de Venda (POS)
### 3.1. Gestão de Mesas
*   **Verde:** Mesa Livre. Clique para abrir um novo pedido.
*   **Laranja:** Mesa Ocupada. Clique para ver/editar o pedido.
*   **Cinza:** Mesa em Pagamento/Fechada.

### 3.2. Criar Pedidos
1.  Selecione a mesa ou crie um pedido "Balcão".
2.  Navegue pelas categorias (Entradas, Pratos, Bebidas, etc.).
3.  Clique nos produtos para adicionar ao carrinho.
4.  Para remover, clique no ícone de lixeira no item do carrinho.
5.  Clique em "Confirmar Pedido" para enviar para a cozinha (se configurado).

### 3.3. Pagamentos
1.  No pedido, clique em "Pagamento".
2.  Selecione o método: Numerário, TPA (Multicaixa), ou Transferência.
3.  Se for Numerário, insira o valor entregue para calcular o troco.
4.  Clique em "Finalizar" para emitir a fatura.

## 4. Assiduidade (Ponto)
*   No menu lateral, acesse "Funcionários" -> "Meu Ponto".
*   Clique em "Entrada" no início do turno e "Saída" no final.
*   O sistema calcula automaticamente as horas trabalhadas.

## 5. Dicas Importantes
*   **Sincronização:** O sistema funciona offline, mas requer internet para sincronizar o Menu Digital.
*   **Impressora:** Verifique se a impressora térmica está ligada e com papel antes de iniciar o turno.
`;

export const MANUAL_ADMIN = `
# Manual do Administrador

## 1. Introdução
Este manual é destinado a Gerentes e Administradores para configuração e gestão avançada do sistema.

## 2. Gestão de Inventário
### 2.1. Produtos e Stock
*   Acesse a aba **Inventário**.
*   **Adicionar Produto:** Clique em "Novo Prato". Preencha nome, preço, categoria e imagem.
*   **Ficha Técnica:** Associe ingredientes (Stock Items) ao prato para baixa automática de stock.
*   **Otimizar Imagens:** Use o botão "Otimizar Fotos" para reduzir o tamanho das imagens para o Menu Digital (sincronização mais rápida).

### 2.2. Categorias
*   Gerencie as categorias (ex: Entradas, Bebidas) para organizar o POS e o Menu Digital.

## 3. Menu Digital
*   O menu digital é sincronizado automaticamente com o Firebase.
*   Certifique-se que a configuração do Firebase está ativa em **Configurações**.
*   Para atualizar o layout ou imagens, edite no Inventário e a sincronização ocorrerá em segundo plano.

## 4. Financeiro e Fiscal (AGT)
### 4.1. Relatórios
*   Acesse **Financeiro** para ver gráficos de vendas diárias, semanais e mensais.
*   **Relatório Mensal:** Gere o PDF com o resumo de vendas, impostos e performance.

### 4.2. SAF-T
*   Para exportar o ficheiro SAF-T mensal para a AGT:
    1.  Vá em **Financeiro** -> **Exportar SAF-T**.
    2.  Selecione o mês e ano.
    3.  Clique em "Exportar XML". O ficheiro será salvo na pasta de documentos.

## 5. Recursos Humanos
*   **Funcionários:** Cadastre novos funcionários e defina seus PINs e cargos.
*   **Salários:** O sistema calcula o salário base + subsídios - IRT - INSS.
*   **Processamento:** No final do mês, vá em "Salários" e clique em "Processar" para gerar os recibos.

## 6. Configurações
*   **Dados da Empresa:** Nome, NIF, Endereço (aparecem nas faturas).
*   **Impressoras:** Configure a largura do papel (58mm ou 80mm).

## 7. Backup e Segurança
### 7.1. Backup Manual (In-App)
1. Vá em **Definições** -> **Database**.
2. Clique em "Fazer Backup" para descarregar uma cópia de segurança dos dados.
3. Guarde o ficheiro JSON num local seguro.

### 7.2. Restauro
1. Na mesma tela de Database, use a opção "Restaurar Backup" para carregar um ficheiro JSON antigo.
2. **Atenção:** Isso substituirá todos os dados atuais do sistema.

### 7.3. Migração para Novo PC
1. Faça backup no PC antigo usando o método acima.
2. Instale o software no novo PC.
3. Restaure o ficheiro de backup no novo PC.
`;
