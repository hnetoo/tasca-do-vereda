# 🇦🇴 DOCUMENTAÇÃO TÉCNICA - CERTIFICAÇÃO AGT
**Software: Tasca Do VEREDA - Sistema de Gestão Inteligente**

---

## 1. Identificação do Software e Produtor

| Campo | Descrição |
|-------|-----------|
| **Nome do Software** | Tasca Do VEREDA |
| **Versão** | 1.1.36 |
| **Categoria** | Software de Faturação e Gestão Comercial |
| **Arquitetura** | Desktop (Híbrido) - Tauri (Rust + React) |
| **Sistema Operativo** | Windows 10/11, macOS, Linux |
| **Linguagem de Programação** | Rust (Backend/Core), TypeScript/React (Frontend) |
| **Base de Dados** | Estrutura Local Encriptada / JSON Storage / Firebase (Sync) |
| **Produtor** | Helder Neto |
| **ProductCompanyID** | Rest_AI_Systems |

---

## 2. Descrição Funcional

O **Tasca Do VEREDA** é um sistema integrado de gestão para restauração (POS), desenhado para cumprir com os requisitos legais da Administração Geral Tributária (AGT) de Angola.

### Funcionalidades Principais:
1.  **Ponto de Venda (POS):** Registo de pedidos, gestão de mesas e emissão de documentos de venda.
2.  **Gestão de Mesas:** Mapa de sala interativo com estados (Livre, Ocupada, Pagamento, Reservada).
3.  **Gestão de Stock:** Controlo de inventário em tempo real com fichas técnicas de produtos.
4.  **Recursos Humanos:** Gestão de funcionários, turnos, assiduidade e processamento salarial (IRT/INSS).
5.  **Relatórios e Análises:** Dashboards financeiros, vendas por categoria e performance.
6.  **Menu Digital:** Sincronização automática de produtos e preços para visualização web via QR Code.

---

## 3. Requisitos Fiscais e Compliance (AGT)

O software foi desenvolvido seguindo as regras do **Regime Jurídico das Faturas e Documentos Equivalentes** e as especificações técnicas para emissão do ficheiro **SAF-T (AO)**.

### 3.1. Emissão de Documentos
O sistema emite os seguintes tipos de documentos fiscais:
*   **Fatura (FT):** Documento principal de venda a crédito ou pronto pagamento.
*   **Fatura/Recibo (FR):** Venda e liquidação simultânea.
*   **Nota de Crédito (NC):** Retificação de faturas.
*   **Talão de Venda (VD):** Venda simplificada a consumidor final.

### 3.2. Regras de Numeração
*   Numeração sequencial e cronológica exclusiva por tipo de documento e série.
*   Formato: `TIPO SÉRIE/NÚMERO` (Ex: `FT 2024/1`).
*   **Reset de Sequência:** O sistema implementa lógica de reinício de sequência apenas mediante limpeza total de dados financeiros (modo de teste -> produção), garantindo a integridade em produção.
*   Impossibilidade de anular ou apagar documentos já emitidos e assinados.

### 3.3. Assinatura Digital (Hashing)
Cada documento fiscal emitido é assinado digitalmente utilizando o algoritmo **RSA-SHA1**, garantindo a inalterabilidade dos dados.
*   **Chave Privada:** Armazenada de forma segura no sistema.
*   **Chave Pública:** Disponibilizada para verificação.
*   **Processo:** O hash é gerado com base nos dados do documento atual (Data, Hora, Valor Total, NIF) e o hash do documento anterior da mesma série.
*   **Impressão:** Os 4 primeiros caracteres do Hash são impressos no documento.

### 3.4. Documentação Integrada e Acessibilidade
Para garantir o uso correto do software conforme as normas fiscais, o sistema inclui:
*   **Manual do Utilizador (In-App):** Acessível via menu lateral, descrevendo operações diárias de venda e caixa.
*   **Manual do Administrador (In-App):** Restrito a gerentes, detalhando configurações fiscais, gestão de stock e exportação do SAF-T.
*   **Acesso Offline:** A documentação é embutida na aplicação, não dependendo de conexão à internet para consulta.

---

## 4. Estrutura do Ficheiro SAF-T (AO)

O sistema exporta o ficheiro XML padrão **SAF-T (Standard Audit File for Tax)** na versão **1.01** para Angola.

### Mapeamento da Estrutura XML:

#### 4.1. Cabeçalho (Header)
*   **AuditFileVersion:** 1.01_01
*   **CompanyID / TaxRegistrationNumber:** NIF da Empresa
*   **SoftwareCertificateNumber:** Nº do Certificado atribuído pela AGT
*   **ProductCompanyID:** Identificador do Produtor do Software

#### 4.2. Tabelas Mestras (MasterFiles)
*   **Customer:** Tabela de Clientes (NIF, Nome, Endereço).
*   **Product:** Tabela de Artigos/Serviços (Código, Descrição, Unidade).
*   **TaxTable:** Tabela de Impostos (IVA, Isenções, Motivos de Isenção).

#### 4.3. Documentos Comerciais (SourceDocuments)
*   **SalesInvoices:** Detalhe de todas as faturas e documentos emitidos no período.
    *   **InvoiceNo:** Número sequencial do documento.
    *   **Hash:** Assinatura digital do documento.
    *   **Period:** Mês fiscal.
    *   **Line:** Detalhe dos artigos (Quantidade, Preço Unitário, Taxa de Imposto).
    *   **DocumentTotals:** Totais do documento (Total Líquido, Total Imposto, Total Bruto).

---

## 5. Arquitetura Técnica e Segurança

### 5.1. Integridade de Dados
*   O sistema utiliza um motor de persistência transacional para garantir que os dados fiscais não sejam corrompidos.
*   Validação estrita de dados antes da gravação (NIFs, valores monetários, datas).

### 5.2. Controlo de Acesso
*   Sistema de autenticação por Utilizador/PIN.
*   Níveis de permissão hierárquicos (Admin, Gerente, Caixa, Garçom).
*   Registo de logs de todas as operações críticas (anulações, alterações de preços, descontos).

### 5.3. Cópias de Segurança (Backups)
*   Funcionalidade automática de backup da base de dados.
*   Possibilidade de exportação de dados em formatos abertos (CSV, XML, JSON).

---

## 6. Procedimento de Certificação

Para submissão à AGT, o software cumpre os seguintes pré-requisitos:
1.  Capacidade de exportar o ficheiro SAF-T (AO) válido.
2.  Impedimento de alteração de documentos após a sua emissão.
3.  Numeração sequencial sem falhas.
4.  Cálculo correto de impostos e isenções.
5.  Gestão correta de séries de faturação.

---

**Data de Emissão:** 01 de Fevereiro de 2026
**Responsável Técnico:** Helder Neto
