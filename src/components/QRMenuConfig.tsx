import React from 'react';
import { QrCode, Settings, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const QRMenuConfig: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode size={20} className="text-cyan-400" />
            Configuração de Menu QR
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <p className="text-slate-400 mb-4">Gerencie as configurações do menu digital e QR Codes das mesas.</p>
        
        <div className="p-3 bg-slate-900 rounded border border-slate-700 text-sm">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <Settings size={16} />
            <span>Configuração Temporária</span>
          </div>
          <p className="text-slate-500">
            O módulo de configuração visual do QR Code está a ser carregado.
            As configurações atuais (URLs, Cores) continuam ativas no sistema.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
export default QRMenuConfig;
