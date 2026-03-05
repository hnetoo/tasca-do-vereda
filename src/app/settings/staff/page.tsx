'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Search,
  RefreshCw
} from 'lucide-react';
import { formatKwanza } from '@/utils/currency';

interface StaffMember {
  id?: string;
  name: string;
  base_salary: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export default function SettingsStaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    base_salary: '',
    status: 'active' as 'active' | 'inactive'
  });

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 CARREGANDO STAFF...');
      const response = await fetch('/api/staff');
      const result = await response.json();
      
      console.log('📊 RESPOSTA STAFF:', result);
      
      if (result.success) {
        setStaff(result.data || []);
        console.log('✅ STAFF CARREGADO:', result.data?.length || 0, 'registros');
      } else {
        console.error('❌ ERRO AO CARREGAR STAFF:', result.error);
        alert('Erro ao carregar staff: ' + result.error);
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO CARREGAR STAFF:', error);
      alert('Erro ao carregar staff. Verifique o console para detalhes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 SUBMIT STAFF - FORM DATA:', formData);
    
    if (!formData.name || !formData.base_salary) {
      console.error('❌ VALIDAÇÃO FALHOU:', { name: formData.name, base_salary: formData.base_salary });
      alert('Nome e salário base são obrigatórios');
      return;
    }

    const submitData = {
      name: formData.name,
      base_salary: parseFloat(formData.base_salary),
      status: formData.status
    };
    
    console.log('📦 DADOS A ENVIAR:', submitData);

    try {
      const url = editingMember ? `/api/staff/${editingMember.id}` : '/api/staff';
      const method = editingMember ? 'PUT' : 'POST';
      
      console.log('🌐 FAZENDO REQUEST:', { url, method, data: submitData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      console.log('📊 RESPOSTA SUBMIT STAFF:', result);
      
      if (result.success) {
        console.log('✅ STAFF SALVO COM SUCESSO');
        await loadStaff();
        setShowModal(false);
        setEditingMember(null);
        setFormData({
          name: '',
          base_salary: '',
          status: 'active'
        });
        alert(editingMember ? 'Funcionário atualizado!' : 'Funcionário criado!');
      } else {
        console.error('❌ ERRO AO SALVAR FUNCIONÁRIO:', result.error);
        alert('Erro ao salvar funcionário: ' + result.error);
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO SALVAR FUNCIONÁRIO:', error);
      alert('Erro ao salvar funcionário. Verifique o console para detalhes.');
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      base_salary: member.base_salary.toString(),
      status: member.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) {
      return;
    }

    console.log('🗑️ DELETANDO STAFF ID:', id);

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('📊 RESPOSTA DELETE STAFF:', result);
      
      if (result.success) {
        console.log('✅ STAFF DELETADO COM SUCESSO');
        await loadStaff();
        alert('Funcionário removido!');
      } else {
        console.error('❌ ERRO AO REMOVER FUNCIONÁRIO:', result.error);
        alert('Erro ao remover funcionário: ' + result.error);
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO REMOVER FUNCIONÁRIO:', error);
      alert('Erro ao remover funcionário. Verifique o console para detalhes.');
    }
  };

  const filteredStaff = staff.filter(member =>
    member && member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Funcionários</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
                />
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Funcionário
              </button>
              
              <button
                onClick={loadStaff}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Salário Base</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Nenhum funcionário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{member.name}</div>
                              <div className="text-xs text-slate-400">
                                {member.status === 'active' ? 'Ativo' : 'Inativo'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-green-400">
                            {formatKwanza(member.base_salary)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            member.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {member.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id!)}
                              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingMember ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Salário Base (AOA) *</label>
                <input
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMember(null);
                    setFormData({
                      name: '',
                      base_salary: '',
                      status: 'active'
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-transparent border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-bold"
                >
                  {editingMember ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
