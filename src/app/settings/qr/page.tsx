'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { QrCode, Printer } from 'lucide-react';

export default function SettingsQRPage() {
  const { settings, addNotification } = useStore();
  const [isQRMenuConfigOpen, setIsQRMenuConfigOpen] = useState(false);

  const getBaseAppUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'http://localhost:3000';
  };

  const generateQRUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handlePrintGeneralQRs = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrUrl = generateQRUrl(`${getBaseAppUrl()}/menu-digital`);
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code Menu Digital</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial; }
              .qr-container { text-align: center; page-break-after: always; }
              .qr-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .qr-subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
              img { max-width: 300px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">Menu Digital</div>
              <div class="qr-subtitle">Escaneie para acessar nosso cardápio</div>
              <img src="${qrUrl}" alt="QR Menu Digital" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      addNotification('success', 'QR Codes enviados para impressão!');
    }
  };

  const handlePrintAllQRs = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let html = '<html><head><title>QR Codes por Mesa</title>';
      html += '<style>body { margin: 0; padding: 20px; font-family: Arial; }';
      html += '.qr-container { text-align: center; page-break-after: always; margin-bottom: 30px; }';
      html += '.qr-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }';
      html += '.qr-subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }';
      html += 'img { max-width: 200px; }</style></head><body>';

      // QR Geral
      const generalQR = generateQRUrl(`${getBaseAppUrl()}/menu-digital`);
      html += '<div class="qr-container">';
      html += '<div class="qr-title">Menu Digital - Geral</div>';
      html += '<div class="qr-subtitle">Escaneie para acessar nosso cardápio</div>';
      html += `<img src="${generalQR}" alt="QR Menu Digital" />`;
      html += '</div>';

      // QRs por mesa (se existirem mesas)
      if (settings.tables && settings.tables.length > 0) {
        settings.tables.forEach((table: any) => {
          const tableQR = generateQRUrl(`${getBaseAppUrl()}/menu-digital?table=${table.id}`);
          html += '<div class="qr-container">';
          html += `<div class="qr-title">Mesa ${table.name || table.id}</div>`;
          html += '<div class="qr-subtitle">Escaneie para fazer pedido nesta mesa</div>';
          html += `<img src="${tableQR}" alt="QR Mesa ${table.id}" />`;
          html += '</div>';
        });
      }

      html += '</body></html>';
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      addNotification('success', 'QR Codes individuais enviados para impressão!');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Menu QR</h1>
        <p className="text-slate-400">Configurações do menu QR Code</p>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Menu Digital QR</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Geração de Códigos e Links</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Preview Column */}
            <div className="lg:col-span-1 flex justify-center">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-glow relative group">
                <Image 
                  src={generateQRUrl(`${getBaseAppUrl()}/menu-digital`)} 
                  alt="QR Menu Digital" 
                  className="w-48 h-48 group-hover:scale-105 transition-transform duration-500" 
                  width={200} 
                  height={200} 
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest shadow-lg whitespace-nowrap">
                  Pré-visualização Geral
                </div>
              </div>
            </div>

            {/* Actions Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <p className="text-sm text-slate-400 font-medium mb-6 leading-relaxed">
                  Configure a URL base do seu menu digital e gere os códigos QR para impressão. 
                  Você pode gerar um código único para o balcão ou códigos individuais para cada mesa configurada.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsQRMenuConfigOpen(true)}
                    className="p-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:brightness-110 transition-all shadow-glow justify-center"
                  >
                    <QrCode size={18} /> Configurar URL
                  </button>
                  <button 
                    onClick={handlePrintGeneralQRs}
                    className="p-4 bg-slate-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-600 transition-all border border-white/5 justify-center"
                  >
                    <Printer size={18} /> Imprimir Geral
                  </button>
                  <button 
                    onClick={handlePrintAllQRs}
                    className="col-span-1 md:col-span-2 p-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-700 transition-all border border-white/5 justify-center group"
                  >
                    <Printer size={18} className="text-primary group-hover:scale-110 transition-transform" /> Imprimir QRs Individuais (Mesas)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
