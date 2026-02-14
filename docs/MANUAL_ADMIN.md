# Manual de Administração - Tasca do Vereda

Este manual destina-se a **Gerentes, Proprietários e Administradores** do sistema. Cobre configurações avançadas, gestão financeira e de pessoal.

---

## 1. Dashboard e Análises

O menu **Análises** oferece uma visão geral do negócio:
*   **Vendas:** Gráficos de vendas diárias, semanais e mensais.
*   **Pratos Populares:** Top 5 produtos mais vendidos.
*   **Performance:** Desempenho por empregado.
*   **Exportar Relatórios:** Utilize o botão "Exportar PDF" ou "Excel" no canto superior direito para extrair os dados.

---

## 2. Gestão Financeira

Aceda ao menu **Finanças** para controlar o fluxo de caixa.

### 2.1 Despesas
1.  Registe todas as saídas de dinheiro (Fornecedores, Compras Rápidas, Manutenção).
2.  Clique em **"Nova Despesa"**.
3.  Preencha: Descrição, Valor, Categoria e Data.
4.  O sistema deduz este valor do lucro líquido nos relatórios.

### 2.2 Fecho de Caixa (Turnos)
*   Monitore os turnos abertos em "Turnos de Caixa".
*   Pode forçar o fecho de um turno se um operador se esquecer.
*   O relatório de fecho mostra a quebra de caixa (Diferença entre Valor Esperado vs. Real).

### 2.3 SAF-T (Certificação AGT)
Para cumprir com as obrigações fiscais:
1.  Vá a **Configurações** > **Dados Fiscais**.
2.  Garanta que o NIF e dados da empresa estão corretos.
3.  Para exportar o ficheiro mensal:
    *   Vá a **Análises** ou área específica de exportação (se configurada).
    *   Selecione o mês/ano.
    *   Clique em **"Gerar SAF-T"**.
    *   O ficheiro XML será gerado. Envie este ficheiro para o portal da AGT.

---

## 3. Gestão de Inventário e Menu

Aceda ao menu **Estoque** (Inventário).

### 3.1 Criar/Editar Produtos (Menu)
1.  Aba **"Menu"**.
2.  Clique em **"Adicionar Prato"**.
3.  Preencha: Nome, Preço, Categoria, Imagem e **Código de Imposto** (Tax Code).
    *   `NOR`: Taxa Normal (14%).
    *   `ISE`: Isento (0%).
4.  Clique em Salvar.

### 3.2 Gestão de Stocks
1.  Aba **"Stock"**.
2.  Adicione ingredientes (ex: Arroz, Carne, Bebidas).
3.  Defina a **Quantidade Mínima**. O sistema avisa quando o stock estiver baixo.
4.  Dê entrada de stock quando receber mercadoria.

---

## 4. Gestão de Pessoal (RH)

Aceda ao menu **Funcionários**.

### 4.1 Adicionar Funcionário
1.  Clique em **"Novo Funcionário"**.
2.  Preencha: Nome, Cargo, Telefone, Salário Base.
3.  Defina o **PIN** de acesso (4 dígitos).

### 4.2 Processamento de Salários
O sistema calcula automaticamente os salários com base na legislação angolana (IRT 2024):
1.  Aba **"Salários"**.
2.  Selecione o Mês.
3.  O sistema mostra:
    *   Salário Base.
    *   Descontos (INSS 3%, IRT conforme escalão).
    *   Faltas (baseado no registo de Ponto).
    *   **Salário Líquido** a pagar.
4.  Pode exportar a Folha de Pagamento em PDF/Excel.

### 4.3 Escalas
1.  Aba **"Escalas"**.
2.  Defina os horários de cada funcionário para a semana.

---

## 5. Configurações do Sistema

Aceda ao menu **Configurações** (Ícone de Engrenagem).

*   **Geral:** Nome do Restaurante, Moeda (Kz), Logótipo.
*   **Impostos:** Taxa de IVA padrão (14%).
*   **Impressoras:** Configurar impressoras de talões (USB/Rede).
*   **Layout de Mesas:**
    *   Ative o "Modo Edição" no menu Mesas.
    *   Arraste as mesas para reorganizar a sala.
    *   Clique numa mesa para mudar o tamanho (2, 4, 6 lugares) ou forma (Quadrada, Redonda).

---

## 6. Backup e Manutenção

*   A base de dados é guardada localmente no computador.
*   Recomenda-se fazer backups regulares da pasta de dados da aplicação (documentos, base de dados SQLite).
*   Em caso de falha grave, contacte o suporte técnico.
