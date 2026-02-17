import React from 'react';
import { QrCode, Settings } from 'lucide-react';

const QRMenuConfig = () => {
  return (
    <div className="p-4 border border-slate-700 bg-slate-800 rounded-lg mt-4 text-white">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
        <QrCode size={20} className="text-cyan-400" />
        Configuração de Menu QR
      </h3>
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
    </div>
  );
};
export default QRMenuConfig;
