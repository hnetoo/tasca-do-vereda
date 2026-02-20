'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, 
  Shield, Key, Clock, DollarSign, Edit2, Trash2
} from 'lucide-react';
import { Employee, Role } from '@/types';
import EmployeeModal from '@/components/EmployeeModal';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, removeEmployee } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = (employees as Employee[]).filter((emp) => 
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Funcionários</h1>
          <p className="text-slate-500">Gestão de equipa e permissões</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={20} />
          Novo Funcionário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar funcionário..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-primary"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter size={20} />
            Filtrar
          </button>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">Cargo</th>
              <th className="px-6 py-3 font-medium">PIN</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map(employee => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{employee.name}</div>
                      <div className="text-xs text-slate-400">{employee.email || 'Sem email'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="flex items-center gap-2">
                    <Shield size={16} className="text-slate-400" />
                    {employee.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-slate-600">
                  ***{employee.pin?.slice(-1)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Ativo
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingEmployee(employee);
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este funcionário?')) {
                          removeEmployee(employee.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employee={editingEmployee}
      />
    </div>
  );
}
