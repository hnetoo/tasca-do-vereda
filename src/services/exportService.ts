import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { logger } from './logger';

export interface ExportColumn {
  header: string;
  dataKey: string;
}

export interface ExportOptions {
  fileName: string; // sem extensão
  title: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

export interface ChartExportOptions {
  fileName: string;
  title: string;
  periodLabel: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  subtitle?: string;
  chartElement?: HTMLElement | null;
}

const isTauri = () => {
  // @ts-expect-error - __TAURI_INTERNALS__ is injected by Tauri
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
};

export const saveFileTauri = async (fileName: string, content: Uint8Array, extension: string) => {
  try {
    const path = await save({
      defaultPath: `${fileName}.${extension}`,
      filters: [{
        name: extension.toUpperCase(),
        extensions: [extension]
      }]
    });

    if (path) {
      await writeFile(path, content);
      logger.info('Arquivo salvo com sucesso via Tauri', { path, extension }, 'EXPORT');
      return true;
    }
    logger.info('Operação de salvar arquivo cancelada pelo utilizador', { fileName, extension }, 'EXPORT');
    return false; // User cancelled
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Erro ao salvar arquivo via Tauri', { fileName, extension, error: err.message }, 'EXPORT');
    alert('Erro ao salvar arquivo: ' + err.message);
    return false;
  }
};

export const exportToPDF = async ({ fileName, title, columns, data }: ExportOptions) => {
  try {
    const doc = new jsPDF();
  
  // Configurar fonte para suportar acentos (padrão do jsPDF é limitado, mas vamos tentar usar o padrão)
  // Em projetos maiores, importariamos uma fonte customizada.
  
  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Data de Geração
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateStr = new Date().toLocaleDateString('pt-AO', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
  doc.text(`Gerado em: ${dateStr}`, 14, 28);
  doc.text(`Tasca Do VEREDA - Sistema de Gestão`, 14, 33);

  // Tabela
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
        const val = row[col.dataKey];
        return val !== undefined && val !== null ? String(val) : '';
    })),
    startY: 40,
    styles: { 
        fontSize: 9, 
        cellPadding: 3,
        overflow: 'linebreak'
    },
    headStyles: { 
        fillColor: [41, 128, 185], // Primary colorish
        textColor: 255,
        fontStyle: 'bold'
    },
    alternateRowStyles: {
        fillColor: [245, 245, 245]
    },
    theme: 'grid'
  });

  if (isTauri()) {
    const pdfData = doc.output('arraybuffer');
    await saveFileTauri(fileName, new Uint8Array(pdfData), 'pdf');
  } else {
    doc.save(`${fileName}.pdf`);
    logger.info('PDF exportado e descarregado (Web)', { fileName }, 'EXPORT');
  }
} catch (error: unknown) {
  const err = error as Error;
  logger.error('Erro ao exportar PDF', { fileName, error: err.message }, 'EXPORT');
  throw error;
}
};

const getChartImageDataUrl = async (chartElement: HTMLElement) => {
  const svg = chartElement.querySelector('svg');
  if (!svg) return null;

  const svgElement = svg as SVGElement;
  const { width, height } = svgElement.getBoundingClientRect();
  if (!width || !height) return null;

  const clone = svgElement.cloneNode(true) as SVGElement;
  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas indisponível'));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao converter SVG'));
    };
    image.src = url;
  });
};

export const exportChartToPDF = async ({ fileName, title, periodLabel, columns, data, subtitle, chartElement }: ChartExportOptions) => {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    doc.setFontSize(18);
    doc.text(title, margin, 36);
    if (subtitle) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(subtitle, margin, 54);
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('pt-AO', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    doc.text(`Gerado em: ${dateStr}`, margin, 72);
    doc.text(`Período: ${periodLabel}`, margin, 88);

    doc.setTextColor(0);

    let chartBottom = 96;
    if (chartElement) {
      try {
        const chartImage = await getChartImageDataUrl(chartElement);
        if (chartImage) {
          const maxWidth = pageWidth - margin * 2;
          const scale = maxWidth / chartImage.width;
          const imgHeight = chartImage.height * scale;
          const maxHeight = 220;
          const finalHeight = Math.min(imgHeight, maxHeight);
          const finalWidth = finalHeight / chartImage.height * chartImage.width;
          const x = margin + (maxWidth - finalWidth) / 2;
          doc.addImage(chartImage.dataUrl, 'PNG', x, chartBottom, finalWidth, finalHeight);
          chartBottom += finalHeight + 24;
        }
      } catch (error: unknown) {
        const err = error as Error;
        logger.warn('Falha ao gerar imagem do gráfico', { error: err.message }, 'EXPORT');
      }
    }

    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => {
        const val = row[col.dataKey];
        return val !== undefined && val !== null ? String(val) : '';
      })),
      startY: chartBottom,
      styles: { 
          fontSize: 9, 
          cellPadding: 3,
          overflow: 'linebreak'
      },
      headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
      },
      alternateRowStyles: {
          fillColor: [245, 245, 245]
      },
      theme: 'grid'
    });

    if (isTauri()) {
      const pdfData = doc.output('arraybuffer');
      await saveFileTauri(fileName, new Uint8Array(pdfData), 'pdf');
    } else {
      doc.save(`${fileName}.pdf`);
      logger.info('PDF exportado e descarregado (Web)', { fileName }, 'EXPORT');
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Erro ao exportar PDF com gráfico', { fileName, error: err.message }, 'EXPORT');
    throw error;
  }
};

export const exportToExcel = async ({ fileName, columns, data }: ExportOptions) => {
  try {
    const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dados');

  // Adicionar cabeçalhos
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.dataKey,
    width: Math.max(col.header.length, 15)
  }));

  // Adicionar dados
  worksheet.addRows(data);

  // Estilizar cabeçalho
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  if (isTauri()) {
    const buffer = await workbook.xlsx.writeBuffer();
    await saveFileTauri(fileName, new Uint8Array(buffer), 'xlsx');
  } else {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    logger.info('Excel exportado e descarregado (Web)', { fileName }, 'EXPORT');
  }
} catch (error: unknown) {
  const err = error as Error;
  logger.error('Erro ao exportar Excel', { fileName, error: err.message }, 'EXPORT');
  throw error;
}
};
