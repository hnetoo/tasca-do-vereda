'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Plus, Trash2, Edit, Shield, Mail, Phone, Calendar, Key, Eye, EyeOff } from 'lucide-react';
import { supabaseAuthService } from '@/services/supabaseAuth.service';
import { User, UserRole } from '@/types/auth.types';

export default function SettingsUsersPage() {
  const { addNotification } = useStore();
  
  // Estados do formulário
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pin: '',
    role: UserRole.Caixa,
    status: 'active',
    permissions: [] as any[]
  });
  
  // Estado para usuários do sistema (não funcionários)
  const [users, setUsers] = useState<User[]>([]);
  
  // Carregar usuários do Supabase
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await supabaseAuthService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      addNotification('error', 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pin || formData.pin.length < 4) {
      addNotification('error', 'PIN deve ter pelo menos 4 dígitos');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingUser) {
        // Atualizar usuário
        await supabaseAuthService.updateUser(editingUser.id, {
          ...formData,
          metadata: formData.permissions
        });
        addNotification('success', 'Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        await supabaseAuthService.createUser({
          name: formData.name,
          email: formData.email,
          pin: formData.pin,
          role: formData.role,
          permissions: formData.permissions
        });
        addNotification('success', 'Usuário criado com sucesso!');
      }
      
      // Recarregar lista
      await loadUsers();
      
      // Resetar formulário
      setFormData({ name: '', email: '', pin: '', role: UserRole.Caixa, status: 'active', permissions: [] });
      setShowModal(false);
      setEditingUser(null);
      
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      addNotification('error', error.message || 'Falha ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      pin: user.pin,
      role: user.role,
      status: 'active',
      permissions: (user.metadata && Array.isArray(user.metadata)) ? user.metadata : []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        setLoading(true);
        await supabaseAuthService.deleteUser(id);
        addNotification('success', 'Usuário removido com sucesso!');
        await loadUsers();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        addNotification('error', 'Falha ao remover usuário');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin: return <Shield className="text-red-400" size={20} />;
      case UserRole.Owner: return <Shield className="text-purple-400" size={20} />;
      case UserRole.Caixa: return <Shield className="text-blue-400" size={20} />;
      case UserRole.Cozinha: return <Shield className="text-orange-400" size={20} />;
      case UserRole.Garcom: return <Shield className="text-green-400" size={20} />;
      default: return <Shield className="text-gray-400" size={20} />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case UserRole.Owner: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case UserRole.Caixa: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case UserRole.Cozinha: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case UserRole.Garcom: return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin: return 'Administrador';
      case UserRole.Owner: return 'Proprietário';
      case UserRole.Caixa: return 'Caixa';
      case UserRole.Cozinha: return 'Cozinha';
      case UserRole.Garcom: return 'Garçom';
      case UserRole.Cliente: return 'Cliente';
      default: return role;
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Usuários do Sistema</h1>
        <p className="text-slate-400">Gestão de usuários com acesso ao sistema</p>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Total: {users.length} usuários
            </div>
            <div className="text-emerald-400">
              Ativos: {users.length}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{user.name}</h3>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <Key size={14} />
                  <span>PIN: {user.pin}</span>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    disabled={loading}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
            <p className="text-slate-400">Crie seu primeiro usuário para começar</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Nome</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-slate-800 border-slate-600 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-slate-800 border-slate-600 text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-2">PIN</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-slate-800 border-slate-600 text-white"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="Mínimo 4 dígitos"
                      required
                      minLength={4}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white mb-2">Função</label>
                  <select
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-slate-800 border-slate-600 text-white"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    required
                    disabled={loading}
                  >
                    <option value={UserRole.Caixa}>Caixa</option>
                    <option value={UserRole.Cozinha}>Cozinha</option>
                    <option value={UserRole.Garcom}>Garçom</option>
                    <option value={UserRole.Admin}>Administrador</option>
                    <option value={UserRole.Owner}>Proprietário</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', pin: '', role: UserRole.Caixa, status: 'active', permissions: [] });
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-slate-950 rounded-lg hover:bg-white flex items-center justify-center transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                  ) : (
                    editingUser ? 'Atualizar' : 'Criar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
