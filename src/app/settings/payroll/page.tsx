'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Plus, Edit, Trash2, Save, Download, Calendar, Users, FileText, Calculator } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  month: string;
  year: number;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  status: 'pending' | 'processed' | 'paid';
  payment_date?: string;
  created_at: string;
}

export default function SettingsPayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    base_salary: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    deductions: 0,
    bonuses: 0,
    status: 'pending' as 'pending' | 'processed' | 'paid'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, position, base_salary')
        .eq('status', 'active');

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (payrollError) throw payrollError;
      setPayrollRecords(payrollData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const overtimePay = formData.overtime_hours * formData.overtime_rate;
    const grossSalary = formData.base_salary + overtimePay + formData.bonuses;
    const netSalary = grossSalary - formData.deductions;
    return netSalary;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedStaff = staff.find(s => s.id === formData.staff_id);
      const overtimePay = formData.overtime_hours * formData.overtime_rate;
      const grossSalary = formData.base_salary + overtimePay + formData.bonuses;
      const netSalary = grossSalary - formData.deductions;

      const recordData = {
        ...formData,
        staff_name: selectedStaff?.name || '',
        overtime_pay: overtimePay,
        net_salary: netSalary,
        created_at: new Date().toISOString()
      };

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('payroll')
          .update({
            ...recordData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('payroll')
          .insert(recordData);

        if (error) throw error;
      }

      // Reset form and refresh data
      setFormData({
        staff_id: '',
        month: new Date().toISOString().slice(0, 7),
        year: new Date().getFullYear(),
        base_salary: 0,
        overtime_hours: 0,
        overtime_rate: 0,
        deductions: 0,
        bonuses: 0,
        status: 'pending'
      });
      setEditingRecord(null);
      fetchData();
    } catch (err) {
      console.error('Error saving payroll record:', err);
    }
  };

  const handleEdit = (record: PayrollRecord) => {
    setEditingRecord(record);
    setFormData({
      staff_id: record.staff_id,
      month: record.month,
      year: record.year,
      base_salary: record.base_salary,
      overtime_hours: record.overtime_hours,
      overtime_rate: record.overtime_rate,
      deductions: record.deductions,
      bonuses: record.bonuses,
      status: record.status
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este registro de folha?')) return;
    
    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting payroll record:', err);
    }
  };

  const handleProcessPayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error processing payment:', err);
    }
  };

  const generatePDF = async (record: PayrollRecord) => {
    // Simple PDF generation (in real app, use a library like jsPDF)
    const pdfContent = `
RECIBO DE PAGAMENTO - FOLHA SALARIAL
=====================================
Funcionário: ${record.staff_name}
Mês/Ano: ${record.month}/${record.year}
Data de Pagamento: ${record.payment_date ? new Date(record.payment_date).toLocaleDateString('pt-AO') : 'Pendente'}

DETALHES DO PAGAMENTO:
---------------------
Salário Base: ${record.base_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
Horas Extra: ${record.overtime_hours}h
Taxa Hora Extra: ${record.overtime_rate.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
Pagamento Extra: ${record.overtime_pay.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
Bônus: ${record.bonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
Deduções: ${record.deductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
SALÁRIO LÍQUIDO: ${record.net_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}

Status: ${record.status === 'paid' ? 'PAGO' : record.status === 'processed' ? 'PROCESSADO' : 'PENDENTE'}

---
Gerado em: ${new Date().toLocaleString('pt-AO')}
Sistema: Tasca do Vereda v2.0
    `;

    // Create and download file
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folha_${record.staff_name}_${record.month}_${record.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setFormData({
      staff_id: '',
      month: new Date().toISOString().slice(0, 7),
      year: new Date().getFullYear(),
      base_salary: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      deductions: 0,
      bonuses: 0,
      status: 'pending'
    });
  };

  const handleStaffChange = (staffId: string) => {
    const selectedStaff = staff.find(s => s.id === staffId);
    setFormData({
      ...formData,
      staff_id: staffId,
      base_salary: selectedStaff?.base_salary || 0
    });
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingRecord ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingRecord ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Funcionário
                  </label>
                  <select
                    required
                    value={formData.staff_id}
                    onChange={(e) => handleStaffChange(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Selecione um funcionário</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Mês
                    </label>
                    <input
                      type="month"
                      required
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: e.target.value})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Ano
                    </label>
                    <input
                      type="number"
                      required
                      min="2020"
                      max="2030"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Salário Base (AOA)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({...formData, base_salary: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Horas Extra
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({...formData, overtime_hours: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Taxa Hora Extra
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({...formData, overtime_rate: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Bônus (AOA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bonuses}
                      onChange={(e) => setFormData({...formData, bonuses: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Deduções (AOA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({...formData, deductions: parseFloat(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'pending' | 'processed' | 'paid'})}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="processed">Processado</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>

                {/* Salary Calculation Preview */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Pré-visualização</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Salário Base:</span>
                      <span>{formData.base_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Extra:</span>
                      <span>{(formData.overtime_hours * formData.overtime_rate).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bônus:</span>
                      <span>{formData.bonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Deduções:</span>
                      <span>-{formData.deductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                    <div className="border-t border-slate-600 pt-1 mt-2">
                      <div className="flex justify-between font-bold text-green-400">
                        <span>Salário Líquido:</span>
                        <span>{calculateNetSalary().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {editingRecord && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingRecord ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Payroll Records */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Registros de Folha</h2>
                <button
                  onClick={() => {
                    const recordsText = payrollRecords.map(record => 
                      `${record.staff_name} - ${record.month}/${record.year} - ${record.net_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} - ${record.status}`
                    ).join('\n');
                    
                    const blob = new Blob([`RELATÓRIO DE FOLHA SALARIAL\n============================\n\n${recordsText}\n\nGerado em: ${new Date().toLocaleString('pt-AO')}`], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio_folha_${new Date().toISOString().split('T')[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Tudo
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : payrollRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhum registro de folha encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRecords.map((record) => (
                    <div key={record.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{record.staff_name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'paid' 
                                ? 'bg-green-500/20 text-green-400' 
                                : record.status === 'processed'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {record.status === 'paid' ? 'Pago' : record.status === 'processed' ? 'Processado' : 'Pendente'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="w-4 h-4" />
                              {record.month}/{record.year}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <DollarSign className="w-4 h-4" />
                              Base: {record.base_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calculator className="w-4 h-4" />
                              Extra: {record.overtime_pay.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </div>
                            <div className="flex items-center gap-2 text-green-400 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              Líquido: {record.net_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </div>
                          </div>

                          {record.payment_date && (
                            <div className="text-sm text-slate-400 mb-2">
                              Data de Pagamento: {new Date(record.payment_date).toLocaleDateString('pt-AO')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => generatePDF(record)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Download Recibo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {record.status !== 'paid' && (
                            <button
                              onClick={() => handleProcessPayment(record.id)}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                              title="Marcar como Pago"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
