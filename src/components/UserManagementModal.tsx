'use client';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { 
  Users, UserPlus, Search, Shield, Edit2, Trash2, X, AlertTriangle
} from 'lucide-react';
import { Employee } from '@/types';
import EmployeeModal from '@/components/EmployeeModal';
import { getEmployeesAction, deleteEmployeeAction } from '@/app/actions/users';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { employees, removeEmployee, currentUser, addNotification } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; employeeId: string | null; employeeName: string | null }>({
    isOpen: false,
    employeeId: null,
    employeeName: null
  });
  
  // States for data fetching and loading
  const [isLoading, setIsLoading] = useState(false);
  // Initial state is empty array to ensure safe initial render
  const [loadedEmployees, setLoadedEmployees] = useState<Employee[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(false);

  const canManageUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER';

  // Unified useEffect for fetching data
  // Handles initial load and refetch after modal close
  useEffect(() => {
    isMounted.current = true;
    // let active = true; // 'active' flag is now replaced by isMounted.current

    async function fetchEmployees() {
      if (!isOpen) return;
      // Do not fetch if the sub-modal is open (wait for it to close to refresh data)
      if (showEmployeeModal) return;

      setIsLoading(true);
      setLoadError(null);
      
      try {
        const res = await getEmployeesAction();
        
        // Prevent state update if component is unmounted or effect is cleanup
        if (!isMounted.current) return;

        if (res.success && res.data) {
          setLoadedEmployees(res.data);
        } else {
          setLoadedEmployees([]);
          setLoadError(res.error || 'Falha ao carregar utilizadores.');
        }
      } catch (e) {
        if (!isMounted.current) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setLoadedEmployees([]);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    }

    fetchEmployees();

    return () => {
      isMounted.current = false;
    };
  }, [isOpen, showEmployeeModal]);

  const handleDeleteClick = (employee: Employee) => {
    setDeleteConfirmation({
      isOpen: true,
      employeeId: employee.id,
      employeeName: employee.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.employeeId) {
      (async () => {
        setIsLoading(true);
        try {
          const res = await deleteEmployeeAction(deleteConfirmation.employeeId!);
          if (isMounted.current) { // Adiciona verificação de montagem aqui
            if (res.success) {
              removeEmployee(deleteConfirmation.employeeId!);
              setLoadedEmployees(prev => prev.filter(e => e.id !== deleteConfirmation.employeeId));
              addNotification?.('success', 'Utilizador eliminado com sucesso.');
              setDeleteConfirmation({ isOpen: false, employeeId: null, employeeName: null });
            } else {
              addNotification?.('error', res.error || 'Falha ao eliminar utilizador.');
            }
          }
        } finally {
          if (isMounted.current) { // Adiciona verificação de montagem aqui
            setIsLoading(false);
          }
        }
      })();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, employeeId: null, employeeName: null });
  };

  const filteredEmployees = loadedEmployees.filter((emp) => 
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  if (!canManageUsers) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-md text-white shadow-xl">
           <div className="flex flex-col items-center text-center">
             <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500 mb-4">
               <Shield size={24} />
             </div>
             <h3 className="text-xl font-bold mb-2">Acesso Negado</h3>
             <p className="text-slate-400 mb-6">
               Apenas administradores e proprietários podem gerir utilizadores.
             </p>
             <button 
               onClick={onClose}
               className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
             >
               Fechar
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-4xl text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Gestão de Utilizadores
          </h2>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {isLoading && (
            <div className="w-full flex items-center gap-3 px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              A carregar utilizadores...
            </div>
          )}
          {!isLoading && loadError && (
            <div className="w-full px-4 py-2 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
              {loadError}
            </div>
          )}
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
                          onClick={() => handleDeleteClick(employee)}
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

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-md text-white shadow-xl">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Eliminar Utilizador</h3>
                <p className="text-slate-400">
                  Tem a certeza que deseja eliminar o utilizador <span className="text-white font-medium">{deleteConfirmation.employeeName}</span>?
                  <br />
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementModal;