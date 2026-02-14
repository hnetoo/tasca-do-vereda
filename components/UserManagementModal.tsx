/**
 * Sistema de Gestão de Utilizadores com Permissões Avançadas
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, UserRole } from '../types';
import { Edit2, Trash2, Shield, X, Save, Eye, EyeOff, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { getPermissions, permissionDescriptions, ALL_PERMISSIONS } from '../services/permissionsService';
import { Permission } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, addUser, updateUser, removeUser, addNotification, settings } = useStore();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPinField, setShowPinField] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    pin: string;
    color: string;
    permissions?: Permission[];
  }>({
    name: '',
    role: 'GARCOM' as UserRole,
    pin: '',
    color: '#06b6d4',
    permissions: undefined
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.pin) {
      addNotification('error', 'Nome e PIN são obrigatórios');
      return;
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        name: formData.name,
        role: formData.role,
        pin: formData.pin || editingUser.pin,
        color: formData.color,
        permissions: formData.permissions
      });
      addNotification('success', `Utilizador ${formData.name} atualizado`);
    } else {
      const newUser: User = {
        // eslint-disable-next-line react-hooks/purity
        id: `user-${window.crypto.randomUUID?.() || Date.now()}`,
        name: formData.name,
        role: formData.role,
        pin: formData.pin,
        color: formData.color,
        permissions: formData.permissions
      };
      addUser(newUser);
      addNotification('success', `Utilizador ${formData.name} criado`);
    }

    handleReset();
  };

  const handleReset = () => {
    setEditingUser(null);
    setFormData({ name: '', role: 'GARCOM', pin: '', color: '#06b6d4', permissions: undefined });
    setShowPinField(false);
    setPinVisible(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      pin: user.pin,
      color: user.color || '#06b6d4',
      permissions: user.permissions
    });
  };

  const handleTogglePermission = (perm: Permission) => {
    let currentPermissions = formData.permissions;
    
    // Se as permissões ainda não foram personalizadas, inicializar com as permissões do cargo
    if (!currentPermissions) {
      currentPermissions = getPermissions(formData.role, settings.customRoles);
    }

    let newPermissions: Permission[];
    if (currentPermissions.includes(perm)) {
      newPermissions = currentPermissions.filter(p => p !== perm);
    } else {
      newPermissions = [...currentPermissions, perm];
    }
    
    setFormData({ 
      ...formData, 
      permissions: newPermissions 
    });
  };

  const handleResetPermissions = () => {
    setFormData({ ...formData, permissions: undefined });
  };

  if (!isOpen) return null;
  
  // Permissões ativas (seja do utilizador ou do cargo)
  const activePermissions = formData.permissions || getPermissions(formData.role, settings.customRoles);
  const isCustomized = formData.permissions !== undefined;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
      <div className="glass-panel rounded-[3rem] w-full max-w-4xl p-12 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-white italic uppercase">Gestão de Utilizadores</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={32} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulário */}
          <div>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Função/Role</label>
                <select
                  className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-semibold"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff'
                  }}
                >
                  <optgroup label="Cargos Padrão">
                    <option value="ADMIN" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>ADMIN - Administrador</option>
                    <option value="CAIXA" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>CAIXA - Operador de Caixa</option>
                    <option value="GARCOM" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>GARCOM - Garçom</option>
                    <option value="COZINHA" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>COZINHA - Cozinha</option>
                  </optgroup>
                  
                  {settings.customRoles && settings.customRoles.length > 0 && (
                    <optgroup label="Cargos Customizados">
                      {settings.customRoles.map(role => (
                        <option 
                          key={role.id} 
                          value={role.name}
                          style={{ backgroundColor: '#1e293b', color: role.color || '#ffffff' }}
                        >
                          {role.name} - {role.description || 'Cargo Customizado'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cor de Identificação</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    className="w-12 h-12 rounded-xl cursor-pointer"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">PIN de Acesso</label>
                  <button
                    type="button"
                    className="text-[9px] text-primary font-black"
                    onClick={() => {
                      setShowPinField(!showPinField);
                      if (!showPinField) setPinVisible(false);
                    }}
                  >
                    {editingUser && !showPinField ? 'MANTER PIN' : 'ALTERAR PIN'}
                  </button>
                </div>
                {(showPinField || !editingUser) && (
                  <div className="relative">
                    <input
                      type={pinVisible ? 'text' : 'password'}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono"
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="4 dígitos PIN"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      onClick={() => setPinVisible(!pinVisible)}
                    >
                      {pinVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> {editingUser ? 'Atualizar Utilizador' : 'Criar Utilizador'}
              </button>

              {editingUser && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-4 bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-600 transition-all"
                >
                  Cancelar Edição
                </button>
              )}
            </form>
          </div>

          {/* Lista de Utilizadores + Permissões */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white mb-4">Utilizadores Ativos</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black" style={{ backgroundColor: user.color }}>
                        {user.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Eliminar ${user.name}?`)) {
                            removeUser(user.id);
                            addNotification('success', `Utilizador ${user.name} eliminado`);
                            handleReset();
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissões da Role Selecionada */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-primary" />
                  <h3 className="text-lg font-black text-white">
                    Permissões {isCustomized ? '(Personalizadas)' : `- ${formData.role}`}
                  </h3>
                </div>
                {isCustomized && (
                  <button 
                    type="button"
                    onClick={handleResetPermissions}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase transition-all"
                  >
                    <RefreshCw size={12} /> Restaurar Padrão
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {ALL_PERMISSIONS.map((perm: Permission) => {
                  const isActive = activePermissions.includes(perm);
                  return (
                    <button 
                      key={perm} 
                      type="button"
                      onClick={() => handleTogglePermission(perm)}
                      className={`w-full text-left p-3 border rounded-xl transition-all flex items-start gap-3 group ${
                        isActive 
                          ? 'bg-primary/10 border-primary/20 hover:bg-primary/20' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`mt-0.5 transition-colors ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {isActive ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {perm}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{permissionDescriptions[perm]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
