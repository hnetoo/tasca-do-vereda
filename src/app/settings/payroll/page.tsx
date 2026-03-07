'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, DollarSign, Plus, Edit, Trash2, Save, Download, Calendar, Users, FileText, Calculator } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    status: 'pending'
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

      // Fetch payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (payrollError) throw payrollError;

      setStaff(staffData || []);
      setPayrollRecords(payrollData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedStaff = staff.find(s => s.id === formData.staff_id);
      const overtimePay = formData.overtime_hours * formData.overtime_rate;
      const grossSalary = formData.base_salary + overtimePay + formData.bonuses;
      const netSalary = grossSalary - formData.deductions;

      // Usar 'funcionario' em vez de 'staff_name' para evitar erro de constraint
      const recordData: any = {
        ...formData,
        funcionario: selectedStaff?.name || '',
        overtime_pay: overtimePay,
        net_salary: netSalary,
        created_at: new Date().toISOString()
      };

      // Remover campos que não existem na tabela para evitar erro
      delete recordData.staff_name;
      delete recordData.status_pagamento;
      delete recordData.mes_referencia;
      delete recordData.salario_base;
      delete recordData.subsidios;
      delete recordData.descontos;
      delete recordData.net_total;

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

  const calculateNetSalary = () => {
    const overtimePay = formData.overtime_hours * formData.overtime_rate;
    const grossSalary = formData.base_salary + overtimePay + formData.bonuses;
    const netSalary = grossSalary - formData.deductions;
    return netSalary;
  };

  const generatePDF = (record: PayrollRecord) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Folha Salarial
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {new Date().toLocaleDateString('pt-AO')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                {editingRecord ? <Edit className="w-5 h-5 text-orange-500" /> : <Plus className="w-5 h-5 text-orange-500" />}
                {editingRecord ? 'Editar Registro' : 'Novo Registro'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Staff Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Funcionário
                  </label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => handleStaffChange(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione um funcionário</option>
                    {staff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.name} - {staffMember.position}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month and Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mês
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Ano
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Salário Base (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Overtime */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Horas Extra
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Taxa Hora Extra (AOA)
                    </label>
                    <input
                      type="number"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Deductions and Bonuses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Deduções (AOA)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bônus (AOA)
                    </label>
                    <input
                      type="number"
                      value={formData.bonuses}
                      onChange={(e) => setFormData({ ...formData, bonuses: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="processed">Processado</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>

                {/* Net Salary Display */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Salário Líquido:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {calculateNetSalary().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingRecord ? 'Atualizar' : 'Salvar'}
                  </button>
                  {editingRecord && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Records List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Registros de Folha
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-t-2 border-l-2 border-orange-500"></div>
                  <p className="mt-4 text-slate-400">Carregando registros...</p>
                </div>
              ) : payrollRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhum registro de folha encontrado</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Crie seu primeiro registro de folha salarial usando o formulário ao lado.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {record.staff_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'paid'
                                ? 'bg-green-900 text-green-300'
                                : record.status === 'processed'
                                ? 'bg-blue-900 text-blue-300'
                                : 'bg-yellow-900 text-yellow-300'
                            }`}>
                              {record.status === 'paid' ? 'Pago' : record.status === 'processed' ? 'Processado' : 'Pendente'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Período:</span>
                              <p className="text-white font-medium">{record.month}/{record.year}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Salário Base:</span>
                              <p className="text-white font-medium">
                                {record.base_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Salário Líquido:</span>
                              <p className="text-green-400 font-semibold">
                                {record.net_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                              </p>
                            </div>
                            {record.overtime_hours > 0 && (
                              <div>
                                <span className="text-slate-400">Horas Extra:</span>
                                <p className="text-orange-400 font-medium">
                                  {record.overtime_hours}h × {record.overtime_rate.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                              </div>
                            )}
                            {record.bonuses > 0 && (
                              <div>
                                <span className="text-slate-400">Bônus:</span>
                                <p className="text-blue-400 font-medium">
                                  {record.bonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                              </div>
                            )}
                            {record.deductions > 0 && (
                              <div>
                                <span className="text-slate-400">Deduções:</span>
                                <p className="text-red-400 font-medium">
                                  -{record.deductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                              </div>
                            )}
                            {record.payment_date && (
                              <div>
                                <span className="text-slate-400">Data Pagamento:</span>
                                <p className="text-green-400 font-medium">
                                  {new Date(record.payment_date).toLocaleDateString('pt-AO')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generatePDF(record)}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            title="Baixar Recibo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {record.status !== 'paid' && (
                            <button
                              onClick={() => handleProcessPayment(record.id)}
                              className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                              title="Marcar como Pago"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="Excluir"
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
