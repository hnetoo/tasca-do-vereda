'use client';

import React from 'react';
import { Lock, Shield, CheckCircle, XCircle, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { canAccessModule } from '@/services/permissionsService';

const POSAccessManagement = () => {
  const { employees } = useStore();
  
  // Filter employees who have access to POS
  const posUsers = employees.filter(emp => canAccessModule(emp.role as any, 'pos'));
  const otherUsers = employees.filter(emp => !canAccessModule(emp.role as any, 'pos'));

  return (
    <div className="space-y-6">
      <div className="p-4 border border-slate-700 bg-slate-800 rounded-lg text-white">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <Lock size={20} className="text-red-400" />
          Controlo de Acesso POS
        </h3>
        <p className="text-slate-400 mb-4">Gerencie os acessos e permissões dos terminais POS.</p>
        
        <div className="p-3 bg-slate-900 rounded border border-slate-700 text-sm mb-6">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <Shield size={16} />
            <span className="font-bold">Segurança Ativa</span>
          </div>
          <p className="text-slate-400">O acesso aos terminais POS é restrito a utilizadores com permissões específicas.</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Utilizadores com Acesso ({posUsers.length})</h4>
          <div className="grid gap-3">
            {posUsers.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-600 rounded-full">
                    <User size={16} className="text-slate-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{emp.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        emp.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                        emp.role === 'CAIXA' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {emp.role}
                      </span>
                      <span>PIN: ****</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                  <CheckCircle size={14} />
                  <span>AUTORIZADO</span>
                </div>
              </div>
            ))}
            {posUsers.length === 0 && (
              <div className="p-4 text-center text-slate-500 italic">Nenhum utilizador com acesso ao POS.</div>
            )}
          </div>
        </div>

        {otherUsers.length > 0 && (
          <div className="space-y-4 mt-6">
            <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Outros Utilizadores ({otherUsers.length})</h4>
            <div className="grid gap-3 opacity-75">
              {otherUsers.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-full">
                      <User size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-300">{emp.name}</div>
                      <div className="text-xs text-slate-500">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                    <XCircle size={14} />
                    <span>SEM ACESSO</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSAccessManagement;
