'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Download, Plus, Edit, Trash2, Save, Calendar } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  base_salary: number;
  bonus: number;
  overtime: number;
  deductions: number;
  total: number;
  month: string;
  year: string;
  status: 'pending' | 'processed' | 'paid';
  created_at: string;
}

export default function SettingsPayrollPage() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    staff_name: '',
    base_salary: 0,
    bonus: 0,
    overtime: 0,
    deductions: 0,
    month: new Date().toISOString().slice(0, 7),
    status: 'pending' as 'pending' | 'processed' | 'paid'
  });

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      console.log('🔄 [PAYROLL] Buscando registros do Supabase...');
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [PAYROLL] Erro ao buscar registros:', error);
        
        // Verificar se é erro de tabela não existente
        if (error.code === 'PGRST116' || error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.error('❌ [PAYROLL] Tabela payroll não existe!');
          setPayroll([]);
          return;
        }
        
        setPayroll([]);
      } else {
        console.log('✅ [PAYROLL] Registros buscados com sucesso:', data?.length || 0);
        setPayroll(data || []);
      }
    } catch (err) {
      console.error('❌ [PAYROLL] Erro inesperado:', err);
      setPayroll([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.base_salary + formData.bonus + formData.overtime - formData.deductions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = calculateTotal();
    
    console.log('🔄 [PAYROLL] Enviando dados para Supabase:', {
      staff_id: formData.staff_id,
      staff_name: formData.staff_name,
      base_salary: formData.base_salary,
      bonus: formData.bonus,
      overtime: formData.overtime,
      deductions: formData.deductions,
      total: total,
      month: formData.month,
      year: formData.month.split('-')[0],
      status: formData.status
    });
    
    if (editingPayroll) {
      // Update existing payroll
      const { error } = await supabase
        .from('payroll')
        .update({
          staff_id: formData.staff_id,
          staff_name: formData.staff_name,
          base_salary: formData.base_salary,
          bonus: formData.bonus,
          overtime: formData.overtime,
          deductions: formData.deductions,
          total: total,
          month: formData.month,
          status: formData.status
        })
        .eq('id', editingPayroll.id);

      if (error) {
        console.error('❌ [PAYROLL] Erro ao atualizar registro:', error);
        alert(`Erro ao atualizar registro: ${error.message}`);
        return;
      }

      console.log('✅ [PAYROLL] Registro atualizado com sucesso');
      setEditingPayroll(null);
      fetchPayroll();
    } else {
      // Create new payroll
      const { error } = await supabase
        .from('payroll')
        .insert({
          staff_id: formData.staff_id,
          staff_name: formData.staff_name,
          base_salary: formData.base_salary,
          bonus: formData.bonus,
          overtime: formData.overtime,
          deductions: formData.deductions,
          total: total,
          month: formData.month,
          year: formData.month.split('-')[0],
          status: formData.status
        });

      if (error) {
        console.error('❌ [PAYROLL] Erro ao criar registro:', error);
        
        // Verificar se é erro de tabela não existente
        if (error.code === 'PGRST116' || error.message?.includes('relation') && error.message?.includes('does not exist')) {
          alert('❌ ERRO CRÍTICO: A tabela "payroll" não existe no Supabase!\n\nExecute o SQL do arquivo "create_payroll_table.sql" no painel do Supabase para criar a tabela.');
          return;
        }
        
        // Verificar se é erro de coluna
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          alert(`❌ ERRO DE COLUNA: ${error.message}\n\nVerifique se todas as colunas existem na tabela payroll.`);
          return;
        }
        
        alert(`Erro ao criar registro: ${error.message}`);
        return;
      }

      console.log('✅ [PAYROLL] Registro criado com sucesso');
      setFormData({
        staff_id: '',
        staff_name: '',
        base_salary: 0,
        bonus: 0,
        overtime: 0,
        deductions: 0,
        month: new Date().toISOString().slice(0, 7),
        status: 'pending'
      });
      fetchPayroll();
    }
  };

  const handleEdit = (record: PayrollRecord) => {
    setEditingPayroll(record);
    setFormData({
      staff_id: record.staff_id,
      staff_name: record.staff_name,
      base_salary: record.base_salary,
      bonus: record.bonus,
      overtime: record.overtime,
      deductions: record.deductions,
      month: record.month,
      status: record.status
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchPayroll();
      }
    }
  };

  const exportToPDF = async () => {
    // Simple PDF export simulation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Folha Salarial</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f22; }
              .total { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Folha Salarial</h1>
            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Salário Base</th>
                  <th>Bônus</th>
                  <th>Hora Extra</th>
                  <th>Deduções</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${payroll.map(record => `
                  <tr>
                    <td>${record.staff_name}</td>
                    <td>${record.base_salary.toLocaleString()} AOA</td>
                    <td>${record.bonus.toLocaleString()} AOA</td>
                    <td>${record.overtime.toLocaleString()} AOA</td>
                    <td>${record.deductions.toLocaleString()} AOA</td>
                    <td class="total">${record.total.toLocaleString()} AOA</td>
                    <td>${record.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
                <DollarSign className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Folha Salarial</h1>
              </div>
            </div>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
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
                {editingPayroll ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingPayroll ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nome do Funcionário
                  </label>
                  <input
                    type="text"
                    value={formData.staff_name}
                    onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Nome do funcionário"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Salário Base (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Bônus (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Hora Extra (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.overtime}
                    onChange={(e) => setFormData({ ...formData, overtime: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Deduções (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Mês/Ano
                  </label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'processed' | 'paid' })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="processed">Processado</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-2xl font-bold text-orange-400">
                      {calculateTotal().toLocaleString()} AOA
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingPayroll ? 'Atualizar' : 'Criar'}
                  </button>
                  {editingPayroll && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPayroll(null);
                        setFormData({
                          staff_id: '',
                          staff_name: '',
                          base_salary: 0,
                          bonus: 0,
                          overtime: 0,
                          deductions: 0,
                          month: new Date().toISOString().slice(0, 7),
                          status: 'pending'
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

          {/* Payroll List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Registros de Pagamento ({payroll.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Carregando...</p>
                </div>
              ) : payroll.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhum registro encontrado.</p>
                  <p className="text-slate-500 text-sm mt-2">Crie seu primeiro registro de pagamento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-6 py-3 text-slate-400 font-medium">Funcionário</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Salário Base</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Bônus</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Total</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Mês</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Status</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.map((record) => (
                        <tr key={record.id} className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="px-6 py-4 text-white">{record.staff_name}</td>
                          <td className="px-6 py-4 text-slate-300">{record.base_salary.toLocaleString()} AOA</td>
                          <td className="px-6 py-4 text-slate-300">{record.bonus.toLocaleString()} AOA</td>
                          <td className="px-6 py-4 text-white font-semibold">{record.total.toLocaleString()} AOA</td>
                          <td className="px-6 py-4 text-slate-300">{record.month}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'paid' 
                                ? 'bg-green-500/20 text-green-400' 
                                : record.status === 'processed'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {record.status === 'paid' ? 'Pago' : record.status === 'processed' ? 'Processado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
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
