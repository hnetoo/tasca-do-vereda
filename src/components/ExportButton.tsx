'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  columns: { header: string; dataKey: string }[];
  fileName: string;
  title: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName }) => {
  const handleExport = () => {
    const headers = data.length > 0 ? Object.keys(data[0]).join(',') : '';
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Download size={18} />
      Exportar
    </button>
  );
};

export default ExportButton;
