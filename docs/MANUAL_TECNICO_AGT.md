# Manual Técnico de Certificação - Tasca do Vereda (AGT)

**Data de Emissão:** 02/02/2026  
**Versão do Documento:** 1.2  
**Versão da Aplicação:** 1.1.45  
**Ref. Certificação:** AGT/2026/REQ-002 (Atualização WebService)

---

## 1. Identificação do Software

*   **Nome Comercial:** REST IA - Gestão Inteligente
*   **Versão:** 1.1.45
*   **Fabricante:** Helder Neto (Desenvolvimento Interno)
*   **Categoria:** Software de Gestão de Restauração e POS (Point of Sale)
*   **Arquitetura:** Aplicação Desktop Híbrida (Tauri v2) com Base de Dados Local e Integração Cloud
*   **Linguagens:** TypeScript (Frontend), Rust (Backend/Core), SQL (Dados)

## 2. Arquitetura do Sistema

O sistema utiliza uma arquitetura moderna e segura, desenhada para funcionar offline com alta performance, integrando-se via Webservice para comunicação de documentos fiscais.

### 2.1 Componentes Principais
1.  **Frontend (Interface):** Desenvolvido em React + TypeScript. Responsável pela interação com o utilizador, validação de formulários, assinatura digital (WebCrypto) e construção de payloads JSON.
2.  **Core (Backend Local):** Desenvolvido em Rust (Tauri). Responsável pela comunicação segura com o sistema operativo, gestão de ficheiros e ponte para a base de dados.
3.  **Módulo AGT Service:** Serviço interno responsável pela gestão de chaves assimétricas, assinatura de documentos (JWS) e comunicação HTTP/HTTPS com os endpoints da AGT.
4.  **Base de Dados:** SQLite (Embutido). Garante persistência local.

### 2.2 Fluxo de Dados (Facturação Eletrónica)
`[POS] -> [Assinatura JWS (Local)] -> [Armazenamento DB] -> [Envio Webservice AGT]`

---

## 3. Mecanismos de Segurança e Integridade (Requisitos AGT)

O software implementa mecanismos rigorosos para garantir a inalterabilidade, autenticidade e não-repúdio dos dados fiscais, em conformidade com o **Decreto Presidencial n.º 312/18** e especificações técnicas para Facturação Eletrónica.

### 3.1 Assinatura Digital (JWS - JSON Web Signature)
Todos os documentos fiscais (Faturas, Recibos) são assinados digitalmente utilizando o padrão JWS.

*   **Algoritmo:** `RS256` (RSA Signature with SHA-256).
*   **Tamanho da Chave:** 2048 bits.
*   **Formato:** Compact Serialization (`Header.Payload.Signature`).
*   **Geração de Chaves:** Utiliza a API `WebCrypto` (W3C Standard) para geração segura de pares de chaves (Pública/Privada) no ambiente do cliente. A chave privada é armazenada de forma encriptada localmente e nunca é transmitida.

### 3.2 Estrutura da Assinatura
A assinatura incide sobre um conjunto de dados críticos do documento (HashControl), garantindo que qualquer alteração invalida a assinatura.

**Campos Assinados (Payload JWS):**
```json
{
  "documentNo": "FT 2026/1",
  "taxRegistrationNumber": "5000000000",
  "documentType": "FT",
  "documentDate": "2026-02-02",
  "customerTaxID": "999999999",
  "documentTotals": {
      "taxPayable": 140.00,
      "netTotal": 1000.00,
      "grossTotal": 1140.00
  }
}
```

### 3.3 Encadeamento (Chaining)
Embora o webservice valide documento a documento, o sistema mantém internamente o hash da fatura anterior (`PreviousHash`) para garantir a integridade sequencial na base de dados e exportação SAF-T, prevenindo a inserção ou exclusão de documentos na cadeia.

---

## 4. Integração Webservice (Facturação Eletrónica)

