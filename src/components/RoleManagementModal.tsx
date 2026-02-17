import React from 'react';
import { X, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any;
}

const RoleManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-blue-400" />
            Gestão de Cargos
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-200 text-sm">
            As permissões atuais continuam ativas.
          </div>
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
export default RoleManagementModal;
