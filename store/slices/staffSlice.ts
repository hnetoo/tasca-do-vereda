import { StateCreator } from 'zustand';
import { Employee, WorkShift, AttendanceRecord, StoreState } from '../../types';
import { databaseOperations } from '../../services/database/operations';
import { logger } from '../../services/logger';

export interface StaffSlice {
  employees: Employee[];
  workShifts: WorkShift[];
  attendance: AttendanceRecord[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  removeEmployee: (id: string) => void;
  addWorkShift: (shift: WorkShift) => void;
  removeWorkShift: (id: string) => void;
  clockIn: (employeeId: string, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  clockOut: (employeeId: string, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  getEmployeeById: (id: string) => Employee | undefined;
  getAttendanceByEmployeeId: (employeeId: string) => AttendanceRecord[];
  setEmployees: (employees: Employee[]) => void;
  setAttendance: (attendance: AttendanceRecord[]) => void;
  updateAttendance: (record: AttendanceRecord) => void;
}

export const createStaffSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  StaffSlice
> = (set, get) => ({
  employees: [
    { id: 'emp1', name: 'António Luanda', role: 'GARCOM', phone: '923000001', salary: 150000, status: 'ATIVO', color: '#06b6d4', workDaysPerMonth: 22, dailyWorkHours: 8, externalBioId: 'BIO-001' },
    { id: 'emp2', name: 'Maria Benguela', role: 'COZINHA', phone: '923000002', salary: 180000, status: 'ATIVO', color: '#f59e0b', workDaysPerMonth: 22, dailyWorkHours: 8, externalBioId: 'BIO-002' },
  ],
  workShifts: [],
  attendance: [],
  
  addEmployee: (emp) => {
    set((state) => ({ employees: [...state.employees, emp] }));
    databaseOperations.saveEmployees([emp]).catch(e => 
      logger.error('Failed to persist new employee to SQL', { id: emp.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateEmployee: (emp) => {
    set((state) => ({
      employees: state.employees.map((e) => e.id === emp.id ? emp : e)
    }));
    databaseOperations.saveEmployees([emp]).catch(e => 
      logger.error('Failed to persist updated employee to SQL', { id: emp.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
      workShifts: state.workShifts.filter((s) => s.employeeId !== id),
      attendance: state.attendance.filter((a) => a.employeeId !== id)
    }));
    databaseOperations.deleteEmployee(id).catch(e => 
      logger.error('Failed to delete employee from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addWorkShift: (shift) => set((state) => ({ workShifts: [...state.workShifts, shift] })),
  
  removeWorkShift: (id) => set((state) => ({ workShifts: state.workShifts.filter((s) => s.id !== id) })),
  
  getEmployeeById: (id) => get().employees.find(e => e.id === id),
  getAttendanceByEmployeeId: (employeeId) => get().attendance.filter(a => a.employeeId === employeeId),
  setEmployees: (employees) => set({ employees }),
  setAttendance: (attendance) => set({ attendance }),
  updateAttendance: (record) => set((state) => ({
    attendance: state.attendance.map(a => a.id === record.id ? record : a)
  })),

  clockIn: (employeeId, method) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      date: dateStr,
      clockIn: now.toISOString(),
      clockInMethod: method,
      totalHours: 0,
      isLate: false,
      lateMinutes: 0,
      overtimeHours: 0,
      isAbsence: false,
      source: method,
      status: 'PRESENT'
    };
    set((state) => ({ attendance: [...state.attendance, newRecord] }));
    databaseOperations.saveAttendance([newRecord]).catch(e => 
      logger.error('Failed to persist clock-in to SQL', { employeeId, error: e.message }, 'DATABASE')
    );
    get().addNotification?.('success', `Entrada registada para funcionário ${employeeId}`);
  },
  
  clockOut: (employeeId, method) => {
    // Clock out logic
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const record = get().attendance.find(a => a.employeeId === employeeId && a.date === dateStr && !a.clockOut);
    if (record) {
      const updated: AttendanceRecord = {
        ...record,
        clockOut: now.toISOString(),
        clockOutMethod: method
      };
      set((state) => ({
        attendance: state.attendance.map(a => a.id === updated.id ? updated : a)
      }));
      databaseOperations.saveAttendance([updated]).catch(e =>
        logger.error('Failed to persist clock-out to SQL', { employeeId, error: e.message }, 'DATABASE')
      );
    }
    get().addNotification?.('success', `Saída registada para funcionário ${employeeId}`);
  }
});
