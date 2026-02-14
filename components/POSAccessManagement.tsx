/**
 * Gerenciamento de Acessos POS com Permissões por Utilizador
 * Permite visualizar, editar e controlar permissões granulares
 */

import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { User, Permission } from '../types';
import { Users, Shield, Check, X, Lock, Unlock } from 'lucide-react';
import { ALL_PERMISSIONS, permissionDescriptions, getPermissions } from '../services/permissionsService';

interface POSAccessManagementProps {
  onOpenUserModal?: () => void;
}

const POSAccessManagement: React.FC<POSAccessManagementProps> = ({ onOpenUserModal }) => {
  const { users, settings, addNotification } = useStore();
  const [selectedUser, setSelectedUser] = React.useState<User | null>(users[0] || null);

  // Obter permissões do utilizador selecionado
  const userPermissions = useMemo(() => {
    if (!selectedUser) return [];
    return getPermissions(selectedUser.role, settings.customRoles, selectedUser.permissions);
  }, [selectedUser, settings.customRoles]);

  // Agrupar permissões por categoria
  const permissionGroups: Record<string, Permission[]> = {
    'Pedidos': ['CREATE_ORDER', 'EDIT_ORDER', 'DELETE_ORDER', 'PAY_ORDER'],
    'Caixa': ['PAY_ORDER', 'APPLY_DISCOUNT', 'VIEW_FINANCIAL'],
    'Gestão': ['MANAGE_USERS', 'MANAGE_INVENTORY', 'MANAGE_TABLES', 'MANAGE_RESERVATIONS', 'MANAGE_EMPLOYEES'],
    'Cozinha': ['VIEW_KITCHEN', 'PRINT_BILL'],
    'Sistema': ['ACCESS_REPORTS', 'QR_MENU_CONFIG', 'BIOMETRIC_SYNC', 'EXPORT_DATA']
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 border-red-500 text-red-300';
      case 'CAIXA':
        return 'bg-purple-500/20 border-purple-500 text-purple-300';
      case 'GARCOM':
        return 'bg-blue-500/20 border-blue-500 text-blue-300';
      case 'COZINHA':
        return 'bg-orange-500/20 border-orange-500 text-orange-300';
      default:
        return 'bg-slate-500/20 border-slate-500 text-slate-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '👑';
      case 'CAIXA':
        return '💳';
      case 'GARCOM':
        return '🍽️';
      case 'COZINHA':
        return '👨‍🍳';
      default:
        return '👤';
    }
  };

  const handleCopyPermissionsList = () => {
    const text = `
Utilizador: ${selectedUser?.name}
Função: ${selectedUser?.role}

Permissões:
${userPermissions.map(p => `- ${p}: ${permissionDescriptions[p]}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    addNotification('success', 'Permissões copiadas para clipboard');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic">Controlo de Acessos POS</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {users.length} utilizador{users.length !== 1 ? 'es' : ''} ativo{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenUserModal}
          className="px-6 py-3 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-glow"
        >
          <Users size={16} /> Gerenciar Utilizadores
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Utilizadores */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">Utilizadores</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedUser?.id === user.id
                    ? `${getRoleColor(user.role)} border-current bg-opacity-30`
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getRoleIcon(user.role)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{user.name}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">{user.role}</div>
                  </div>
                </div>
              </button>
            ))}

            {users.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase">Nenhum utilizador</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Utilizador */}
        {selectedUser && (
          <div className="lg:col-span-3 space-y-6">
            {/* Card de Informação */}
            <div className={`p-6 rounded-[2rem] border-2 ${getRoleColor(selectedUser.role)}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getRoleIcon(selectedUser.role)}</span>
                    <div>
                      <h4 className="text-xl font-black text-white uppercase">{selectedUser.name}</h4>
                      <p className="text-[11px] font-bold text-current uppercase tracking-widest">{selectedUser.role}</p>
                    </div>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-lg border-2 border-white/20"
                  style={{ backgroundColor: selectedUser.color }}
                  title={selectedUser.color}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-current/30">
                <div>
                  <div className="text-2xl font-black text-current">{userPermissions.length}</div>
                  <div className="text-[9px] font-bold text-current/80 uppercase">Permissões</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-green-400">
                    {selectedUser.pin ? '●' : '○'}
                  </div>
                  <div className="text-[9px] font-bold text-green-400/80 uppercase">PIN Ativo</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-400">{selectedUser.id.slice(-4)}</div>
                  <div className="text-[9px] font-bold text-blue-400/80 uppercase">ID</div>
                </div>
              </div>
            </div>

            {/* Matriz de Permissões */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mapa de Permissões</p>
                  <button
                    onClick={handleCopyPermissionsList}
                    className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                  >
                    📋 Copiar Lista
                  </button>
                </div>

                {Object.entries(permissionGroups).map(([category, permissions]) => (
                  <div key={category} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                      <Shield size={14} className="text-primary" />
                      <span className="font-black text-white text-sm uppercase tracking-wider">{category}</span>
                      <div className="flex-1"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {permissions.filter(p => userPermissions.includes(p)).length}/{permissions.length}
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      {permissions.map(permission => {
                        const hasIt = userPermissions.includes(permission);
                        return (
                          <div
                            key={permission}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                              hasIt
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                hasIt
                                  ? 'bg-green-500/30 border-green-500'
                                  : 'bg-red-500/30 border-red-500'
                              }`}
                            >
                              {hasIt && <Check size={12} className="text-green-300" />}
                              {!hasIt && <X size={12} className="text-red-300" />}
                            </div>
                            <div className="flex-1">
                              <div className={`font-bold text-sm uppercase tracking-tight ${
                                hasIt ? 'text-green-300' : 'text-red-300'
                              }`}>
                                {permission}
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium mt-1">
                                {permissionDescriptions[permission]}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-2xl border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Unlock size={18} className="text-green-400" />
                  <span className="text-sm font-black text-green-400 uppercase">Acesso Concedido</span>
                </div>
                <div className="text-3xl font-black text-green-300">{userPermissions.length}</div>
                <p className="text-[9px] text-green-300/60 font-bold mt-1">
                  de {ALL_PERMISSIONS.length} permissões
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 rounded-2xl border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={18} className="text-red-400" />
                  <span className="text-sm font-black text-red-400 uppercase">Acesso Negado</span>
                </div>
                <div className="text-3xl font-black text-red-300">{ALL_PERMISSIONS.length - userPermissions.length}</div>
                <p className="text-[9px] text-red-300/60 font-bold mt-1">
                  permissões restritas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
          💡 <strong>Dica:</strong> As permissões podem ser personalizadas por utilizador (clique em "Gerenciar Utilizadores" e edite um utilizador) ou por função (crie cargos customizados na aba "Sistema").
        </p>
      </div>
    </div>
  );
};

export default POSAccessManagement;
