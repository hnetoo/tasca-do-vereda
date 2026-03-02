'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Users, DollarSign, Calendar, Plus, Save, Trash2, Edit2,
  Search, Filter, Download, Upload, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { formatDateInLuanda } from '@/utils/date';

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  month: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  payment_method: string;
  status: 'pending' | 'paid';
  notes: string;
}

export default function PayrollPage() {
  const { addNotification, employees } = useStore();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    month: selectedMonth,
    base_salary: '',
    overtime_hours: '0',
    overtime_pay: '0',
    bonuses: '0',
    deductions: '0',
    net_salary: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Transferência Bancária',
    notes: ''
  });

  // Load payroll records
  const loadPayrollRecords = async () => {
    try {
      const response = await fetch(`/api/payroll?month=${selectedMonth}`);
      const result = await response.json();

      if (response.ok) {
        setPayrollRecords(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar folha salarial:', error);
    }
  };

  // Load records on mount and when month changes
  React.useEffect(() => {
    loadPayrollRecords();
  }, [selectedMonth]);

  // Calculate net salary
  const calculateNetSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const overtime = parseFloat(formData.overtime_pay) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    return base + overtime + bonuses - deductions;
  };

  // Update net salary when values change
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      net_salary: calculateNetSalary().toString()
    }));
  }, [formData.base_salary, formData.overtime_pay, formData.bonuses, formData.deductions]);

  // Save payroll record
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        employee_id: formData.employee_id,
        month: formData.month,
        base_salary: parseFloat(formData.base_salary),
        overtime_hours: parseFloat(formData.overtime_hours),
        overtime_pay: parseFloat(formData.overtime_pay),
        bonuses: parseFloat(formData.bonuses),
        deductions: parseFloat(formData.deductions),
        net_salary: parseFloat(formData.net_salary),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao salvar registro');
      }

      addNotification('success', 'Registro da folha salarial salvo com sucesso!');
      
      // Reset form
      setFormData({
        employee_id: '',
        month: selectedMonth,
        base_salary: '',
        overtime_hours: '0',
        overtime_pay: '0',
        bonuses: '0',
        deductions: '0',
        net_salary: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Transferência Bancária',
        notes: ''
      });
      setShowAddForm(false);
      setEditingRecord(null);
      
      // Reload records
      loadPayrollRecords();
      
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      addNotification('error', `Falha ao salvar: ${error.message}`);
    }
  };

  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  // Filter records
  const filteredRecords = payrollRecords.filter(record => 
    record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.month.includes(searchTerm)
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Folha Salarial</h1>
        <p className="text-slate-400">Gestão de pagamentos e salários</p>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-primary outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-primary outline-none"
          />
          
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-primary text-black rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Adicionar Registro
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingRecord) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingRecord ? 'Editar Registro' : 'Adicionar Registro Folha'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Funcionário</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                    required
                  >
                    <option value="">Selecione um funcionário</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Mês</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Salário Base (AOA)</label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_salary: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Horas Extras</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.overtime_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, overtime_hours: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Pagamento Horas Extras (AOA)</label>
                  <input
                    type="number"
                    value={formData.overtime_pay}
                    onChange={(e) => setFormData(prev => ({ ...prev, overtime_pay: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Bônus (AOA)</label>
                  <input
                    type="number"
                    value={formData.bonuses}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonuses: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Deduções (AOA)</label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData(prev => ({ ...prev, deductions: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Salário Líquido (AOA)</label>
                  <input
                    type="number"
                    value={formData.net_salary}
                    readOnly
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white opacity-75"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Data de Pagamento</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Método de Pagamento</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  >
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Multicaixo">Multicaixo</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary outline-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salvar Registro
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Registros do Período</h3>
          <p className="text-slate-400 text-sm mt-1">
            {filteredRecords.length} registros encontrados
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Funcionário</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Mês</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Salário Base</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Extras</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bônus</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Deduções</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Salário Líquido</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-white">{record.employee_name}</td>
                  <td className="px-6 py-4 text-slate-300">{record.month}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {record.base_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {record.overtime_pay.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {record.bonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {record.deductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </td>
                  <td className="px-6 py-4 text-white font-bold">
                    {record.net_salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum registro encontrado</h3>
              <p className="text-slate-400">
                Adicione seu primeiro registro de folha salarial para começar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
