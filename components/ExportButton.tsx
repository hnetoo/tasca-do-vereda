import React, { useState } from 'react';
import { FileDown, FileText, Sheet } from 'lucide-react';
import { exportToExcel, exportToPDF, ExportColumn } from '../services/exportService';

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  fileName: string; // Base filename without extension
  title: string;    // Title for PDF
  className?: string; // Optional className for the main button
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, columns, fileName, title, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportPDF = () => {
    exportToPDF({ data, columns, fileName, title });
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel({ data, columns, fileName, title });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-20">
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div 
            className="fixed inset-0 z-40 cursor-default" 
            onClick={() => setIsOpen(false)}
        ></div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider shadow-sm ${className}`}
      >
        <FileDown size={18} className="text-primary" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button 
                onClick={handleExportPDF}
                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 uppercase tracking-wide"
            >
                <FileText size={16} className="text-red-400" />
                Exportar PDF
            </button>
            <button 
                onClick={handleExportExcel}
                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-wide"
            >
                <Sheet size={16} className="text-green-400" />
                Exportar Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
