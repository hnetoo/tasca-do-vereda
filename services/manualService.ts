import jsPDF from 'jspdf';
import { saveFileTauri } from './exportService';

const MANUAL_TECNICO = `# Manual Técnico de Certificação - Tasca do Vereda (AGT)

**Data de Emissão:** 29/01/2026
**Versão do Documento:** 1.2
**Versão da Aplicação:** 1.0.2
**Ref. Certificação:** AGT/2026/REQ-001

---

## 1. Identificação do Software

*   **Nome Comercial:** Tasca Do VEREDA - Gestão Inteligente
*   **Versão:** 1.0.2
*   **Fabricante:** Tasca Do VEREDA Team (Desenvolvimento Interno)
*   **Categoria:** Software de Gestão de Restauração e POS (Point of Sale)
*   **Arquitetura:** Aplicação Desktop Híbrida (Tauri v2) com Base de Dados Local e Sincronização Cloud
*   **Linguagens:** TypeScript (Frontend), Rust (Backend/Core), SQL (Dados)

## 2. Arquitetura do Sistema

O sistema utiliza uma arquitetura moderna e segura, desenhada para funcionar offline com alta performance, permitindo sincronização opcional com a nuvem.

### 2.1 Componentes Principais
1.  **Frontend (Interface):** Desenvolvido em React + TypeScript. Responsável pela interação com o utilizador, validação de formulários e lógica de apresentação.
2.  **Core (Backend Local):** Desenvolvido em Rust (Tauri). Responsável pela comunicação segura com o sistema operativo, gestão de ficheiros e ponte para a base de dados.
3.  **Base de Dados:** SQLite (Embutido). Garante que todos os dados residem localmente na máquina do cliente.

### 2.2 Diagrama de Fluxo de Dados (Simplificado)
[Interface POS] <-> [Core Rust] <-> [SQLite DB] -> [Módulo SAFT] -> [XML]

---

## 3. Dicionário de Dados (Estrutura da Base de Dados)

A persistência de dados é assegurada pelo motor SQLite. Abaixo descrevem-se as tabelas críticas para a faturação e certificação.

### 3.1 Tabela orders (Documentos Comerciais)
Armazena os cabeçalhos das faturas e encomendas.

| Campo | Tipo | Descrição | Relevância AGT |
| id | TEXT (PK) | Identificador único (UUID) | Chave primária |
| invoice_number | TEXT | Número sequencial (ex: FT 2024/1) | Obrigatório (InvoiceNo) |
| status | TEXT | Estado (ABERTO, FECHADO, ANULADO) | AuditFile/DocumentStatus |
| timestamp | DATETIME | Data e hora de criação | InvoiceDate / SystemEntryDate |
| total | REAL | Valor total bruto | DocumentTotals/GrossTotal |
| tax_total | REAL | Valor total de imposto | DocumentTotals/TaxPayable |
| hash | TEXT | Assinatura digital do documento | Campo Crítico (Hash) |
| customer_id | TEXT | ID do cliente (FK) | CustomerID |
| payment_method | TEXT | Método de pagamento | PaymentMechanism |

## 7. Procedimentos de Backup e Recuperação

### 7.1 Política de Backup
*   **Local (Automático):** O sistema mantém o ficheiro .db em local seguro.

### 7.2 Procedimento de Restauro
1.  Reinstalar a aplicação (MSI).
2.  Substituir o ficheiro tasca.db na diretoria de dados pela cópia de segurança.
3.  Reiniciar a aplicação.
`;

