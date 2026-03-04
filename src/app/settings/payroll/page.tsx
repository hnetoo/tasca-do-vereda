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
  RefreshCw
} from 'lucide-react';
import { ensureTables } from '@/app/actions/ensureTables';

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  base_salary: number;
  hire_date: string;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

interface PayrollData {
  id: string;
  employee_id: string;
  base_salary: number;
  net_salary: number;
  month: string;
  overtime_hours: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  payment_date: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function SettingsPayrollPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollData | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadData = async () => {
    setLoading(true);
    try {
      // Primeiro garantir que as tabelas existam
      await ensureTables();
      
      // Carregar dados (simulados por enquanto)
      const mockEmployees: EmployeeData[] = [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@tasca.com',
          phone: '+244 123 456 789',
          position: 'Gerente',
          base_salary: 300000,
          hire_date: '2024-01-01',
          is_active: true,
          role: 'ADMIN',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockPayroll: PayrollData[] = [
        {
          id: '1',
          employee_id: '1',
          base_salary: 300000,
          net_salary: 270000,
          month: selectedMonth,
          overtime_hours: 10,
          overtime_pay: 50000,
          bonuses: 20000,
          deductions: 100000,
          payment_date: '2024-01-31',
          payment_method: 'Transferência Bancária',
          notes: 'Folha normal',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      setEmployees(mockEmployees);
      setPayrollRecords(mockPayroll);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleCreateRecord = () => {
    setEditingRecord(undefined);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditRecord = (record: PayrollData) => {
    setEditingRecord(record);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadData();
  };

  const getTotalPayroll = () => {
    return payrollRecords.reduce((sum, record) => sum + record.net_salary, 0);
  };

  const getActiveEmployees = () => {
    return employees.filter(emp => emp.is_active).length;
  };

  const getTotalBaseSalary = () => {
    return employees.reduce((sum, emp) => sum + emp.base_salary, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
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
            <button
              onClick={handleCreateRecord}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-white">{getActiveEmployees()}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Folha do Mês</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(getTotalPayroll())}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Salário Base Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(getTotalBaseSalary())}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mês Atual</p>
                <p className="text-2xl font-bold text-white">{new Date().toLocaleDateString('pt-AO', { month: 'long' })}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300">Mês de Referência:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AAAA-MM"
            />
          </div>
        </div>

        {/* Payroll Records */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Registros de Folha de Salário</h3>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-slate-700">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando dados...</p>
              </div>
            ) : payrollRecords.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum registro encontrado</p>
                <button
                  onClick={handleCreateRecord}
                  className="mt-4 text-green-400 hover:text-green-300 font-medium"
                >
                  Criar primeiro registro
                </button>
              </div>
            ) : (
              payrollRecords.map((record) => {
                const employee = employees.find(emp => emp.id === record.employee_id);
                return (
                  <div key={record.id} className="px-6 py-4 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="text-lg font-medium text-white">{employee?.name}</h4>
                          <span className="text-sm text-gray-400">{employee?.position}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Salário Base:</span>
                            <span className="font-medium text-white">{formatCurrency(record.base_salary)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Salário Líquido:</span>
                            <span className="font-medium text-green-400">{formatCurrency(record.net_salary)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Mês:</span>
                            <span className="font-medium text-white">{record.month}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Pagamento:</span>
                            <span className="font-medium text-white">{record.payment_date || 'Pendente'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded transition-colors"
                          title="Editar registro"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
