'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Shield, Plus, Trash2, Edit, Key, Users, Check, X } from 'lucide-react';

export default function SettingsRolesPage() {
  const { addNotification } = useStore();
  
  // Estados do formulário
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: 'blue'
  });
  
  // Estado para cargos do sistema
  const [roles, setRoles] = useState<any[]>([]);
  
  // Carregar cargos do Supabase
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles');
      const result = await response.json();

      if (response.ok) {
        setRoles(result.data || []);
      } else {
        throw new Error(result.error || 'Falha ao carregar cargos');
      }
    } catch (error: any) {
      console.error('Erro ao carregar cargos:', error);
      addNotification('error', `Falha ao carregar cargos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      addNotification('error', 'Nome e descrição são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      if (editingRole) {
        // Atualizar cargo
        const response = await fetch('/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRole.id,
            ...formData
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao atualizar cargo');
        }

        addNotification('success', 'Cargo atualizado com sucesso!');
      } else {
        // Criar novo cargo
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao criar cargo');
        }

        addNotification('success', 'Cargo criado com sucesso!');
      }
      
      // Resetar formulário e recarregar
      setFormData({ name: '', description: '', permissions: [], color: 'blue' });
      setShowModal(false);
      setEditingRole(null);
      await loadRoles();
      
    } catch (error: any) {
      console.error('Erro ao salvar cargo:', error);
      addNotification('error', `Falha ao salvar cargo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
      color: role.color || 'blue'
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este cargo?')) {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/roles?id=${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao remover cargo');
        }

        addNotification('success', 'Cargo removido com sucesso!');
        await loadRoles();
        
      } catch (error: any) {
        console.error('Erro ao remover cargo:', error);
        addNotification('error', `Falha ao remover cargo: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const availablePermissions = [
    { id: 'all', label: 'Acesso Completo', icon: '🔑' },
    { id: 'orders', label: 'Pedidos', icon: '📋' },
    { id: 'menu', label: 'Cardápio', icon: '🍽️' },
    { id: 'reports', label: 'Relatórios', icon: '📊' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
    { id: 'kitchen', label: 'Cozinha', icon: '👨‍🍳' },
    { id: 'payments', label: 'Pagamentos', icon: '💳' },
    { id: 'users', label: 'Usuários', icon: '👥' },
    { id: 'tables', label: 'Mesas', icon: '🪑' },
    { id: 'inventory', label: 'Estoque', icon: '📦' }
  ];

  const colors = [
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'gray', label: 'Cinza', class: 'bg-gray-500' }
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Cargos</h1>
        <p className="text-slate-400">Gerencie os cargos e permissões do sistema</p>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-slate-400">
          {roles.length} cargos cadastrados
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [], color: 'blue' });
            setShowModal(true);
          }}
          className="px-6 py-3 bg-primary text-black rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Cargo
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${colors.find(c => c.value === role.color)?.class || 'bg-blue-500'} bg-opacity-20 flex items-center justify-center`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{role.name}</h3>
                  <p className="text-sm text-slate-400">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <div className="text-sm text-slate-400 font-medium">Permissões:</div>
              <div className="flex flex-wrap gap-2">
                {(role.permissions || []).map((permission: string) => {
                  const perm = availablePermissions.find(p => p.id === permission);
                  return (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-300"
                    >
                      {perm?.icon} {perm?.label || permission}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Cargo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cor</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  >
                    {colors.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Permissões</label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: [...prev.permissions, permission.id] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== permission.id) 
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-white">
                        {permission.icon} {permission.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingRole ? 'Atualizar' : 'Criar')}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRole(null);
                    setFormData({ name: '', description: '', permissions: [], color: 'blue' });
                  }}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
