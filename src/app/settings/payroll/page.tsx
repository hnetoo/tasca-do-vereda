'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  Calendar,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  getPayrollRecords, 
  createPayrollRecord, 
  updatePayrollRecord, 
  deletePayrollRecord,
  PayrollRecord 
} from '@/app/actions/payrollActions';
import { createPayrollTable } from '@/app/actions/createPayrollTable';

export default function SettingsPayrollPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [tableStatus, setTableStatus] = useState<'checking' | 'exists' | 'error'>('checking');
  const [formData, setFormData] = useState({
    funcionario_name: '',
    valor_base: '',
    subsidios: '',
    descontos: '',
    mes_referencia: new Date().toISOString().slice(0, 7),
    status_pagamento: 'pendente' as 'pendente' | 'pago' | 'cancelado'
  });

  useEffect(() => {
    initializePayroll();
  }, []);

  const initializePayroll = async () => {
    try {
      setLoading(true);
      setTableStatus('checking');
      
      // Verificar/criar tabela
      const tableResult = await createPayrollTable();
      
      if (tableResult.success) {
        setTableStatus('exists');
        // Carregar registros
        await loadRecords();
      } else {
        setTableStatus('error');
        console.error('Erro na tabela:', tableResult.error);
      }
    } catch (error) {
      console.error('Erro ao inicializar payroll:', error);
      setTableStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const result = await getPayrollRecords();
      
      if (result.success) {
        setRecords(result.data);
      } else {
        console.error('Erro ao carregar registros:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setFormData({
      funcionario_name: '',
      valor_base: '',
      subsidios: '',
      descontos: '',
      mes_referencia: new Date().toISOString().slice(0, 7),
      status_pagamento: 'pendente'
    });
    setShowModal(true);
  };

  const handleEditRecord = (record: PayrollRecord) => {
    setEditingRecord(record);
    setFormData({
      funcionario_name: record.funcionario_name,
      valor_base: record.valor_base.toString(),
      subsidios: record.subsidios.toString(),
      descontos: record.descontos.toString(),
      mes_referencia: record.mes_referencia,
      status_pagamento: record.status_pagamento
    });
    setShowModal(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este registro?')) {
      return;
    }
    
    try {
      const result = await deletePayrollRecord(id);
      
      if (result.success) {
        await loadRecords();
      } else {
        alert('Erro ao remover registro: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      alert('Erro ao remover registro');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const recordData = {
        funcionario_name: formData.funcionario_name,
        valor_base: parseFloat(formData.valor_base) || 0,
        subsidios: parseFloat(formData.subsidios) || 0,
        descontos: parseFloat(formData.descontos) || 0,
        mes_referencia: formData.mes_referencia,
        status_pagamento: formData.status_pagamento as 'pendente' | 'pago' | 'cancelado'
      };

      let result;
      if (editingRecord && editingRecord.id) {
        result = await updatePayrollRecord(editingRecord.id, recordData);
      } else {
        result = await createPayrollRecord(recordData);
      }

      if (result.success) {
        setShowModal(false);
        await loadRecords();
      } else {
        alert('Erro ao salvar registro: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      alert('Erro ao salvar registro');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTotalPayroll = () => {
    return records.reduce((sum, record) => sum + (record.total_liquido || 0), 0);
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Folha Salarial</h1>
                <p className="text-sm text-gray-400">Gestão de salários e pagamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {tableStatus === 'exists' && (
                <button
                  onClick={handleCreateRecord}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Registro
                </button>
              )}
              <button
                onClick={loadRecords}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status da Tabela */}
        {tableStatus === 'checking' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-yellow-400">Verificando tabela de folha salarial...</span>
            </div>
          </div>
        )}

        {tableStatus === 'error' && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <span className="text-red-400 font-medium">Erro na tabela de folha salarial</span>
                <p className="text-red-300 text-sm mt-1">
                  Por favor, crie a tabela manualmente no Supabase Dashboard
                </p>
              </div>
            </div>
          </div>
        )}

        {tableStatus === 'exists' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total de Registros</p>
                    <p className="text-2xl font-bold text-white">{records.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Folha do Mês</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(getTotalPayroll())}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pagos</p>
                    <p className="text-2xl font-bold text-green-400">
                      {records.filter(r => r.status_pagamento === 'pago').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {records.filter(r => r.status_pagamento === 'pendente').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Records Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-medium text-white">Registros de Folha de Salário</h3>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando dados...</p>
                  </div>
                ) : records.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum registro encontrado</p>
                    <button
                      onClick={handleCreateRecord}
                      className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Criar primeiro registro
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Funcionário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Base
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Subsídios
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Descontos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Total Líquido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Mês
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {record.funcionario_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatCurrency(record.valor_base)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatCurrency(record.subsidios)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatCurrency(record.descontos)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                            {formatCurrency(record.total_liquido || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {record.mes_referencia}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status_pagamento)}
                              <span className="text-gray-300 capitalize">{record.status_pagamento}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded transition-colors"
                                title="Editar registro"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteRecord(record.id!)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                                title="Remover registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingRecord ? 'Editar Registro' : 'Novo Registro'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Funcionário</label>
                  <input
                    type="text"
                    required
                    value={formData.funcionario_name}
                    onChange={(e) => setFormData({...formData, funcionario_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mês de Referência</label>
                  <input
                    type="month"
                    required
                    value={formData.mes_referencia}
                    onChange={(e) => setFormData({...formData, mes_referencia: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Salário Base (AOA)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.valor_base}
                    onChange={(e) => setFormData({...formData, valor_base: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Subsídios (AOA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subsidios}
                    onChange={(e) => setFormData({...formData, subsidios: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Descontos (AOA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.descontos}
                    onChange={(e) => setFormData({...formData, descontos: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status de Pagamento</label>
                  <select
                    value={formData.status_pagamento}
                    onChange={(e) => setFormData({...formData, status_pagamento: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              
              {/* Preview do cálculo */}
              {(formData.valor_base || formData.subsidios || formData.descontos) && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Prévia do Cálculo</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Salário Base:</span>
                      <span className="text-white">{formatCurrency(parseFloat(formData.valor_base) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subsídios:</span>
                      <span className="text-green-400">+{formatCurrency(parseFloat(formData.subsidios) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Descontos:</span>
                      <span className="text-red-400">-{formatCurrency(parseFloat(formData.descontos) || 0)}</span>
                    </div>
                    <div className="border-t border-slate-600 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-medium">Total Líquido:</span>
                        <span className="text-green-400 font-bold">
                          {formatCurrency(
                            (parseFloat(formData.valor_base) || 0) + 
                            (parseFloat(formData.subsidios) || 0) - 
                            (parseFloat(formData.descontos) || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingRecord ? 'Atualizar' : 'Criar'} Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
