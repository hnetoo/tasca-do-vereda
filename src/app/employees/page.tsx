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

  const [activeTab, setActiveTab] = useState<'employees'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'inactive':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'on_leave':
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

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Pessoal</h1>
        <p className="text-slate-400">Mini RH - Gestão completa de funcionários</p>
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
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Salários</p>
          <p className="text-2xl font-black text-white">
            {employees.reduce((total, emp) => total + emp.salary, 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
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

      {/* Search and Actions */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
}
