import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Users, UserPlus, Calendar, Clock, Phone, DollarSign, Trash2, 
  Edit2, X, Plus, Briefcase, UserCircle, Save, Fingerprint, LogOut, LogIn, Check, Link2, Cpu, Eye, CreditCard, File, AlertCircle, FileText, Calculator, CheckSquare, Banknote
} from 'lucide-react';
import { Employee, WorkShift, UserRole, PayrollRecord } from '../types';
import ExportButton from '../components/ExportButton';
import SalaryCalculatorAngola from '../components/SalaryCalculatorAngola';
import { MOCK_EMPLOYEES_ANGOLA, calculateSalaryBreakdown, formatKzDetailed } from '../services/salaryCalculatorAngola';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const Employees = () => {
  const { 
    employees, workShifts, addEmployee, updateEmployee, removeEmployee, 
    clockIn, clockOut, attendance, addWorkShift, removeWorkShift,
    processPayroll, payroll, justifyAbsence
  } = useStore();
  
  type TabType = 'LIST' | 'SCHEDULE' | 'ATTENDANCE' | 'PAYROLL';
  const [activeTab, setActiveTab] = useState<TabType>('LIST');
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedEmpForAbsence, setSelectedEmpForAbsence] = useState<Employee | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [selectedAbsenceDate, setSelectedAbsenceDate] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpForSalary, setSelectedEmpForSalary] = useState<Employee | null>(null);

  // Shift Management State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [shiftForm, setShiftForm] = useState<Partial<WorkShift>>({
    employeeId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });

  // Form States
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    name: '', role: 'GARCOM', phone: '', salary: 0, status: 'ATIVO', color: '#06b6d4', workDaysPerMonth: 22, dailyWorkHours: 8, externalBioId: '', bi: '', nif: ''
  });

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const getAttendanceStatus = (empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const record = attendance?.find(a => a.employeeId === empId && a.date === today);
    if (!record) return 'AUSENTE';
    if (record.clockIn && !record.clockOut) return 'NO POSTO';
    return 'FINALIZADO';
  };

  const getExportConfig = () => {
    switch (activeTab) {
      case 'LIST':
        return {
          data: employees.map(e => ({
            ...e,
            salary: formatKz(e.salary),
            status: e.status || 'ATIVO'
          })),
          columns: [
            { header: 'Nome', dataKey: 'name' },
            { header: 'Cargo', dataKey: 'role' },
            { header: 'Telefone', dataKey: 'phone' },
            { header: 'NIF', dataKey: 'nif' },
            { header: 'Salário Base', dataKey: 'salary' },
            { header: 'Status', dataKey: 'status' }
          ],
          fileName: 'lista_funcionarios',
          title: 'Lista de Funcionários'
        };
      case 'SCHEDULE':
        return {
          data: workShifts.map(s => ({
            ...s,
            employeeName: employees.find(e => e.id === s.employeeId)?.name || 'N/A',
            day: DAYS_OF_WEEK[(s.dayOfWeek - 1) % 7],
            period: `${s.startTime} - ${s.endTime}`
          })).sort((a, b) => a.dayOfWeek - b.dayOfWeek),
          columns: [
            { header: 'Funcionário', dataKey: 'employeeName' },
            { header: 'Dia da Semana', dataKey: 'day' },
            { header: 'Horário', dataKey: 'period' },
            { header: 'Notas', dataKey: 'notes' }
          ],
          fileName: 'escala_trabalho',
          title: 'Escala de Trabalho Semanal'
        };
      case 'ATTENDANCE': {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(a => a.date === today);
        return {
          data: employees.map(e => {
            const record = todayAttendance.find(a => a.employeeId === e.id);
            return {
              name: e.name,
              role: e.role,
              in: record?.clockIn ? new Date(record.clockIn).toLocaleTimeString('pt-AO') : '-',
              out: record?.clockOut ? new Date(record.clockOut).toLocaleTimeString('pt-AO') : '-',
              status: getAttendanceStatus(e.id)
            };
          }),
          columns: [
            { header: 'Nome', dataKey: 'name' },
            { header: 'Cargo', dataKey: 'role' },
            { header: 'Entrada', dataKey: 'in' },
            { header: 'Saída', dataKey: 'out' },
            { header: 'Status', dataKey: 'status' }
          ],
          fileName: `presencas_${today}`,
          title: `Registo de Presenças - ${new Date().toLocaleDateString('pt-AO')}`
        };
      }
      case 'PAYROLL':
        return {
          data: payroll.map(p => ({
            ...p,
            employeeName: employees.find(e => e.id === p.employeeId)?.name || 'N/A',
            netSalary: formatKz(p.netSalary),
            status: p.status === 'PAID' ? 'Pago' : 'Pendente'
          })),
          columns: [
            { header: 'Funcionário', dataKey: 'employeeName' },
            { header: 'Mês/Ano', dataKey: 'month' }, // Needs formatting
            { header: 'Salário Líquido', dataKey: 'netSalary' },
            { header: 'Status', dataKey: 'status' }
          ],
          fileName: 'folha_pagamento_geral',
          title: 'Histórico de Pagamentos'
        };
      default:
        return { data: [], columns: [], fileName: 'relatorio', title: 'Relatório' };
    }
  };

  const exportConfig = getExportConfig();

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      updateEmployee({ ...editingEmp, ...empForm } as Employee);
    } else {
      addEmployee({
        id: `emp-${Date.now()}`,
        name: empForm.name || '',
        role: empForm.role as UserRole,
        phone: empForm.phone || '',
        salary: Number(empForm.salary) || 0,
        status: 'ATIVO',
        color: empForm.color || '#06b6d4',
        workDaysPerMonth: Number(empForm.workDaysPerMonth) || 22,
        dailyWorkHours: Number(empForm.dailyWorkHours) || 8,
        externalBioId: empForm.externalBioId || `${Math.floor(Math.random() * 9999)}`,
        bi: empForm.bi || '',
        nif: empForm.nif || ''
      });
    }
    setIsEmpModalOpen(false);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.employeeId || !shiftForm.startTime || !shiftForm.endTime) return;

    if (editingShift) {
      removeWorkShift(editingShift.id);
      addWorkShift({ ...editingShift, ...shiftForm } as WorkShift);
    } else {
      addWorkShift({
        id: `shift-${Date.now()}-${Math.random()}`,
        employeeId: shiftForm.employeeId!,
        dayOfWeek: shiftForm.dayOfWeek || 1,
        startTime: shiftForm.startTime!,
        endTime: shiftForm.endTime!,
        notes: shiftForm.notes
      });
    }
    setIsShiftModalOpen(false);
    setEditingShift(null);
  };

  const generateTestData = () => {
    // 1. Add Mock Employees if not exist
    const newEmployees: Employee[] = [];
    MOCK_EMPLOYEES_ANGOLA.forEach(emp => {
      if (!employees.find(e => e.phone === emp.phone)) {
        const newEmp: Employee = {
          id: `emp-${Date.now()}-${Math.random()}`,
          name: emp.name,
          role: emp.role as UserRole,
          phone: emp.phone,
          salary: emp.salarioBase,
          status: 'ATIVO',
          color: emp.color,
          workDaysPerMonth: emp.workDaysPerMonth,
          dailyWorkHours: emp.dailyWorkHours,
          externalBioId: emp.externalBioId,
          bi: emp.bi,
          nif: emp.nif,
        };
        addEmployee(newEmp);
        newEmployees.push(newEmp);
      }
    });

    const allEmployees = [...employees, ...newEmployees];

    // 2. Add Shifts for all employees (Mon-Fri)
    allEmployees.forEach(emp => {
      // Check if employee already has shifts
      const hasShifts = workShifts.some(s => s.employeeId === emp.id);
      if (!hasShifts) {
        // Add shifts for Monday (1) to Friday (5)
        for (let day = 1; day <= 5; day++) {
          addWorkShift({
            id: `shift-${emp.id}-${day}-${Date.now()}`,
            employeeId: emp.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '18:00',
            notes: 'Horário Regular'
          });
        }
      }
    });

    // 3. Add Attendance for today (randomly clock in some people)
    const today = new Date().toISOString().split('T')[0];
    allEmployees.forEach((emp, idx) => {
      const hasAttendance = attendance.some(a => a.employeeId === emp.id && a.date === today);
      if (!hasAttendance) {
        // 50% chance to be clocked in
        if (Math.random() > 0.5) {
          clockIn(emp.id);
        }
      }
    });

    alert('Dados de teste gerados com sucesso! (Funcionários, Escalas e Presenças)');
  };



  return (
    <div className="p-8 h-full overflow-y-auto bg-background text-slate-200 no-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
             <Fingerprint size={16} className="animate-pulse" />
             <span className="text-xs font-mono font-bold tracking-widest uppercase">Biometria & Staff</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Gestão de Equipa</h2>
        </div>
        <div className="flex gap-3">
          <ExportButton {...exportConfig} />
          <button 
            onClick={() => setIsBioModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-slate-800 text-primary font-black text-[10px] uppercase tracking-[0.2em] border border-primary/20 shadow-glow flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
          >
            <Fingerprint size={18} /> Picagem Biométrica
          </button>
          <button 
            onClick={() => { setEditingEmp(null); setEmpForm({ name: '', role: 'GARCOM', phone: '', salary: 0, status: 'ATIVO', color: '#06b6d4', workDaysPerMonth: 22, dailyWorkHours: 8, externalBioId: '' }); setIsEmpModalOpen(true); }}
            className="px-6 py-3 rounded-2xl bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-glow hover:brightness-110 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} /> Novo Funcionário
          </button>
          <button 
            onClick={generateTestData}
            className="px-6 py-3 rounded-2xl bg-slate-800 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] border border-blue-500/20 hover:bg-blue-500/10 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Gerar Dados Teste
          </button>
        </div>
      </header>

      <div className="flex gap-4 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'LIST', label: 'Lista de Staff', icon: Users },
          { id: 'SCHEDULE', label: 'Escalas Semanais', icon: Calendar },
          { id: 'ATTENDANCE', label: 'Monitor de Hoje', icon: Clock },
          { id: 'PAYROLL', label: 'Folha de Pagamentos', icon: Banknote }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`pb-4 px-6 font-black uppercase text-[10px] tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}>
            <tab.icon size={16} /> {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full shadow-glow"></div>}
          </button>
        ))}
      </div>

      {/* VIEW: STAFF LIST */}
      {activeTab === 'LIST' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {employees.map(emp => {
            const status = getAttendanceStatus(emp.id);
            return (
              <div key={emp.id} className="glass-panel p-6 rounded-[2.5rem] border border-white/5 group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                <div className={`absolute top-5 right-5 text-[8px] font-black uppercase px-3 py-1 rounded-full border ${status === 'NO POSTO' ? 'border-green-500 text-green-500 animate-pulse' : 'border-slate-700 text-slate-500'}`}>{status}</div>
                
                <div className="flex items-start gap-5 mb-8 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl text-2xl font-black" style={{ backgroundColor: emp.color }}>
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg tracking-tight truncate w-32">{emp.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{emp.role}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                    <Phone size={14} className="text-primary" /> {emp.phone}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                    <Cpu size={14} className="text-blue-500" /> <span className="font-mono">ZKTeco ID: {emp.externalBioId}</span>
                  </div>
                  {emp.bi && (
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                      <CreditCard size={14} className="text-cyan-500" /> <span className="font-mono">BI: {emp.bi}</span>
                    </div>
                  )}
                  {emp.nif && (
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                      <File size={14} className="text-orange-500" /> <span className="font-mono">NIF: {emp.nif}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                    <DollarSign size={14} className="text-green-500" /> {formatKz(emp.salary)}
                  </div>
                </div>

                <div className="flex gap-2 relative z-10">
                  <button onClick={() => { setEditingEmp(emp); setEmpForm(emp); setIsEmpModalOpen(true); }} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Edit2 size={12} /> Editar</button>
                  <button onClick={() => setSelectedEmpForSalary(emp)} className="flex-1 py-3 rounded-xl border border-green-500/10 text-green-500/50 hover:bg-green-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><DollarSign size={12} /> Salário</button>
                  <button onClick={() => { if(window.confirm('Eliminar funcionário?')) removeEmployee(emp.id); }} className="w-12 py-3 rounded-xl border border-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: SCHEDULES */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           {employees.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
               <Users size={48} className="mx-auto mb-4 opacity-30" />
               <p>Nenhum funcionário cadastrado. Gere dados de teste ou adicione manualmente.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {employees.map(emp => {
                  const empShifts = workShifts.filter(s => s.employeeId === emp.id).sort((a,b) => a.dayOfWeek - b.dayOfWeek);
                  return (
                    <div key={emp.id} className="glass-panel p-6 rounded-[2rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: emp.color }}>
                             {emp.name.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <h3 className="text-white font-bold text-lg">{emp.name}</h3>
                             <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{emp.role}</p>
                           </div>
                         </div>
                         <button 
                           onClick={() => {
                             setEditingShift(null);
                             setShiftForm({ employeeId: emp.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', notes: '' });
                             setIsShiftModalOpen(true);
                           }}
                           className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                         >
                           <Plus size={14} /> Adicionar Escala
                         </button>
                      </div>

                      {empShifts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {empShifts.map(shift => (
                             <div key={shift.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group relative">
                                <div className="flex justify-between items-start mb-2">
                                   <span className="text-xs font-black text-primary uppercase tracking-widest">
                                     {DAYS_OF_WEEK[(shift.dayOfWeek - 1) % 7] || 'Dia Inválido'}
                                   </span>
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingShift(shift); setShiftForm(shift); setIsShiftModalOpen(true); }} className="p-1 hover:text-blue-400 transition-colors"><Edit2 size={12}/></button>
                                      <button onClick={() => removeWorkShift(shift.id)} className="p-1 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                                   </div>
                                </div>
                                <div className="text-white font-mono font-bold text-lg mb-1">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                {shift.notes && <p className="text-[10px] text-slate-500 italic">{shift.notes}</p>}
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Nenhuma escala definida para este funcionário.</p>
                      )}
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      )}

      {/* VIEW: ATTENDANCE MONITOR */}
      {activeTab === 'ATTENDANCE' && (
        <div className="animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => {
                const status = getAttendanceStatus(emp.id);
                const todayRecord = attendance.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0]);
                
                return (
                  <div key={emp.id} className={`glass-panel p-6 rounded-[2rem] border relative overflow-hidden ${status === 'NO POSTO' ? 'border-green-500/30' : 'border-white/5'}`}>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: emp.color }}>
                          {emp.name.substring(0,1)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight">{emp.name}</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">{emp.role}</p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            status === 'NO POSTO' ? 'bg-green-500/20 text-green-400' : 
                            status === 'FINALIZADO' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${status === 'NO POSTO' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></div>
                            {status}
                          </div>
                        </div>
                     </div>

                     <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl">
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500 font-bold uppercase">Entrada</span>
                           <span className="text-white font-mono">{todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500 font-bold uppercase">Saída</span>
                           <span className="text-white font-mono">{todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => clockIn(emp.id)}
                          disabled={status !== 'AUSENTE'}
                          className={`py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${
                            status === 'AUSENTE' 
                              ? 'bg-green-500 text-black hover:brightness-110 shadow-glow' 
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <LogIn size={14} /> Entrar
                        </button>
                        <button 
                          onClick={() => clockOut(emp.id)}
                          disabled={status !== 'NO POSTO'}
                          className={`py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${
                            status === 'NO POSTO' 
                              ? 'bg-red-500 text-white hover:brightness-110 shadow-glow' 
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <LogOut size={14} /> Sair
                        </button>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* VIEW: PAYROLL */}
      {activeTab === 'PAYROLL' && (
        <div className="animate-in fade-in duration-500 space-y-8">
           {/* Controls */}
           <div className="flex flex-wrap items-center gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/10 rounded-xl text-primary"><Calendar size={20}/></div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mês de Referência</label>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-black/40 border border-white/10 rounded-lg text-white font-bold text-sm p-2 outline-none focus:border-primary"
                    >
                      {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                        <option key={i} value={i} className="bg-slate-900">{m}</option>
                      ))}
                    </select>
                 </div>
              </div>
              
              <div className="h-10 w-px bg-white/10 hidden md:block"></div>
              
              <div className="flex-1">
                 <p className="text-sm text-slate-400">
                   Processamento de salários para <strong className="text-white">{['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][selectedMonth]} de {selectedYear}</strong>.
                   Certifique-se que todas as faltas foram justificadas antes de processar.
                 </p>
              </div>
           </div>

           {/* Payroll Grid */}
           <div className="grid grid-cols-1 gap-4">
              {employees.map(emp => {
                // Find existing payroll record
                const record = payroll.find(p => p.employeeId === emp.id && p.month === selectedMonth && p.year === selectedYear);
                
                // Calculate quick stats (preview)
                // This logic mirrors useStore but simplified for preview
                // In a real app, we might want a 'getPayrollPreview' selector
                
                return (
                  <div key={emp.id} className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                     <div className="flex flex-col lg:flex-row items-center gap-6">
                        {/* Employee Info */}
                        <div className="flex items-center gap-4 w-full lg:w-1/4">
                           <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{ backgroundColor: emp.color }}>
                             {emp.name.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <h3 className="font-bold text-white text-base">{emp.name}</h3>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{emp.role}</p>
                           </div>
                        </div>

                        {/* Salary Stats */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                           <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Base</p>
                              <p className="text-white font-mono font-bold">{formatKzDetailed(emp.salary)}</p>
                           </div>
                           <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Estado</p>
                              <div className={`inline-flex items-center gap-2 text-xs font-bold ${record ? 'text-green-500' : 'text-yellow-500'}`}>
                                {record ? <Check size={12}/> : <Clock size={12}/>}
                                {record ? 'PROCESSADO' : 'PENDENTE'}
                              </div>
                           </div>
                           <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Líquido (Est.)</p>
                              <p className={`font-mono font-bold ${record ? 'text-green-400' : 'text-slate-400'}`}>
                                {record ? formatKzDetailed(record.netSalary) : '---'}
                              </p>
                           </div>
                           {record && (
                             <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Faltas/Desc.</p>
                                <p className="text-red-400 font-mono font-bold">-{formatKzDetailed(record.absenceDeduction)}</p>
                             </div>
                           )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                           <button 
                             onClick={() => {
                               setSelectedEmpForAbsence(emp);
                               setIsAbsenceModalOpen(true);
                             }}
                             className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2"
                           >
                             <AlertCircle size={14} /> Faltas
                           </button>
                           
                           {record ? (
                             <button 
                               onClick={() => alert('Recibo detalhado em desenvolvimento')} // Placeholder alert
                               className="px-6 py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
                             >
                               <FileText size={14} /> Recibo
                             </button>
                           ) : (
                             <button 
                               onClick={() => processPayroll(emp.id, selectedMonth, selectedYear, 'TRANSFERENCIA')}
                               className="px-6 py-3 bg-primary text-black rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-glow hover:brightness-110 transition-all flex items-center gap-2"
                             >
                               <Calculator size={14} /> Processar
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {/* ABSENCE JUSTIFICATION MODAL */}
      {isAbsenceModalOpen && selectedEmpForAbsence && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="glass-panel rounded-[2.5rem] w-full max-w-2xl p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
                   <AlertCircle className="text-primary"/> Gestão de Faltas
                 </h2>
                 <button onClick={() => setIsAbsenceModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black" style={{ backgroundColor: selectedEmpForAbsence.color }}>
                      {selectedEmpForAbsence.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{selectedEmpForAbsence.name}</h3>
                      <p className="text-xs text-slate-500 uppercase font-bold">Justificar ausências para evitar descontos</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data da Falta</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary"
                      value={selectedAbsenceDate}
                      onChange={e => setSelectedAbsenceDate(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo / Justificativa</label>
                    <textarea 
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary h-32 resize-none"
                      placeholder="Ex: Doença, Assunto Familiar, etc..."
                      value={justificationText}
                      onChange={e => setJustificationText(e.target.value)}
                    ></textarea>
                 </div>
                 
                 <button 
                   onClick={() => {
                     if (selectedAbsenceDate && justificationText) {
                       justifyAbsence(selectedEmpForAbsence.id, selectedAbsenceDate, justificationText);
                       setJustificationText('');
                       setSelectedAbsenceDate('');
                       setIsAbsenceModalOpen(false);
                     } else {
                       alert('Preencha a data e o motivo.');
                     }
                   }}
                   className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                 >
                   <CheckSquare size={18} /> Confirmar Justificativa
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Biométrico (Existing) */}
      {isBioModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
           <div className="glass-panel rounded-[4rem] w-full max-w-lg p-12 border border-white/10 shadow-2xl relative text-center">
              <button onClick={() => setIsBioModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X size={32} /></button>
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-8 animate-pulse shadow-glow border border-primary/30">
                 <Fingerprint size={48} />
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8">Ponto de Assiduidade</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar px-2">
                 {employees.map(emp => {
                   const status = getAttendanceStatus(emp.id);
                   return (
                     <div key={emp.id} className="p-5 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:bg-primary/5 transition-all">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: emp.color }}>{emp.name.substring(0, 1)}</div>
                           <div className="text-left">
                              <p className="font-bold text-white text-base leading-none mb-1">{emp.name}</p>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{status} <span className="ml-2 text-blue-500">ID: {emp.externalBioId}</span></p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           {status === 'AUSENTE' && <button onClick={() => clockIn(emp.id)} className="p-4 bg-green-500 text-black rounded-2xl hover:scale-105 transition-transform"><LogIn size={20}/></button>}
                           {status === 'NO POSTO' && <button onClick={() => clockOut(emp.id)} className="p-4 bg-red-500 text-white rounded-2xl hover:scale-105 transition-transform"><LogOut size={20}/></button>}
                           {status === 'FINALIZADO' && <div className="p-4 text-green-500"><Check size={28} /></div>}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Modal Funcionário (Existing) */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel rounded-[3rem] w-full max-w-xl p-12 border border-white/10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{editingEmp ? 'Editar Ficha' : 'Admissão de Staff'}</h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-500 hover:text-white"><X size={32} /></button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome Completo do Funcionário</label>
                  <input required type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-bold" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Função Operativa</label>
                  <select className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-bold appearance-none" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value as UserRole})}>
                    <option value="GARCOM" className="bg-slate-900">Garçom / Atendimento</option>
                    <option value="COZINHA" className="bg-slate-900">Chef / Cozinha</option>
                    <option value="CAIXA" className="bg-slate-900">Operador de Caixa</option>
                    <option value="ADMIN" className="bg-slate-900">Gestão / Gerente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ID Biométrico ZKTeco</label>
                  <input type="text" placeholder="Ex: 1001" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono font-bold" value={empForm.externalBioId} onChange={e => setEmpForm({...empForm, externalBioId: e.target.value})} />
                  <p className="text-[9px] text-slate-600 font-bold uppercase mt-2 italic">* Deve ser igual ao ID no terminal ZKTeco</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Bilhete de Identidade (BI)</label>
                  <input type="text" placeholder="Ex: 002345678LA078" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono font-bold uppercase" value={empForm.bi} onChange={e => setEmpForm({...empForm, bi: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">NIF (Identificação Fiscal)</label>
                  <input type="text" placeholder="Ex: 123456789001" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono font-bold" value={empForm.nif} onChange={e => setEmpForm({...empForm, nif: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vencimento Base Mensal (Kz)</label>
                  <input required type="number" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-mono font-bold text-xl" value={empForm.salary} onChange={e => setEmpForm({...empForm, salary: Number(e.target.value)})} />
                  {empForm.salary && empForm.role && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-slate-300 mb-2"><strong>Salário Líquido Estimado:</strong></p>
                      <p className="text-xl font-black text-blue-400">
                        {formatKzDetailed(calculateSalaryBreakdown(Number(empForm.salary), empForm.role as string).salarioLiquido)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">IRT + INSS descontados automaticamente</p>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-primary text-black rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-glow flex items-center justify-center gap-3 hover:brightness-110 transition-all">
                <Save size={22} /> Confirmar Cadastro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edição de Escala */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel rounded-[3rem] w-full max-w-md p-12 border border-white/10 shadow-2xl relative">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingShift ? 'Editar Escala' : 'Nova Escala'}</h3>
               <button onClick={() => setIsShiftModalOpen(false)} className="text-slate-500 hover:text-white"><X size={28} /></button>
             </div>
             <form onSubmit={handleSaveShift} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dia da Semana</label>
                  <select 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-bold appearance-none"
                    value={shiftForm.dayOfWeek} 
                    onChange={e => setShiftForm({...shiftForm, dayOfWeek: Number(e.target.value)})}
                  >
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <option key={idx} value={idx + 1} className="bg-slate-900">{day}</option>
                    ))}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Início</label>
                    <input type="time" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-bold" value={shiftForm.startTime} onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fim</label>
                    <input type="time" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary font-bold" value={shiftForm.endTime} onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notas (Opcional)</label>
                  <input type="text" placeholder="Ex: Turno da manhã" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary" value={shiftForm.notes} onChange={e => setShiftForm({...shiftForm, notes: e.target.value})} />
               </div>
               <button type="submit" className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow hover:brightness-110 transition-all">
                 Salvar Escala
               </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Cálculo de Salários (Existing) */}
      {selectedEmpForSalary && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel rounded-[3rem] w-full max-w-2xl p-12 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-10 sticky top-0 bg-background/80 backdrop-blur-sm -mx-12 -mt-12 px-12 py-6 z-10 border-b border-white/10">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Cálculo de Salários</h3>
              <button onClick={() => setSelectedEmpForSalary(null)} className="text-slate-500 hover:text-white"><X size={32} /></button>
            </div>
            <SalaryCalculatorAngola
              name={selectedEmpForSalary.name}
              role={selectedEmpForSalary.role}
              salarioBase={selectedEmpForSalary.salary}
              workDaysPerMonth={selectedEmpForSalary.workDaysPerMonth}
              dailyWorkHours={selectedEmpForSalary.dailyWorkHours}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;