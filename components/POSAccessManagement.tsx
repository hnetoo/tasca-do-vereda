import React from 'react';
import { Lock, Shield } from 'lucide-react';

const POSAccessManagement = () => {
  return (
    <div className="p-4 border border-slate-700 bg-slate-800 rounded-lg mt-4 text-white">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
        <Lock size={20} className="text-red-400" />
        Controlo de Acesso POS
      </h3>
      <p className="text-slate-400 mb-4">Gerencie os acessos e permissões dos terminais POS.</p>
      
      <div className="p-3 bg-slate-900 rounded border border-slate-700 text-sm">
        <div className="flex items-center gap-2 text-yellow-500 mb-2">
          <Shield size={16} />
          <span>Segurança Ativa</span>
        </div>
        <p className="text-slate-500">
          As regras de acesso atuais continuam ativas.
          A interface de gestão visual está em manutenção.
        </p>
      </div>
    </div>
  );
};
export default POSAccessManagement;