O sistema comunica diretamente com o Sistema de Gestão Tributária (SIGT) da AGT.

### 4.1 Endpoints
*   **Ambiente de Testes (Homologação):**  
    `https://sifphml.minfin.gov.ao/sigt/fe/v1/registarFactura`
*   **Ambiente de Produção:**  
    `https://sifp.minfin.gov.ao/sigt/fe/v1/registarFactura`

### 4.2 Protocolo de Comunicação
*   **Método:** `POST`
*   **Formato:** `JSON` (Schema v1.2)
*   **Segurança de Transporte:** TLS 1.2+ (HTTPS)

### 4.3 Estrutura do Payload de Envio
O JSON enviado contém três blocos principais:
1.  **Cabeçalho de Submissão:** ID único (`submissionUUID`), NIF do emissor e Timestamp.
2.  **Informação de Software:** Identificação do produtor (`TascaVereda/RestAI`), versão e assinatura do software.
3.  **Documentos:** Lista de faturas a submeter, contendo linhas, impostos e a assinatura JWS individual.

---

## 5. Dicionário de Dados (Base de Dados)

A persistência de dados é assegurada pelo motor SQLite.

### 5.1 Tabela `orders` (Documentos)
| Campo | Tipo | Descrição | Relevância AGT |
| :--- | :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID do documento | - |
| `invoice_number` | TEXT | Número sequencial (Série/Num) | `DocumentNo` |
| `timestamp` | DATETIME | Data de emissão | `DocumentDate` |
| `total` | REAL | Total Líquido | `NetTotal` |
| `tax_total` | REAL | Total de Imposto | `TaxPayable` |
| `hash` | TEXT | Assinatura JWS (Parte 3) | `JWSDocumentSignature` |
| `status` | TEXT | Estado (FECHADO, ANULADO) | `DocumentStatus` |

### 5.2 Tabela `order_items` (Linhas)
| Campo | Tipo | Descrição | Relevância AGT |
| :--- | :--- | :--- | :--- |
| `dish_id` | TEXT | Código do Produto | `ProductCode` |
| `quantity` | INTEGER | Quantidade | `Quantity` |
| `unit_price` | REAL | Preço Unitário | `UnitPrice` |
| `tax_amount` | REAL | Valor Imposto | `TaxContribution` |

---

## 6. Procedimentos de Contingência

### 6.1 Falha de Comunicação (Modo Offline)
O sistema foi desenhado com uma filosofia "Offline-First".
1.  **Emissão:** O documento é criado, numerado e assinado localmente (JWS) sem necessidade de internet.
2.  **Armazenamento:** O documento é salvo na base de dados com estado `PENDENTE_ENVIO`.
3.  **Sincronização:** Um serviço de fundo (Background Worker) tenta reenviar os documentos pendentes assim que a conectividade é restabelecida.
4.  **Prazo:** O utilizador é alertado se existirem documentos não comunicados há mais de 5 dias (conforme regulamentação).

### 6.2 Perda de Chave Privada
*   A chave privada é gerada e armazenada de forma persistente.
*   Em caso de perda catastrófica (formatação sem backup), deve-se proceder à revogação da série junto à AGT e início de nova série com novo par de chaves.

---

## 7. Requisitos de Instalação e Ambiente

### Hardware
*   **Processador:** Intel Core i3 ou superior.
*   **Memória:** 4GB RAM (8GB Recomendado).
*   **Disco:** SSD com 1GB livre.

### Software
*   **SO:** Windows 10/11 (64 bits).
*   **Acesso Internet:** Necessário para comunicação com Webservice AGT (HTTPS/443).
*   **Certificado Digital:** Ficheiro `.pem` ou par de chaves gerado internamente para assinatura.

---

*Este documento técnico descreve as especificações implementadas na versão 1.1.45 para conformidade com o Regime Jurídico das Faturas Eletrónicas em Angola.*
