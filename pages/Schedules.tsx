import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Calendar, Plus, Trash2, Edit2, X, Clock, Users, ChevronLeft, ChevronRight,
  Copy, Save
} from 'lucide-react';
import { WorkShift } from '../types';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

import ExportButton from '../components/ExportButton';

const getHoursDifference = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '0.0';
  try {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '0.0';

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diffMinutes = endMinutes - startMinutes;
    return (diffMinutes / 60).toFixed(1);
  } catch {
    return '0.0';
  }
};

const Schedules = () => {
  const { employees, workShifts, addWorkShift, removeWorkShift } = useStore();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const d = new Date(now.setDate(diff));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentWeekStart]);

  const [viewMode, setViewMode] = useState<'GRID' | 'EMPLOYEE'>('GRID');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [formData, setFormData] = useState<Partial<WorkShift>>({
    employeeId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  const weekShifts = useMemo(() => {
    if (!workShifts) return [];
    return workShifts.filter(shift => {
      const shiftDate = new Date(currentWeekStart);
      shiftDate.setDate(currentWeekStart.getDate() + shift.dayOfWeek - 1);
      return shiftDate >= currentWeekStart && shiftDate <= weekEnd;
    });
  }, [workShifts, currentWeekStart, weekEnd]);

  const getExportConfig = () => {
    const data = weekShifts.map(shift => {
      const emp = (employees || []).find(e => e.id === shift.employeeId);
      const shiftDate = new Date(currentWeekStart);
      shiftDate.setDate(currentWeekStart.getDate() + (shift.dayOfWeek || 1) - 1);
      
      return {
        employeeName: emp?.name || 'Desconhecido',
        day: DAYS_OF_WEEK[(shift.dayOfWeek || 1) - 1] || 'N/A',
        date: shiftDate.toLocaleDateString('pt-AO'),
        time: `${shift.startTime} - ${shift.endTime}`,
        hours: getHoursDifference(shift.startTime, shift.endTime),
        notes: shift.notes || '-'
      };
    }).sort((a, b) => {
      // Sort by day then employee
      const empA = (employees || []).find(e => e.name === a.employeeName);
      const empB = (employees || []).find(e => e.name === b.employeeName);
      
      const shiftA = weekShifts.find(s => s.employeeId === empA?.id);
      const shiftB = weekShifts.find(s => s.employeeId === empB?.id);
      
      const dayA = shiftA?.dayOfWeek || 0;
      const dayB = shiftB?.dayOfWeek || 0;
      
      const dayDiff = dayA - dayB;
      return dayDiff || a.employeeName.localeCompare(b.employeeName);
    });

    return {
      data,
      columns: [
        { header: 'Funcionário', dataKey: 'employeeName' },
        { header: 'Dia', dataKey: 'day' },
        { header: 'Data', dataKey: 'date' },
        { header: 'Horário', dataKey: 'time' },
        { header: 'Horas', dataKey: 'hours' },
        { header: 'Notas', dataKey: 'notes' }
      ],
      fileName: `escalas_semana_${currentWeekStart.toLocaleDateString('pt-AO').replace(/\//g, '-')}`,
      title: `Escalas: ${currentWeekStart.toLocaleDateString('pt-AO')} - ${weekEnd.toLocaleDateString('pt-AO')}`
    };
  };

  const exportConfig = getExportConfig();

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.startTime || !formData.endTime) {
      alert('Por favor preencha todos os campos obrigatórios');
      return;
    }

    if (editingShift) {
      const updatedShift = { ...editingShift, ...formData } as WorkShift;
      removeWorkShift(editingShift.id);
      addWorkShift(updatedShift);
    } else {
      const newShift: WorkShift = {
        id: `shift-${Date.now()}`,
        employeeId: formData.employeeId!,
        dayOfWeek: formData.dayOfWeek || 1,
        startTime: formData.startTime!,
        endTime: formData.endTime!,
        notes: formData.notes,
      };
      addWorkShift(newShift);
    }

    setIsModalOpen(false);
    setEditingShift(null);
    setFormData({
      employeeId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    });
  };

  const openEditModal = (shift: WorkShift) => {
    setEditingShift(shift);
    setFormData(shift);
    setIsModalOpen(true);
  };

  const openNewModal = (dayOfWeek: number) => {
    setEditingShift(null);
    setFormData({
      employeeId: '',
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteShift = (shiftId: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta escala?')) {
      removeWorkShift(shiftId);
    }
  };

  const copyWeekSchedule = () => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    weekShifts.forEach(shift => {
      const newShift: WorkShift = {
        ...shift,
        id: `shift-${Date.now()}-${Math.random()}`,
      };
      addWorkShift(newShift);
    });

    setCurrentWeekStart(nextWeekStart);
    alert('Escala copiada para a próxima semana com sucesso!');
  };

  const getEmployeeShiftsForDay = (dayOfWeek: number) => {
    return weekShifts.filter(shift => shift.dayOfWeek === dayOfWeek);
  };



  const getTotalHours = () => {
    return weekShifts.reduce((total, shift) => {
      return total + parseFloat(getHoursDifference(shift.startTime, shift.endTime));
    }, 0).toFixed(1);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-background text-slate-200 no-scrollbar">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Calendar size={16} className="animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">Gestão de Staff</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Escalas Semanais</h2>
          <p className="text-slate-400 text-sm mt-2">
            {currentWeekStart.toLocaleDateString('pt-AO', { day: 'numeric', month: 'long' })} - {weekEnd.toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <ExportButton {...exportConfig} />
          <button
            onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const day = today.getDay();
              const start = new Date(today);
              start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
              setCurrentWeekStart(start);
            }}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all"
          >
            Hoje
          </button>

          <button
            onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            Próxima <ChevronRight size={16} />
          </button>

          <button
            onClick={copyWeekSchedule}
            className="px-4 py-3 rounded-xl bg-blue-600/20 text-blue-300 font-bold text-sm border border-blue-500/30 hover:bg-blue-600/30 transition-all flex items-center gap-2"
          >
            <Copy size={16} /> Copiar para próxima semana
          </button>

          <button
            onClick={() => openNewModal(1)}
            className="px-6 py-3 rounded-2xl bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-glow hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Nova Escala
          </button>
        </div>
      </header>

      {/* View Mode Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/5">
        {[
          { id: 'GRID', label: 'Vista em Grelha', icon: Calendar },
          { id: 'EMPLOYEE', label: 'Por Funcionário', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as 'GRID' | 'EMPLOYEE')}
            className={`pb-4 px-4 font-black uppercase text-[10px] tracking-[0.1em] transition-all relative flex items-center gap-2 ${
              viewMode === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            {viewMode === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full shadow-glow"></div>
            )}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {viewMode === 'GRID' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-primary" size={18} />
                <span className="text-slate-400 text-xs uppercase font-bold">Total de Horas</span>
              </div>
              <p className="text-3xl font-black text-primary">{getTotalHours()}h</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-cyan-400" size={18} />
                <span className="text-slate-400 text-xs uppercase font-bold">Funcionários</span>
              </div>
              <p className="text-3xl font-black text-cyan-400">{new Set(weekShifts.map(s => s.employeeId)).size}</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-green-400" size={18} />
                <span className="text-slate-400 text-xs uppercase font-bold">Escalas</span>
              </div>
              <p className="text-3xl font-black text-green-400">{weekShifts.length}</p>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, index) => {
              const dayOfWeek = (index + 1) % 7 || 7;
              const dayDate = new Date(currentWeekStart);
              dayDate.setDate(currentWeekStart.getDate() + index);
              const dayShifts = getEmployeeShiftsForDay(dayOfWeek);
              const isToday = new Date().toDateString() === dayDate.toDateString();

              return (
                <div
                  key={index}
                  className={`glass-panel rounded-2xl border transition-all min-h-[500px] flex flex-col ${
                    isToday ? 'border-primary/50 bg-primary/5' : 'border-white/5'
                  }`}
                >
                  <div className={`p-4 border-b ${isToday ? 'border-primary/30 bg-primary/10' : 'border-white/5'}`}>
                    <p className={`text-sm font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                      {DAYS_OF_WEEK[index]}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dayDate.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {dayShifts.length > 0 ? (
                      dayShifts.map(shift => {
                        const emp = employees.find(e => e.id === shift.employeeId);
                        const hours = getHoursDifference(shift.startTime, shift.endTime);
                        return (
                          <div
                            key={shift.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-primary/50 transition-all group cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate" title={emp?.name}>
                                  {emp?.name || 'Desconhecido'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {shift.startTime} - {shift.endTime}
                                </p>
                                <p className="text-[10px] text-primary font-bold mt-0.5">{hours}h</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(shift)}
                                  className="p-1 hover:bg-blue-600/20 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={12} className="text-blue-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteShift(shift.id)}
                                  className="p-1 hover:bg-red-600/20 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={12} className="text-red-400" />
                                </button>
                              </div>
                            </div>
                            {shift.notes && (
                              <p className="text-[9px] text-slate-500 italic border-t border-white/5 pt-2 mt-2">
                                {shift.notes}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => openNewModal(dayOfWeek)}
                        className="w-full py-8 rounded-xl border-2 border-dashed border-slate-600 hover:border-primary text-slate-500 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <Plus size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase">Adicionar</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-white/5 p-4">
                    <button
                      onClick={() => openNewModal(dayOfWeek)}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold uppercase transition-all"
                    >
                      + Escala
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee View */}
      {viewMode === 'EMPLOYEE' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Users size={48} className="opacity-30 mb-4" />
              <p className="text-sm font-bold">Nenhum funcionário registado</p>
            </div>
          ) : (
            employees.map(emp => {
              const empShifts = weekShifts.filter(s => s.employeeId === emp.id);
              const empHours = empShifts.reduce((total, shift) => {
                return total + parseFloat(getHoursDifference(shift.startTime, shift.endTime));
              }, 0);

              return (
                <div key={emp.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                        style={{ backgroundColor: emp.color }}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">{empHours.toFixed(1)}h</p>
                      <p className="text-xs text-slate-500">Esta semana</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    {empShifts.length > 0 ? (
                      empShifts.map(shift => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/50 transition-all group"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">
                              {DAYS_OF_WEEK[(shift.dayOfWeek - 1) % 7]}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {shift.startTime} - {shift.endTime} ({getHoursDifference(shift.startTime, shift.endTime)}h)
                            </p>
                            {shift.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-2">{shift.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(shift)}
                              className="p-2 hover:bg-blue-600/20 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift.id)}
                              className="p-2 hover:bg-red-600/20 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8 text-sm">Sem escalas esta semana</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Escala */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl border border-white/10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">
                {editingShift ? 'Editar Escala' : 'Nova Escala'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-red-400" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4">
              {/* Funcionário */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Funcionário</label>
                <select
                  value={formData.employeeId || ''}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-primary outline-none transition-colors"
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dia da Semana */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dia da Semana</label>
                <select
                  value={formData.dayOfWeek || 1}
                  onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-primary outline-none transition-colors"
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={(idx + 1) % 7 || 7}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hora Início */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hora de Início</label>
                <input
                  type="time"
                  value={formData.startTime || '09:00'}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Hora Fim */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Hora de Fim</label>
                <input
                  type="time"
                  value={formData.endTime || '17:00'}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notas (Opcional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-primary outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Ex: Pausa extra, Reunião, etc..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase text-xs hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-black uppercase text-xs shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
