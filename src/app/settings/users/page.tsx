'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Users, Shield, Plus, Edit, Trash2, Save } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'caixa';
  pin: string;
  created_at: string;
}

export default function SettingsUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'caixa' as 'admin' | 'caixa',
    pin: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          pin: formData.pin
        })
        .eq('id', editingUser.id);

      if (!error) {
        setEditingUser(null);
        fetchUsers();
      }
    } else {
      // Create new user
      const { error } = await supabase
        .from('users')
        .insert({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          pin: formData.pin
        });

      if (!error) {
        setFormData({ name: '', email: '', role: 'caixa', pin: '' });
        fetchUsers();
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchUsers();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Gestão de Acesso</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingUser ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Nome do usuário"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'caixa' })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="caixa">Caixa</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    PIN de Acesso
                  </label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="4 dígitos"
                    maxLength={4}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </button>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', role: 'caixa', pin: '' });
                      }}
                      className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Usuários Cadastrados ({users.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Carregando...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhum usuário encontrado.</p>
                  <p className="text-slate-500 text-sm mt-2">Crie seu primeiro usuário para começar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-6 py-3 text-slate-400 font-medium">Nome</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Email</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Função</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">PIN</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="px-6 py-4 text-white">{user.name}</td>
                          <td className="px-6 py-4 text-slate-300">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' : 'Caixa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">****</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
