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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Financeiro e RH</h1>
                  <p className="text-sm text-gray-500">Gestão de Folha de Salário</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateRecord}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{getActiveEmployees()}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Folha do Mês</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPayroll())}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Salário Base Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalBaseSalary())}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mês Atual</p>
                <p className="text-2xl font-bold text-gray-900">{new Date().toLocaleDateString('pt-AO', { month: 'long' })}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Mês de Referência:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="AAAA-MM"
            />
          </div>
        </div>

        {/* Payroll Records */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Registros de Folha de Salário</h3>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando dados...</p>
              </div>
            ) : payrollRecords.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum registro encontrado</p>
                <button
                  onClick={handleCreateRecord}
                  className="mt-4 text-green-600 hover:text-green-700 font-medium"
                >
                  Criar primeiro registro
                </button>
              </div>
            ) : (
              payrollRecords.map((record) => {
                const employee = employees.find(emp => emp.id === record.employee_id);
                return (
                  <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{employee?.name}</h4>
                          <span className="text-sm text-gray-500">{employee?.position}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Salário Base:</span>
                            <span className="font-medium">{formatCurrency(record.base_salary)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Salário Líquido:</span>
                            <span className="font-medium text-green-600">{formatCurrency(record.net_salary)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Mês:</span>
                            <span className="font-medium">{record.month}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Pagamento:</span>
                            <span className="font-medium">{record.payment_date || 'Pendente'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          title="Editar registro"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