const MANUAL_UTILIZADOR = `# Manual do Utilizador - Tasca do Vereda

## Bem-vindo ao Tasca do Vereda!

Este manual irá guiá-lo através das funcionalidades básicas do sistema.

### 1. Ecrã Principal
- **Vendas:** Registar novas vendas, gerir mesas e pedidos.
- **Produtos:** Ver e procurar produtos disponíveis.
- **Clientes:** Gerir informações de clientes.

### 2. Realizar uma Venda
1. Selecione uma mesa disponível.
2. Adicione produtos ao pedido.
3. Finalize a venda e escolha o método de pagamento.

### 3. Gestão de Mesas
- **Mesas Livres:** Mesas prontas para novos clientes.
- **Mesas Ocupadas:** Mesas com pedidos em andamento.
- **Transferir Mesa:** Mover pedidos de uma mesa para outra.

### 4. Relatórios
Aceda a relatórios de vendas diárias, produtos mais vendidos e desempenho de funcionários.

---

## Suporte

Em caso de dúvidas ou problemas, contacte o administrador do sistema.
`;

const MANUAL_ADMIN = `# Manual do Administrador - Tasca do Vereda

## Bem-vindo, Administrador!

Este manual detalha as configurações avançadas e a gestão do sistema.

### 1. Configurações do Sistema
- **Geral:** Nome do restaurante, moeda, taxa de imposto.
- **Faturação:** NIF, Registo Comercial, Certificado AGT.
- **Integrações:** Configurações de KDS, Webhooks.

### 2. Gestão de Utilizadores
- **Adicionar/Remover Utilizadores:** Gerir acessos e permissões.
- **Funções:** Atribuir funções (Admin, Gerente, Caixa, Cozinha).
- **PINs:** Redefinir PINs de acesso.

### 3. Gestão de Produtos e Categorias
- **Produtos:** Adicionar, editar e remover produtos.
- **Categorias:** Organizar produtos em categorias.
- **Stock:** Gerir inventário de produtos.

### 4. Relatórios Avançados
- **Vendas Detalhadas:** Análise de vendas por período, produto, funcionário.
- **Financeiro:** Despesas, receitas, folha de pagamentos.
- **Auditoria:** Registos de todas as ações importantes no sistema.

### 5. Manutenção e Backup
- **Backup:** Realizar backups completos da base de dados.
- **Restauro:** Restaurar o sistema a partir de um backup.
- **Diagnósticos:** Ferramentas para verificar a integridade do sistema.

---

## Suporte Técnico

Para assistência técnica avançada, contacte a equipa de desenvolvimento.
`;

export type ManualType = 'TECNICO' | 'UTILIZADOR' | 'ADMIN';

export const downloadManual = async (type: ManualType) => {
  const doc = new jsPDF();
  let content = '';
  let title = '';

  switch (type) {
    case 'TECNICO':
      content = MANUAL_TECNICO;
      title = 'Manual Tecnico AGT';
      break;
    case 'UTILIZADOR':
      content = MANUAL_UTILIZADOR;
      title = 'Manual Utilizador';
      break;
    case 'ADMIN':
      content = MANUAL_ADMIN;
      title = 'Manual Administrador';
      break;
  }

  // Simple Markdown Parser to PDF
  const lines = content.split('\n');
  let y = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'normal');

  lines.forEach(line => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    if (line.startsWith('# ')) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(line.replace('# ', ''), margin, y);
      y += 15;
    } else if (line.startsWith('## ')) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(line.replace('## ', ''), margin, y);
      y += 12;
    } else if (line.startsWith('### ')) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(line.replace('### ', ''), margin, y);
      y += 10;
    } else if (line.startsWith('---')) {
      doc.setDrawColor(200);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 5;
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const cleanLine = line.replace(/\*\*/g, '');
      
      if (cleanLine.trim().startsWith('* ')) {
         doc.text('• ' + cleanLine.replace('* ', ''), margin + 5, y);
      } else if (cleanLine.match(/^\d+\. /)) {
         doc.text(cleanLine, margin + 5, y);
      } else {
         const splitText = doc.splitTextToSize(cleanLine, maxLineWidth);
         doc.text(splitText, margin, y);
         y += (splitText.length * 5) - 5;
      }
      y += 6;
    }
  });

  if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__) {
    const pdfData = doc.output('arraybuffer');
    await saveFileTauri(title, new Uint8Array(pdfData), 'pdf');
  } else {
    doc.save(`${title}.pdf`);
  }
};
