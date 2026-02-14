<<<<<<< HEAD
# Manual de Certificação e Conformidade AGT - REST IA

**Versão do Documento:** 1.0
**Data de Emissão:** 01/02/2026
**Software:** REST IA - Gestão Inteligente
=======
# Manual de Certificação e Conformidade AGT - Tasca do Vereda

**Versão do Documento:** 1.0
**Data de Emissão:** 01/02/2026
**Software:** Tasca do Vereda - Gestão Inteligente
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
**Versão da Aplicação:** 1.1.39

---

## 1. Introdução

Este manual descreve os procedimentos e conformidades técnicas do software "Tasca do Vereda" em relação aos requisitos da **Administração Geral Tributária (AGT)** de Angola, especificamente o **Decreto Executivo n.º 302/20** (Regime Jurídico da Submissão Eletrónica dos Elementos Contabilísticos) e regras de validação do ficheiro **SAF-T (AO)**.

O objetivo deste documento é guiar o processo de certificação do software e instruir os utilizadores sobre a operação correta para manter a conformidade fiscal.

## 2. Requisitos Técnicos e Segurança

### 2.1. Inalterabilidade dos Dados
O sistema garante a integridade dos dados fiscais através de:
*   **Transacionalidade:** Todas as operações de gravação de faturas são atómicas.
*   **Bloqueio de Edição:** Após a emissão e assinatura de uma fatura (estado `FECHADO`), o sistema impede tecnicamente qualquer alteração nos seus dados (data, valores, cliente, itens).
*   **Controlo de Acesso:** Apenas utilizadores autenticados e com permissões específicas podem emitir documentos fiscais.

### 2.2. Assinatura Digital (Hashing)
Conforme exigido, todos os documentos comerciais (Faturas, Recibos, Notas de Crédito) são assinados digitalmente.

*   **Algoritmo:** RSA-SHA1 (Chave assimétrica de 1024 bits).
*   **Encadeamento:** O Hash de cada fatura depende do Hash da fatura anterior da mesma série.
    *   Fórmula: `Base64(SHA1_Sign(Data;DataEntry;InvoiceNo;GrossTotal;PreviousHash))`
*   **Impressão:** Os 4 primeiros caracteres do Hash são impressos obrigatoriamente em todos os documentos (ex: `aBz1`).

<<<<<<< HEAD
### 2.3. Blindagem de Dados e Estabilidade (NASA-Grade)
O sistema implementa uma camada de proteção de dados inspirada em padrões de missão crítica (NASA/Militar):

*   **Redundância Tripla de Backups:** Armazenamento simultâneo em Base de Dados Local (SQLite/IndexedDB), LocalStorage (Web Fallback) e Nuvem (Supabase) com sincronização atómica.
*   **Validação por Checksum (Integridade):** Todos os backups e estados de dados são validados via algoritmos de checksum para detetar qualquer corrupção de bit (bit-rot) ou alteração não autorizada.
*   **DLP (Data Loss Protection):** Monitorização em tempo real que bloqueia operações se detetar inconsistências no estado global da aplicação, prevenindo a propagação de dados corrompidos.
*   **Auto-Recuperação (Self-Healing):** Em caso de falha crítica na base de dados principal, o sistema deteta a anomalia em milissegundos e restaura automaticamente o último estado íntegro a partir da redundância tripla.
*   **Encriptação AES-GCM 256-bit:** Todos os dados sensíveis e backups financeiros são encriptados com o padrão militar AES-GCM, garantindo confidencialidade e autenticidade.

### 2.4. Monitorização de Saúde e Previsão de Falhas
O sistema não apenas reage a erros, mas previne-os:

*   **Heurística de Previsão de Falhas:** Algoritmo que analisa métricas de desempenho (Long Tasks, Latência, MTBF) para prever falhas de hardware ou rede antes que ocorram.
*   **Dashboard de Saúde do Sistema:** Visualização em tempo real da estabilidade da aplicação, estado dos serviços de nuvem e integridade da base de dados.
*   **PITR (Point-in-Time Recovery):** Capacidade de restaurar o sistema para qualquer segundo específico no passado, essencial para auditorias financeiras e recuperação de erros humanos.

