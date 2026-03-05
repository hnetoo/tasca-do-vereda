'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Edit, Trash2, Save, Calendar, DollarSign } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  hire_date: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export default function SettingsStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    salary: 0,
    hire_date: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_staff')
        .select('*')
        .order('hire_date', { ascending: false });

      if (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      } else {
        setStaff(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStaff) {
      // Update existing staff
      const { error } = await supabase
        .from('restaurant_staff')
        .update({
          name: formData.name,
          position: formData.position,
          department: formData.department,
          salary: formData.salary,
          hire_date: formData.hire_date,
          phone: formData.phone,
          email: formData.email,
          status: formData.status
        })
        .eq('id', editingStaff.id);

      if (!error) {
        setEditingStaff(null);
        fetchStaff();
      }
    } else {
      // Create new staff
      const { error } = await supabase
        .from('restaurant_staff')
        .insert({
          name: formData.name,
          position: formData.position,
          department: formData.department,
          salary: formData.salary,
          hire_date: formData.hire_date,
          phone: formData.phone,
          email: formData.email,
          status: formData.status
        });

      if (!error) {
        setFormData({
          name: '',
          position: '',
          department: '',
          salary: 0,
          hire_date: '',
          phone: '',
          email: '',
          status: 'active'
        });
        fetchStaff();
      }
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      position: staffMember.position,
      department: staffMember.department,
      salary: staffMember.salary,
      hire_date: staffMember.hire_date,
      phone: staffMember.phone,
      email: staffMember.email,
      status: staffMember.status
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este funcionário?')) {
      const { error } = await supabase
        .from('restaurant_staff')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchStaff();
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
                <h1 className="text-xl font-semibold">Staff do Restaurante</h1>
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
                {editingStaff ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingStaff ? 'Editar Funcionário' : 'Novo Funcionário'}
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
                    placeholder="Nome do funcionário"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Ex: Cozinheiro, Garçom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Departamento
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="salao">Salão</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="administracao">Administração</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Salário (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="+244 900 000 000"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingStaff ? 'Atualizar' : 'Criar'}
                  </button>
                  {editingStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(null);
                        setFormData({
                          name: '',
                          position: '',
                          department: '',
                          salary: 0,
                          hire_date: '',
                          phone: '',
                          email: '',
                          status: 'active'
                        });
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

          {/* Staff List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Funcionários ({staff.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Carregando...</p>
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhum funcionário encontrado.</p>
                  <p className="text-slate-500 text-sm mt-2">Adicione seu primeiro funcionário para começar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-6 py-3 text-slate-400 font-medium">Nome</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Cargo</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Departamento</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Salário</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Status</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((staffMember) => (
                        <tr key={staffMember.id} className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="px-6 py-4 text-white">{staffMember.name}</td>
                          <td className="px-6 py-4 text-slate-300">{staffMember.position}</td>
                          <td className="px-6 py-4 text-slate-300">{staffMember.department}</td>
                          <td className="px-6 py-4 text-white">{staffMember.salary.toLocaleString()} AOA</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staffMember.status === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {staffMember.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(staffMember)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(staffMember.id)}
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
