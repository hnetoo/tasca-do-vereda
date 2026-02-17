'use client';

import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gestão de Utilizadores</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <p className="text-slate-400">A interface de gestão de utilizadores está temporariamente indisponível para manutenção.</p>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-sm">
            Os dados dos utilizadores estão seguros na base de dados.
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
export default UserManagementModal;
