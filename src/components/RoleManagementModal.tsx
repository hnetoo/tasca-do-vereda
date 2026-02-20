'use client';

import React, { useState } from 'react';
import { X, Shield, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { DEFAULT_ROLES, permissionDescriptions } from '@/constants/permissions';
import { Permission } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any;
}

const RoleManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-2xl text-white max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-blue-400" />
            Gestão de Cargos e Permissões
          </h2>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-200 text-sm mb-4">
            Visualize as permissões atribuídas a cada cargo do sistema.
          </div>

          {Object.entries(DEFAULT_ROLES).map(([role, permissions]) => (
            <div key={role} className="border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
              <button 
                onClick={() => toggleRole(role)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                    role === 'CAIXA' ? 'bg-blue-500/20 text-blue-400' :
                    role === 'GARCOM' ? 'bg-green-500/20 text-green-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    <Shield size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white">{role}</h3>
                    <p className="text-xs text-slate-400">{permissions.length} permissões ativas</p>
                  </div>
                </div>
                {expandedRole === role ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {expandedRole === role && (
                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((perm) => (
                      <div key={perm} className="flex items-start gap-2 text-sm text-slate-300 p-2 rounded hover:bg-slate-800/50">
                        <Check size={14} className="text-green-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="font-medium block text-slate-200">{perm}</span>
                          <span className="text-xs text-slate-500">{permissionDescriptions[perm as Permission] || perm}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModal;