### 2.5. Gestão de Chaves
*   A **Chave Privada** é gerada internamente ou carregada de forma segura nas configurações do sistema (RS256 compatível).
=======
### 2.3. Gestão de Chaves
*   A **Chave Privada** é gerada internamente ou carregada de forma segura nas configurações do sistema.
>>>>>>> b02ffa757d562a9c0bb95b52f8ca9866513460dd
*   A **Chave Pública** correspondente deve ser fornecida à AGT durante o processo de certificação.

## 3. Configuração Inicial para Certificação

Antes de iniciar a faturação real, é obrigatório configurar os dados da empresa.

1.  Aceda a **Configurações > Definições Gerais**.
2.  Preencha obrigatoriamente:
    *   **Nome da Empresa / Razão Social**
    *   **NIF** (Número de Identificação Fiscal)
    *   **Morada Completa**
    *   **Nº do Certificado de Validação do Software** (Atribuído pela AGT após certificação, ex: `000/AGT/2026`).
    *   **Série de Faturação** (ex: `2026`). Deve ser renovada anualmente.

## 4. Operações Fiscais (Guia de Uso)

### 4.1. Emissão de Fatura
O processo de venda (Checkout) gera automaticamente a fatura assinada.
1.  Adicione itens ao pedido.
2.  Selecione **Pagamento** (Numerário, TPA, etc.).
3.  Opcional: Associe um Cliente (NIF) à venda.
4.  Confirme a operação.
    *   O sistema gera o número sequencial (`FT 2026/1`).
    *   Gera a assinatura digital.
    *   Bloqueia o pedido para edição.

### 4.2. Tratamento de Erros e Anulações
**Importante:** Não é permitido apagar faturas emitidas.
*   Para corrigir uma fatura, deve ser emitida uma **Nota de Crédito** ou estorno que referencie a fatura original.
*   O sistema mantém o histórico de todas as operações, incluindo documentos anulados, para auditoria.

### 4.3. Cópia de Segurança
O sistema realiza backups automáticos da base de dados local (`tasca.db` ou `IndexedDB`). É responsabilidade do contribuinte manter cópias externas destes dados por um período regulamentar (10 anos).

## 5. Exportação do Ficheiro SAF-T (AO)

O ficheiro SAF-T (Standard Audit File for Tax) deve ser submetido mensalmente à AGT.

### 5.1. Como Gerar
1.  Aceda a **Relatórios > Exportar SAF-T**.
2.  Selecione o **Mês** e **Ano** de referência.
3.  Clique em **Gerar XML**.
4.  O ficheiro `SAFT_AO_[NIF]_[DATA].xml` será descarregado.

### 5.2. Validação
Antes de submeter, verifique se o ficheiro contém:
*   **Header:** Dados da empresa e certificado corretos.
*   **MasterFiles:** Tabela de clientes e produtos atualizada.
*   **SourceDocuments:** Todas as faturas do período, sequenciais e sem falhas na numeração.
*   **DocumentTotals:** Os totais de débito/crédito devem bater certo com a contabilidade.

## 6. Checklist para Auditoria AGT

Para obter a certificação, certifique-se que o software cumpre os seguintes pontos na demonstração ao auditor:

- [x] **Sequencialidade:** Emitir Fatura 1, 2 e 3. Verificar se a numeração é cronológica e sem saltos.
- [x] **Assinatura:** Verificar se o Hash da Fatura 2 muda se alterarmos (hipoteticamente) o valor da Fatura 1 (o sistema deve impedir alteração, mas o hash garante deteção).
- [x] **Dados Obrigatórios:** Fatura impressa contém: NIF do produtor, NIF do cliente, Hash (4 carateres), "Processado por programa certificado nº...".
- [x] **Exportação SAF-T:** O XML gerado passa no validador oficial da AGT sem erros de estrutura (XSD).
- [x] **Controlo de Utilizadores:** Demonstrar que operadores sem permissão não podem alterar configurações fiscais.

## 7. Suporte Técnico

Para dúvidas sobre configurações fiscais ou erros de validação:
*   **Email:** hnetoo@gmail.com
*   **Técnico Responsável:** Helder Neto

---
*Este manual é parte integrante da documentação técnica para certificação de software de faturação em Angola.*
