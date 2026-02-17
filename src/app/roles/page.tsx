'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import RoleManagementModal from '@/components/RoleManagementModal';

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(true);

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-900 text-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Shield size={32} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Cargos</h1>
          <p className="text-slate-400">Gerencie os cargos e permissões do sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
           <p className="text-slate-400 mb-4">Clique no botão abaixo para abrir a gestão de cargos.</p>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
           >
             Gerir Cargos
           </button>
        </div>
      </div>

      <RoleManagementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
