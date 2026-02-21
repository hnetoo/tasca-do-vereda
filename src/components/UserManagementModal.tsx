'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, 
  Shield, Key, Clock, DollarSign, Edit2, Trash2, X
} from 'lucide-react';
import { Employee, Role } from '@/types';
import EmployeeModal from '@/components/EmployeeModal'; // Assuming this is the correct path

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { employees, addEmployee, updateEmployee, removeEmployee } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false); // Renamed to avoid conflict
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  if (!isOpen) return null;

  const filteredEmployees = (employees as Employee[]).filter((emp) => 
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-4xl text-white max-h-[90vh] flex flex-col"> {/* Increased max-w */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Gestão de Utilizadores
          </h2>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="flex justify-between items-center mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar utilizador..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-primary text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingEmployee(null);
                setShowEmployeeModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={20} />
              Novo Utilizador
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Cargo</th>
                  <th className="px-6 py-3 font-medium">PIN</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEmployees.map(employee => (
                  <tr key={employee.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{employee.name}</div>
                          <div className="text-xs text-slate-400">{employee.email || 'Sem email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-2">
                        <Shield size={16} className="text-slate-500" />
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      ***{employee.pin?.slice(-1)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-xs font-medium">
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este utilizador?')) {
                              removeEmployee(employee.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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
        </div>

        <EmployeeModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          employee={editingEmployee}
        />
      </div>
    </div>
  );
};

export default UserManagementModal;
