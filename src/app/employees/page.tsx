'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, 
  Shield, Key, Clock, DollarSign, Edit2, Trash2, Calendar,
  Phone, Mail, MapPin, CreditCard, TrendingUp, FileText,
  Plus, Download, Upload, Eye, EyeOff, CheckCircle, AlertCircle
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  bankAccount: string;
  nif: string;
  role: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
}

export default function EmployeesPage() {
  const { addNotification } = useStore();
  
  // Estado local com persistência localStorage
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasca_employees_local');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Erro ao carregar employees:', e);
        }
      }
    }
    
    // Dados padrão
    return [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@restaurante.com',
        phone: '+244 923 456 789',
        address: 'Luanda, Rua Principal 123',
        position: 'Chef de Cozinha',
        department: 'Cozinha',
        salary: 250000,
        hireDate: '2023-01-15',
        status: 'active',
        bankAccount: '0055.0000.1234.5678',
        nif: '123456789',
        role: 'chef'
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@restaurante.com',
        phone: '+244 912 345 678',
        address: 'Luanda, Avenida Comercial 456',
        position: 'Garçom',
        department: 'Salão',
        salary: 180000,
        hireDate: '2023-03-20',
        status: 'active',
        bankAccount: '0055.0000.8765.4321',
        nif: '987654321',
        role: 'waiter'
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@restaurante.com',
        phone: '+244 934 567 890',
        address: 'Luanda, Rua do Comércio 789',
        position: 'Caixa',
        department: 'Administração',
        salary: 200000,
        hireDate: '2023-02-10',
        status: 'on_leave',
        bankAccount: '0055.0000.2468.1357',
        nif: '456789123',
        role: 'cashier'
      }
    ];
  });
  
  // Salvar employees no localStorage quando mudar
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasca_employees_local', JSON.stringify(employees));
      console.log('🔍 DEBUG: Employees salvos no localStorage:', employees.length);
    }
  }, [employees]);

  // Estado local com persistência localStorage
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasca_payroll_local');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Erro ao carregar payroll:', e);
        }
      }
    }
    
    // Dados padrão
    return [
      {
        id: '1',
        employeeId: '1',
        month: 'Janeiro',
        year: 2024,
        baseSalary: 250000,
        overtime: 50000,
        bonuses: 30000,
        deductions: 15000,
        netSalary: 315000,
        status: 'processed',
        paymentDate: '2024-01-31'
      },
      {
        id: '2',
        employeeId: '2',
        month: 'Janeiro',
        year: 2024,
        baseSalary: 180000,
        overtime: 20000,
        bonuses: 15000,
        deductions: 10000,
        netSalary: 205000,
        status: 'paid',
        paymentDate: '2024-01-30'
      }
    ];
  });
  
  // Salvar payroll no localStorage quando mudar
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasca_payroll_local', JSON.stringify(payrollRecords));
      console.log('🔍 DEBUG: Payroll salvos no localStorage:', payrollRecords.length);
    }
  }, [payrollRecords]);

  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [showSalaryDetails, setShowSalaryDetails] = useState<{ [key: string]: boolean }>({});

  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    salary: 0,
    hireDate: '',
    status: 'active',
    bankAccount: '',
    nif: '',
    role: ''
  });

  const [payrollForm, setPayrollForm] = useState<Partial<PayrollRecord>>({
    employeeId: '',
    month: '',
    year: new Date().getFullYear(),
    baseSalary: 0,
    overtime: 0,
    bonuses: 0,
    deductions: 0,
    netSalary: 0,
    status: 'pending'
  });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      ...employeeForm,
      id: Date.now().toString(),
      hireDate: employeeForm.hireDate || new Date().toISOString().split('T')[0],
      status: employeeForm.status || 'active'
    } as Employee;

    setEmployees([...employees, newEmployee]);
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      salary: 0,
      hireDate: '',
      status: 'active',
      bankAccount: '',
      nif: '',
      role: ''
    });
    setShowEmployeeModal(false);
    addNotification('success', 'Funcionário adicionado com sucesso!');
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm(employee);
    setShowEmployeeModal(true);
  };

  const handleUpdateEmployee = () => {
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee?.id ? { ...employeeForm, id: emp.id } as Employee : emp
    ));
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      salary: 0,
      hireDate: '',
      status: 'active',
      bankAccount: '',
      nif: '',
      role: ''
    });
    addNotification('success', 'Funcionário atualizado com sucesso!');
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Tem certeza que deseja remover este funcionário?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
      addNotification('success', 'Funcionário removido com sucesso!');
    }
  };

  const handleAddPayroll = () => {
    const employee = employees.find(emp => emp.id === payrollForm.employeeId);
    const netSalary = (payrollForm.baseSalary || 0) + (payrollForm.overtime || 0) + (payrollForm.bonuses || 0) - (payrollForm.deductions || 0);
    
    const newPayroll: PayrollRecord = {
      ...payrollForm,
      id: Date.now().toString(),
      netSalary,
      status: 'pending'
    } as PayrollRecord;

    setPayrollRecords([...payrollRecords, newPayroll]);
    setPayrollForm({
      employeeId: '',
      month: '',
      year: new Date().getFullYear(),
      baseSalary: 0,
      overtime: 0,
      bonuses: 0,
      deductions: 0,
      netSalary: 0,
      status: 'pending'
    });
    setShowPayrollModal(false);
    addNotification('success', 'Folha de pagamento criada com sucesso!');
  };

  const handleProcessPayroll = (id: string) => {
    setPayrollRecords(payrollRecords.map(record => 
      record.id === id 
        ? { ...record, status: 'processed' as const, paymentDate: new Date().toISOString().split('T')[0] }
        : record
    ));
    addNotification('success', 'Folha de pagamento processada com sucesso!');
  };

  const handlePayPayroll = (id: string) => {
    setPayrollRecords(payrollRecords.map(record => 
      record.id === id 
        ? { ...record, status: 'paid' as const, paymentDate: new Date().toISOString().split('T')[0] }
        : record
    ));
    addNotification('success', 'Pagamento efetuado com sucesso!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'inactive':
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'on_leave':
      case 'processed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'on_leave': return 'De Férias';
      case 'pending': return 'Pendente';
      case 'processed': return 'Processado';
      case 'paid': return 'Pago';
      default: return status;
    }
  };

  const getDepartmentStats = () => {
    const stats = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(stats).map(([dept, count]) => ({ department: dept, count }));
  };

  const getTotalPayroll = () => {
    return payrollRecords.reduce((total, record) => total + record.netSalary, 0);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Pessoal</h1>
        <p className="text-slate-400">Mini RH - Gestão completa de funcionários e folha de salário</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Users size={20} />
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-1 h-3 rounded-full ${i < employees.length ? 'bg-primary' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total de Funcionários</p>
          <p className="text-2xl font-black text-white">{employees.length}</p>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-1 h-3 rounded-full ${i < employees.filter(e => e.status === 'active').length ? 'bg-emerald-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Funcionários Ativos</p>
          <p className="text-2xl font-black text-white">{employees.filter(e => e.status === 'active').length}</p>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
              <Clock size={20} />
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-1 h-3 rounded-full ${i < employees.filter(e => e.status === 'on_leave').length ? 'bg-yellow-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">De Férias</p>
          <p className="text-2xl font-black text-white">{employees.filter(e => e.status === 'on_leave').length}</p>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div className="text-xs font-black text-purple-400 uppercase tracking-widest">AOA</div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Folha Pagamento</p>
          <p className="text-2xl font-black text-white">
            {getTotalPayroll().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
          </p>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <TrendingUp size={20} className="text-primary" />
          Distribuição por Departamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getDepartmentStats().map((stat, index) => (
            <div key={index} className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-2">{stat.department}</p>
              <p className="text-2xl font-bold text-white">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'employees'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={18} />
          Funcionários
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'payroll'
              ? 'bg-primary text-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign size={18} />
          Folha de Pagamento
        </button>
      </div>

      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar funcionário..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-primary text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowEmployeeModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={20} />
              Novo Funcionário
            </button>
          </div>

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{employee.name}</h3>
                      <p className="text-sm text-slate-400">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(employee.status)}`}>
                      {getStatusText(employee.status)}
                    </span>
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail size={14} />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone size={14} />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin size={14} />
                    <span>{employee.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={14} />
                    <span>Admitido: {new Date(employee.hireDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-primary" />
                      <span className="text-sm font-bold text-white">
                        {employee.salary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSalaryDetails({ ...showSalaryDetails, [employee.id]: !showSalaryDetails[employee.id] })}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {showSalaryDetails[employee.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {showSalaryDetails[employee.id] && (
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Banco:</span>
                        <span className="text-white">{employee.bankAccount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">NIF:</span>
                        <span className="text-white">{employee.nif}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Departamento:</span>
                        <span className="text-white">{employee.department}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Payroll Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                <Download size={18} />
                Exportar Folha
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                <Upload size={18} />
                Importar Folha
              </button>
            </div>
            <button
              onClick={() => setShowPayrollModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Nova Folha
            </button>
          </div>

          {/* Payroll Records */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Funcionário</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Mês/Ano</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Salário Base</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Horas Extra</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bónus</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Deduções</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Salário Líquido</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payrollRecords.map((record) => {
                    const employee = employees.find(emp => emp.id === record.employeeId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{employee?.name}</div>
                            <div className="text-xs text-slate-400">{employee?.position}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {record.month}/{record.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {record.baseSalary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {record.overtime.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {record.bonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-400">
                          -{record.deductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">
                          {record.netSalary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {record.status === 'pending' && (
                              <button
                                onClick={() => handleProcessPayroll(record.id)}
                                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                title="Processar"
                              >
                                <FileText size={16} />
                              </button>
                            )}
                            {record.status === 'processed' && (
                              <button
                                onClick={() => handlePayPayroll(record.id)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Pagar"
                              >
                                <DollarSign size={16} />
                              </button>
                            )}
                            <button
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="Nome do funcionário"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Telefone</label>
                <input
                  type="tel"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  placeholder="+244 900 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Posição</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                  placeholder="Ex: Garçom, Chef, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Departamento</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Cozinha">Cozinha</option>
                  <option value="Salão">Salão</option>
                  <option value="Administração">Administração</option>
                  <option value="Limpeza">Limpeza</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Salário (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.salary}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Data de Admissão</label>
                <input
                  type="date"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.hireDate}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.status}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as any })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="on_leave">De Férias</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Conta Bancária</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.bankAccount}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, bankAccount: e.target.value })}
                  placeholder="0055.0000.1234.5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">NIF</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.nif}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, nif: e.target.value })}
                  placeholder="123456789"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Endereço</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={employeeForm.address}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setEditingEmployee(null);
                  setEmployeeForm({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    position: '',
                    department: '',
                    salary: 0,
                    hireDate: '',
                    status: 'active',
                    bankAccount: '',
                    nif: '',
                    role: ''
                  });
                }}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                {editingEmployee ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">Nova Folha de Pagamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Funcionário</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.employeeId}
                  onChange={(e) => setPayrollForm({ ...payrollForm, employeeId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Mês</label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.month}
                  onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Janeiro">Janeiro</option>
                  <option value="Fevereiro">Fevereiro</option>
                  <option value="Março">Março</option>
                  <option value="Abril">Abril</option>
                  <option value="Maio">Maio</option>
                  <option value="Junho">Junho</option>
                  <option value="Julho">Julho</option>
                  <option value="Agosto">Agosto</option>
                  <option value="Setembro">Setembro</option>
                  <option value="Outubro">Outubro</option>
                  <option value="Novembro">Novembro</option>
                  <option value="Dezembro">Dezembro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Ano</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.year}
                  onChange={(e) => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Salário Base (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.baseSalary}
                  onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: Number(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Horas Extra (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.overtime}
                  onChange={(e) => setPayrollForm({ ...payrollForm, overtime: Number(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Bónus (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.bonuses}
                  onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: Number(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Deduções (AOA)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                  value={payrollForm.deductions}
                  onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPayrollModal(false);
                  setPayrollForm({
                    employeeId: '',
                    month: '',
                    year: new Date().getFullYear(),
                    baseSalary: 0,
                    overtime: 0,
                    bonuses: 0,
                    deductions: 0,
                    netSalary: 0,
                    status: 'pending'
                  });
                }}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayroll}
                className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Criar Folha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
