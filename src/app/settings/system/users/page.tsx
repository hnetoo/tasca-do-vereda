'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Plus, Trash2, Edit, Shield, Mail, Phone, Calendar, Key, Eye, EyeOff } from 'lucide-react';

export default function SettingsUsersPage() {
  const { addNotification } = useStore();
  
  // Carregar dados do Zustand store ao montar
  const [users, setUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Carregando users do Zustand store...');
      const savedData = localStorage.getItem('tasca-vereda-storage-v2');
      console.log('🔍 DEBUG: savedData =', savedData ? 'exists' : 'null');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('🔍 DEBUG: Zustand data parsed:', parsed);
          // Verificar se há dados de users no store
          if (parsed.state && parsed.state.users) {
            console.log('🔍 DEBUG: Users encontrados no Zustand:', parsed.state.users);
            return parsed.state.users;
          }
        } catch (error) {
          console.error('🔍 DEBUG: Erro ao parsear Zustand data:', error);
        }
      }
    }
    
    console.log('🔍 DEBUG: Usando dados padrão para users');
    // Dados padrão se não houver nada salvo
    return [
      {
        id: '1',
        name: 'Administrador',
        email: 'admin@restaurante.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-15T10:30:00',
        permissions: ['all'],
        createdAt: '2023-01-01'
      },
      {
        id: '2',
        name: 'João Silva',
        email: 'joao@restaurante.com',
        role: 'manager',
        status: 'active',
        lastLogin: '2024-01-15T09:15:00',
        permissions: ['orders', 'menu', 'reports'],
        createdAt: '2023-03-15'
      }
    ];
  });

  // Salvar dados no Zustand store quando users mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Salvando users no Zustand store:', users);
      // Atualizar o Zustand store
      const currentData = localStorage.getItem('tasca-vereda-storage-v2');
      if (currentData) {
        try {
          const parsed = JSON.parse(currentData);
          parsed.state.users = users;
          localStorage.setItem('tasca-vereda-storage-v2', JSON.stringify(parsed));
          console.log('🔍 DEBUG: Users salvos no Zustand com sucesso');
        } catch (error) {
          console.error('🔍 DEBUG: Erro ao salvar users no Zustand:', error);
        }
      }
    }
  }, [users]);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter',
    status: 'active',
    permissions: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map((user: any) => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      ));
      addNotification('success', 'Utilizador atualizado com sucesso!');
    } else {
      const newUser = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Nunca'
      };
      setUsers([...users, newUser]);
      addNotification('success', 'Utilizador adicionado com sucesso!');
    }
    
    setFormData({ name: '', email: '', password: '', role: 'waiter', status: 'active', permissions: [] });
    setShowModal(false);
    setEditingUser(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      permissions: user.permissions || []
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este utilizador?')) {
      setUsers(users.filter((user: any) => user.id !== id));
      addNotification('success', 'Utilizador removido com sucesso!');
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map((user: any) => 
      user.id === id 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    addNotification('success', 'Status atualizado com sucesso!');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="text-red-400" size={20} />;
      case 'manager': return <Shield className="text-yellow-400" size={20} />;
      default: return <Shield className="text-blue-400" size={20} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'manager': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Utilizadores</h1>
        <p className="text-slate-400">Gestão de utilizadores e permissões do sistema</p>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Total: {users.length} utilizadores
            </div>
            <div className="text-emerald-400">
              Ativos: {users.filter((u: any) => u.status === 'active').length}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Novo Utilizador
          </button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <div key={user.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user.name}</h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.status)}`}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                    {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gerente' : 'Utilizador'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={14} />
                  <span>Criado: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Key size={14} />
                    <span>Último acesso: {new Date(user.lastLogin).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className="flex-1 p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    {user.status === 'active' ? <EyeOff size={16} className="mx-auto" /> : <Eye size={16} className="mx-auto" />}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="flex-1 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do utilizador"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Deixe em branco para manter atual' : 'Digite a senha'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Cargo</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="waiter">Garçom</option>
                  <option value="cashier">Caixa</option>
                  <option value="kitchen">Cozinha</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'waiter', status: 'active', permissions: [] });
                  }}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingUser ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
