'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Shield, Plus, Trash2, Edit, Key, Users, Check, X } from 'lucide-react';

export default function SettingsRolesPage() {
  const { addNotification } = useStore();
  
  // Carregar dados do localStorage ao montar
  const [roles, setRoles] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedRoles = localStorage.getItem('tasca_roles');
      if (savedRoles) {
        return JSON.parse(savedRoles);
      }
    }
    
    // Dados padrão se não houver nada salvo
    return [
      {
        id: '1',
        name: 'Administrador',
        description: 'Acesso completo ao sistema',
        permissions: ['all'],
        userCount: 1,
        color: 'red'
      },
      {
        id: '2',
        name: 'Gerente',
        description: 'Gerenciamento de pedidos, relatórios e configurações',
        permissions: ['orders', 'menu', 'reports', 'settings'],
        userCount: 2,
        color: 'yellow'
      },
      {
        id: '3',
        name: 'Garçom',
        description: 'Acesso a pedidos e menu',
        permissions: ['orders', 'menu'],
        userCount: 5,
        color: 'blue'
      }
    ];
  });

  // Salvar dados no localStorage quando roles mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasca_roles', JSON.stringify(roles));
    }
  }, [roles]);

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: 'blue'
  });

  const availablePermissions = [
    { id: 'orders', name: 'Pedidos', description: 'Criar e gerenciar pedidos' },
    { id: 'menu', name: 'Cardápio', description: 'Gerenciar produtos e categorias' },
    { id: 'reports', name: 'Relatórios', description: 'Visualizar relatórios e estatísticas' },
    { id: 'settings', name: 'Configurações', description: 'Acesso às configurações do sistema' },
    { id: 'users', name: 'Usuários', description: 'Gerenciar usuários e permissões' },
    { id: 'tables', name: 'Mesas', description: 'Gerenciar mesas e layout' },
    { id: 'kitchen', name: 'Cozinha', description: 'Acesso ao KDS e pedidos' },
    { id: 'cashier', name: 'Caixa', description: 'Operações de caixa e pagamentos' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, ...formData }
          : role
      ));
      addNotification('success', 'Cargo atualizado com sucesso!');
    } else {
      const newRole = {
        ...formData,
        id: Date.now().toString(),
        userCount: 0
      };
      setRoles([...roles, newRole]);
      addNotification('success', 'Cargo adicionado com sucesso!');
    }
    
    setFormData({ name: '', description: '', permissions: [], color: 'blue' });
    setShowModal(false);
    setEditingRole(null);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este cargo?')) {
      setRoles(roles.filter(role => role.id !== id));
      addNotification('success', 'Cargo removido com sucesso!');
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    if (formData.permissions.includes(permissionId)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permissionId)
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionId]
      });
    }
  };

  const getRoleColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'green': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getRoleIcon = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-400';
      case 'yellow': return 'text-yellow-400';
      case 'green': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Cargos e Permissões</h1>
        <p className="text-slate-400">Gestão de cargos e controle de acesso ao sistema</p>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            Total: {roles.length} cargos configurados
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Novo Cargo
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(role.color)}`}>
                    <Shield size={20} className={getRoleIcon(role.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{role.name}</h3>
                    <p className="text-sm text-slate-400">{role.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  {role.userCount === 0 && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users size={14} />
                  <span>{role.userCount} utilizador(es)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Key size={14} />
                  <span>{role.permissions.length} permissão(ões)</span>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm: string) => (
                      <span key={perm} className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded">
                        +{role.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Cargo</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Gerente, Garçom, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cor</label>
                  <select
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  >
                    <option value="blue">Azul</option>
                    <option value="green">Verde</option>
                    <option value="yellow">Amarelo</option>
                    <option value="red">Vermelho</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva as responsabilidades deste cargo"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-4">Permissões</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handleTogglePermission(permission.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">{permission.name}</div>
                        <div className="text-xs text-slate-400">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRole(null);
                    setFormData({ name: '', description: '', permissions: [], color: 'blue' });
                  }}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingRole ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
