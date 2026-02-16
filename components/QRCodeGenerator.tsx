import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, Printer } from 'lucide-react';

interface QRCodeGeneratorProps {
  restaurantId?: string; // Optional if single tenant
  tableId?: string; // Optional specific table
  subdomain?: string; // e.g. "tasca-do-vereda"
  baseUrl?: string; // e.g. "https://tasca-do-vereda.vercel.app"
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  restaurantId,
  tableId,
  subdomain = 'tasca-do-vereda',
  baseUrl = 'https://tasca-do-vereda.vercel.app'
}) => {
  
  const qrUrl = useMemo(() => {
    let url = baseUrl;
    if (tableId) {
      url += `/menu/${tableId}`;
    } else {
      url += `/menu`;
    }
    // Add tracking params if needed
    return url;
  }, [baseUrl, tableId]);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${tableId || 'menu'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Menu QR Code</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: sans-serif; }
              h1 { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Menu Digital</h1>
            ${document.getElementById('qr-code-container')?.innerHTML}
            <p>${qrUrl}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        {tableId ? `Mesa ${tableId}` : 'Menu Digital'}
      </h3>
      
      <div id="qr-code-container" className="p-4 bg-white border-2 border-gray-100 rounded-lg mb-4">
        <QRCodeSVG
          id="qr-code-svg"
          value={qrUrl}
          size={200}
          level="H" // High error correction
          includeMargin={true}
          imageSettings={{
            src: "/logo.png", // Ensure this exists in public folder
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <div className="text-sm text-gray-500 mb-6 text-center break-all">
        {qrUrl}
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          <span>Baixar</span>
        </button>
        
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Printer size={18} />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
