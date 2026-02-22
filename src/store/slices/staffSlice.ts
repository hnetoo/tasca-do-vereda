import { StateCreator } from 'zustand';
import { Employee, WorkShift, AttendanceRecord, StoreState, UUID } from '../../types';
import { saveEmployeeAction, deleteEmployeeAction } from '@/app/actions/users';
import { saveAttendanceAction } from '@/app/actions';
import { logger } from '../../services/logger';

export interface StaffSlice {
  employees: Employee[];
  workShifts: WorkShift[];
  attendance: AttendanceRecord[];
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  removeEmployee: (id: UUID) => void;
  addWorkShift: (shift: WorkShift) => void;
  removeWorkShift: (id: UUID) => void;
  clockIn: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  clockOut: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => void;
  getEmployeeById: (id: UUID) => Employee | undefined;
  getAttendanceByEmployeeId: (employeeId: UUID) => AttendanceRecord[];
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
    {
      id: 'emp1',
      name: 'António Luanda',
      role: 'GARCOM',
      pin: null,
      phone: '923000001',
      email: null,
      nif: null,
      address: null,
      salary: 150000,
      isActive: true,
      admissionDate: null,
      socialSecurityNumber: null,
      bankAccount: null,
      bi: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      color: '#06b6d4',
      workDaysPerMonth: 22,
      dailyWorkHours: 8,
      externalBioId: 'BIO-001'
    },
    {
      id: 'emp2',
      name: 'Maria Benguela',
      role: 'COZINHA',
      pin: null,
      phone: '923000002',
      email: null,
      nif: null,
      address: null,
      salary: 180000,
      isActive: true,
      admissionDate: null,
      socialSecurityNumber: null,
      bankAccount: null,
      bi: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      color: '#f59e0b',
      workDaysPerMonth: 22,
      dailyWorkHours: 8,
      externalBioId: 'BIO-002'
    },
  ],
  workShifts: [],
  attendance: [],
  
  addEmployee: (emp: Employee) => {
    set((state: StaffSlice) => ({ employees: [...state.employees, emp] }));
    saveEmployeeAction(emp).then(res => {
      if (!res.success) logger.error('Failed to persist new employee to SQL', { id: emp.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist new employee to SQL', { id: emp.id, error: e.message }, 'DATABASE')
    );
  },
  
  updateEmployee: (emp: Employee) => {
    set((state: StaffSlice) => ({
      employees: state.employees.map((e: Employee) => e.id === emp.id ? emp : e)
    }));
    saveEmployeeAction(emp).then(res => {
      if (!res.success) logger.error('Failed to persist updated employee to SQL', { id: emp.id, error: res.error }, 'DATABASE');
    }).catch(e => 
      logger.error('Failed to persist updated employee to SQL', { id: emp.id, error: e.message }, 'DATABASE')
    );
  },
  
  removeEmployee: (id: UUID) => {
    set((state: StaffSlice) => ({
      employees: state.employees.filter((e: Employee) => e.id !== id),
      workShifts: state.workShifts.filter((s: WorkShift) => s.employeeId !== id),
      attendance: state.attendance.filter((a: AttendanceRecord) => a.employeeId !== id)
    }));
    deleteEmployeeAction(id).then(res => {
      if (!res.success) logger.error('Failed to delete employee from SQL', { id, error: res.error }, 'DATABASE');
    }).catch((e: any) => 
      logger.error('Failed to delete employee from SQL', { id, error: e.message }, 'DATABASE')
    );
  },
  
  addWorkShift: (shift: WorkShift) => set((state: StaffSlice) => ({ workShifts: [...state.workShifts, shift] })),
  
  removeWorkShift: (id: UUID) => set((state: StaffSlice) => ({ workShifts: state.workShifts.filter((s: WorkShift) => s.id !== id) })),
  
  getEmployeeById: (id: UUID) => get().employees.find((e: Employee) => e.id === id),
  getAttendanceByEmployeeId: (employeeId: UUID) => get().attendance.filter((a: AttendanceRecord) => a.employeeId === employeeId),
  setEmployees: (employees: Employee[]) => set({ employees }),
  setAttendance: (attendance: AttendanceRecord[]) => set({ attendance }),
  updateAttendance: (record: AttendanceRecord) => set((state: StaffSlice) => ({
    attendance: state.attendance.map((a: AttendanceRecord) => a.id === record.id ? record : a)
  })),

  clockIn: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      date: dateStr,
      createdAt: now,
      clockIn: now,
      clockOut: undefined, // Use undefined for optional properties not yet set
      clockInMethod: method,
      clockOutMethod: undefined,
      totalHours: 0,
      isLate: false,
      lateMinutes: 0,
      overtimeHours: 0,
      isAbsence: false,
      source: method,
      status: 'PRESENT'
    };

    const createdAt = newRecord.createdAt instanceof Date ? newRecord.createdAt : new Date(newRecord.createdAt || now);
    const clockIn = newRecord.clockIn instanceof Date ? newRecord.clockIn : new Date(newRecord.clockIn || now);

    // Create a Supabase-compatible record for persistence
    const supabaseRecord = {
      id: newRecord.id,
      employee_id: newRecord.employeeId,
      date: newRecord.date,
      created_at: createdAt.toISOString(),
      clock_in: clockIn.toISOString(),
      clock_out: null, // Supabase expects null for unset dates
      clock_in_method: newRecord.clockInMethod,
      clock_out_method: null,
      total_hours: newRecord.totalHours,
      is_late: newRecord.isLate,
      late_minutes: newRecord.lateMinutes,
      overtime_hours: newRecord.overtimeHours,
      is_absence: newRecord.isAbsence,
      source: newRecord.source,
      status: newRecord.status
    };

    set((state: StaffSlice) => ({ attendance: [...state.attendance, newRecord] }));
    saveAttendanceAction([supabaseRecord]).then(res => {
      if (!res.success) logger.error('Failed to persist clock-in to SQL', { employeeId, error: res.error }, 'DATABASE');
    }).catch((e: any) => 
      logger.error('Failed to persist clock-in to SQL', { employeeId, error: e.message }, 'DATABASE')
    );
    get().addNotification?.('success', `Entrada registada para funcionário ${employeeId}`);
  },
  
  clockOut: (employeeId: UUID, method: 'PIN' | 'BIOMETRIC' | 'EXTERNO') => {
    // Clock out logic
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const record = get().attendance.find((a: AttendanceRecord) => a.employeeId === employeeId && a.date === dateStr && !a.clockOut);
    if (record) {
      const updated: AttendanceRecord = {
        ...record,
        clockOut: now,
        clockOutMethod: method
      };
      set((state: StaffSlice) => ({
        attendance: state.attendance.map((a: AttendanceRecord) => a.id === updated.id ? updated : a)
      }));
      saveAttendanceAction([updated]).then(res => {
        if (!res.success) logger.error('Failed to persist clock-out to SQL', { employeeId, error: res.error }, 'DATABASE');
      }).catch((e: any) =>
        logger.error('Failed to persist clock-out to SQL', { employeeId, error: e.message }, 'DATABASE')
      );
    }
    get().addNotification?.('success', `Saída registada para funcionário ${employeeId}`);
  }
});
