/**
 * Gerenciamento de Cargos/Roles Customizados
 * Permite criar, editar e eliminar roles com permissões customizadas
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { CustomRole, Permission } from '../types';
import { Plus, Edit2, Trash2, X, Save, Shield, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ALL_PERMISSIONS, permissionDescriptions } from '../services/permissionsService';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoleManagementModal: React.FC<RoleManagementModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, addNotification } = useStore();
  const customRoles = settings.customRoles || [];
  
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#06b6d4',
    permissions: [] as Permission[]
  });

  const defaultRoles = ['ADMIN', 'CAIXA', 'GARCOM', 'COZINHA'];

  const PERMISSION_GROUPS: { name: string; permissions: Permission[] }[] = [
    {
      name: 'Vendas & POS',
      permissions: ['CREATE_ORDER', 'EDIT_ORDER', 'PAY_ORDER', 'APPLY_DISCOUNT', 'PRINT_BILL', 'MANAGE_TABLES', 'MANAGE_RESERVATIONS']
    },
    {
      name: 'Operações & Cozinha',
      permissions: ['VIEW_KITCHEN']
    },
    {
      name: 'Financeiro',
      permissions: ['VIEW_FINANCIAL', 'DELETE_ORDER', 'ACCESS_REPORTS', 'EXPORT_DATA']
    },
    {
      name: 'Stock & Inventário',
      permissions: ['MANAGE_INVENTORY']
    },
    {
      name: 'Recursos Humanos',
      permissions: ['MANAGE_EMPLOYEES', 'BIOMETRIC_SYNC']
    },
    {
      name: 'Administração & Sistema',
      permissions: ['MANAGE_USERS', 'QR_MENU_CONFIG']
    }
  ];

  const handleNewRole = () => {
    setFormData({ name: '', description: '', color: '#06b6d4', permissions: [] });
    setEditingRole(null);
    setShowForm(true);
  };

  const handleEditRole = (role: CustomRole) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color || '#06b6d4',
      permissions: [...role.permissions]
    });
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addNotification('error', 'Nome do cargo é obrigatório');
      return;
    }

    const newRoles = [...customRoles];

    if (editingRole) {
      const index = newRoles.findIndex(r => r.id === editingRole.id);
      if (index !== -1) {
        newRoles[index] = {
          ...editingRole,
          name: formData.name,
          description: formData.description,
          color: formData.color,
          permissions: formData.permissions
        };
        addNotification('success', `Cargo "${formData.name}" atualizado`);
      }
    } else {
      const newRole: CustomRole = {
        id: `role-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        color: formData.color,
        permissions: formData.permissions,
        isDefault: false
      };
      newRoles.push(newRole);
      addNotification('success', `Cargo "${formData.name}" criado`);
    }

    updateSettings({ customRoles: newRoles });
    setShowForm(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Tem a certeza que deseja eliminar este cargo?')) {
      const newRoles = customRoles.filter(r => r.id !== roleId);
      updateSettings({ customRoles: newRoles });
      addNotification('success', 'Cargo eliminado');
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSelectAll = () => {
    setFormData({ ...formData, permissions: [...ALL_PERMISSIONS] });
  };

  const handleDeselectAll = () => {
    setFormData({ ...formData, permissions: [] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel rounded-[3rem] w-full max-w-5xl p-12 border border-white/10 shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-white italic uppercase">Gestão de Cargos</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={32} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Cargos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white uppercase">Cargos</h3>
              <button
                onClick={handleNewRole}
                className="p-2 bg-primary rounded-lg hover:brightness-110 transition-all text-black"
                title="Novo cargo"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {/* Cargos Padrão */}
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2">
                Cargos Padrão
              </div>
              {defaultRoles.map(roleName => (
                <div
                  key={roleName}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-all text-left"
                >
                  <div className="font-bold text-white text-sm">{roleName}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Sistema</div>
                </div>
              ))}

              {/* Cargos Customizados */}
              {customRoles.length > 0 && (
                <>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2 mt-4">
                    Cargos Customizados ({customRoles.length})
                  </div>
                  {customRoles.map(role => (
                    <div
                      key={role.id}
                      className="p-4 rounded-xl bg-primary/10 border border-primary/30 cursor-pointer hover:border-primary/50 transition-all text-left group"
                      onClick={() => handleEditRole(role)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            ></div>
                            <span className="font-bold text-white text-sm">{role.name}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">
                            {role.permissions.length} permissões
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/20 rounded hover:bg-red-500/40"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Formulário ou Lista de Detalhes */}
          <div className="lg:col-span-2">
            {showForm ? (
              <form onSubmit={handleSaveRole} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Nome do Cargo
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Chefe de Sala, Ajudante de Cozinha"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary resize-none h-20"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição breve do cargo"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Cor de Identificação
                  </label>
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

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between sticky top-0 bg-[#1a1c23] z-10 py-2 border-b border-white/10 mb-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Permissões ({formData.permissions.length}/{ALL_PERMISSIONS.length})
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase transition-colors"
                        >
                          Tudo
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase transition-colors"
                        >
                          Nenhum
                        </button>
                      </div>
                    </div>

                    {PERMISSION_GROUPS.map(group => (
                      <div key={group.name} className="space-y-3 pb-4 border-b border-white/5 last:border-0">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider pl-2 border-l-2 border-primary mb-2">
                          {group.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
                          {group.permissions.map(permission => (
                            <label
                              key={permission}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group/item ${
                                formData.permissions.includes(permission)
                                  ? 'bg-primary/10 border-primary/30'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                formData.permissions.includes(permission)
                                  ? 'bg-primary border-primary'
                                  : 'border-slate-500 group-hover/item:border-primary/50'
                              }`}>
                                {formData.permissions.includes(permission) && <Check size={10} className="text-black" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission)}
                                onChange={() => handlePermissionToggle(permission)}
                                className="hidden"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`font-bold text-[11px] uppercase tracking-tight truncate ${
                                  formData.permissions.includes(permission) ? 'text-white' : 'text-slate-400'
                                }`}>
                                  {permissionDescriptions[permission] || permission}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> {editingRole ? 'Atualizar' : 'Criar'} Cargo
                  </button>
                </div>
              </form>
            ) : customRoles.length > 0 ? (
              <div className="space-y-6">
                {customRoles.map(role => (
                  <div key={role.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <button
                      onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div
                          className="w-6 h-6 rounded-lg"
                          style={{ backgroundColor: role.color }}
                        ></div>
                        <div>
                          <h4 className="font-black text-white uppercase">{role.name}</h4>
                          {role.description && (
                            <p className="text-[9px] text-slate-400 mt-1">{role.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {role.permissions.length} permissões
                        </span>
                        {expandedRole === role.id ? (
                          <ChevronUp size={20} className="text-primary" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-600" />
                        )}
                      </div>
                    </button>

                    {expandedRole === role.id && (
                      <div className="border-t border-white/5 p-6 space-y-3 bg-black/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {role.permissions.map(permission => (
                            <div
                              key={permission}
                              className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                            >
                              <Check size={14} className="text-green-400" />
                              <div className="flex-1">
                                <div className="text-[10px] font-black text-green-300 uppercase">
                                  {permission}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="flex-1 py-3 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="flex-1 py-3 bg-red-500/20 text-red-300 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/40 transition-all"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
                <Shield size={48} className="text-slate-600" />
                <div className="text-center">
                  <p className="text-slate-400 font-bold uppercase text-sm mb-4">
                    Nenhum cargo customizado criado
                  </p>
                  <button
                    onClick={handleNewRole}
                    className="px-8 py-3 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:brightness-110 transition-all mx-auto"
                  >
                    <Plus size={16} /> Criar Primeiro Cargo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModal;
