'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ShiftData {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: 'morning' | 'afternoon' | 'night';
  status: 'scheduled' | 'completed' | 'absent';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  position: string;
  is_active: boolean;
}

export default function SettingsStaffEscalasPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulação de dados - em produção, buscar do Supabase
      const mockEmployees: EmployeeData[] = [
        { id: '1', name: 'João Silva', email: 'joao@tasca.com', position: 'Cozinheiro', is_active: true },
        { id: '2', name: 'Maria Santos', email: 'maria@tasca.com', position: 'Garçom', is_active: true },
        { id: '3', name: 'Pedro Costa', email: 'pedro@tasca.com', position: 'Rececionista', is_active: true },
      ];

      const mockShifts: ShiftData[] = [
        {
          id: '1',
          employee_id: '1',
          date: '2024-03-04',
          start_time: '08:00',
          end_time: '16:00',
          shift_type: 'morning',
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          employee_id: '2',
          date: '2024-03-04',
          start_time: '16:00',
          end_time: '00:00',
          shift_type: 'afternoon',
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setEmployees(mockEmployees);
      setShifts(mockShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleEditShift = (shift: ShiftData) => {
    setEditingShift(shift);
    setShowModal(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (confirm('Tem certeza que deseja remover esta escala?')) {
      setShifts(shifts.filter(s => s.id !== shiftId));
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'morning': return 'Manhã';
      case 'afternoon': return 'Tarde';
      case 'night': return 'Noite';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'absent': return 'Ausente';
      default: return 'Agendado';
    }
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
                <h1 className="text-xl font-bold text-white">Escalas</h1>
                <p className="text-sm text-gray-400">Gestão de horários e turnos</p>
              </div>
            </div>
            <button
              onClick={handleCreateShift}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Escala
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
                <p className="text-sm text-gray-400">Total de Funcionários</p>
                <p className="text-2xl font-bold text-white">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Escalas Hoje</p>
                <p className="text-2xl font-bold text-white">
                  {shifts.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Concluídas</p>
                <p className="text-2xl font-bold text-green-400">
                  {shifts.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ausências</p>
                <p className="text-2xl font-bold text-red-400">
                  {shifts.filter(s => s.status === 'absent').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300">Semana:</label>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Shifts List */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-medium text-white">Escalas Programadas</h3>
          </div>
          
          <div className="divide-y divide-slate-700">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando dados...</p>
              </div>
            ) : shifts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma escala encontrada</p>
                <button
                  onClick={handleCreateShift}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Criar primeira escala
                </button>
              </div>
            ) : (
              shifts.map((shift) => (
                <div key={shift.id} className="px-6 py-4 hover:bg-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="text-lg font-medium text-white">{getEmployeeName(shift.employee_id)}</h4>
                        <span className="text-sm text-gray-400">{getShiftTypeLabel(shift.shift_type)}</span>
                        {getStatusIcon(shift.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Data:</span>
                          <span className="font-medium text-white">{shift.date}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Início:</span>
                          <span className="font-medium text-white">{shift.start_time}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Fim:</span>
                          <span className="font-medium text-white">{shift.end_time}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className="font-medium text-white">{getStatusLabel(shift.status)}</span>
                        </div>
                      </div>
                      {shift.notes && (
                        <div className="mt-2">
                          <span className="text-gray-400">Observações:</span>
                          <span className="text-white ml-2">{shift.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded transition-colors"
                        title="Editar escala"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded transition-colors"
                        title="Remover escala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for creating/editing shifts */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingShift ? 'Editar Escala' : 'Nova Escala'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Funcionário</label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingShift?.employee_id || ''}
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingShift?.date || ''}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingShift?.start_time || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fim</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingShift?.end_time || ''}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Turno</label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingShift?.shift_type || ''}
                >
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="night">Noite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  defaultValue={editingShift?.notes || ''}
                  placeholder="Observações sobre a escala..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Simulação de salvamento
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingShift ? 'Atualizar' : 'Criar'} Escala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
