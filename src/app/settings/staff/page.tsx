'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Phone,
  Briefcase,
  Search,
  RefreshCw
} from 'lucide-react';

interface StaffMember {
  id?: string;
  nome: string;
  cargo: string;
  telefone: string;
  salario_base: number;
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
    nome: '',
    cargo: '',
    telefone: '',
    salario_base: ''
  });

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      const result = await response.json();
      
      if (result.success) {
        setStaff(result.data || []);
      } else {
        console.error('Erro ao carregar staff:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar staff:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreateMember = () => {
    setEditingMember(null);
    setFormData({
      nome: '',
      cargo: '',
      telefone: '',
      salario_base: ''
    });
    setShowModal(true);
  };

  const handleEditMember = (member: StaffMember) => {
    setEditingMember(member);
    setFormData({
      nome: member.nome,
      cargo: member.cargo,
      telefone: member.telefone,
      salario_base: member.salario_base.toString()
    });
    setShowModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipa?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        await loadStaff();
      } else {
        console.error('Erro ao remover membro:', result.error);
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const url = editingMember ? `/api/staff/${editingMember.id}` : '/api/staff';
      const method = editingMember ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          salario_base: parseFloat(formData.salario_base) || 0
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setFormData({
          nome: '',
          cargo: '',
          telefone: '',
          salario_base: ''
        });
        setEditingMember(null);
        await loadStaff();
      } else {
        console.error('Erro ao salvar membro:', result.error);
        alert('Erro ao salvar membro: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      alert('Erro ao salvar membro: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => 
    member.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.telefone.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </button>
            
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="text-blue-500" size={28} />
              Staff / Equipa
            </h1>
          </div>
          
          <button
            onClick={loadStaff}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Staff</p>
                <p className="text-2xl font-bold text-white">{staff.length}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cargos</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(staff.map(m => m.cargo)).size}
                </p>
              </div>
              <Briefcase className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Média Salarial</p>
                <p className="text-2xl font-bold text-white">
                  {staff.length > 0 
                    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(
                        staff.reduce((sum, m) => sum + m.salario_base, 0) / staff.length
                      )
                    : 'AOA 0'
                  }
                </p>
              </div>
              <span className="text-yellow-500 text-2xl">Kz</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ativos Hoje</p>
                <p className="text-2xl font-bold text-green-400">{staff.length}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={handleCreateMember}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Adicionar Membro</span>
          </button>
        </div>

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 mt-4">Carregando staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="text-gray-500 mx-auto mb-4" size={48} />
              <p className="text-gray-400 text-lg">Nenhum membro da equipa encontrado</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Tente uma busca diferente' : 'Adicione o primeiro membro da equipa'}
              </p>
            </div>
          ) : (
            filteredStaff.map((member) => (
              <div key={member.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{member.nome}</h3>
                    <p className="text-blue-400 text-sm flex items-center gap-1">
                      <Briefcase size={14} />
                      {member.cargo}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-2 bg-gray-700 text-blue-400 rounded-lg hover:bg-gray-600 transition-colors"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id!)}
                      className="p-2 bg-gray-700 text-red-400 rounded-lg hover:bg-red-600 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone size={16} />
                    <span>{member.telefone || 'Sem telefone'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Salário Base:</span>
                    <span className="text-white font-semibold">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(member.salario_base)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cargo/Função
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ex: Chefe de Cozinha"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ex: +244 123 456 789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Salário Base (AOA)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ex: 150000"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Salvando...</span>
                      </div>
                    ) : (
                      <span>{editingMember ? 'Atualizar' : 'Adicionar'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
