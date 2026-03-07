import { StateCreator } from 'zustand';
import { Employee, WorkShift, AttendanceRecord, StoreState } from '@/types';
import { logger } from '@/services/logger';
import { integrationAPIService } from '@/services/integrationAPIService';

export interface StaffSlice {
  employees: Employee[];
  workShifts: WorkShift[];
  attendance: AttendanceRecord[];
  
  addEmployee: (emp: Employee) => void;
  updateEmployee: (emp: Employee) => void;
  removeEmployee: (id: string) => void;
  
  addWorkShift: (shift: WorkShift) => void;
  updateWorkShift: (shift: WorkShift) => void;
  removeWorkShift: (id: string) => void;
  
  addAttendance: (record: AttendanceRecord) => void;
  updateAttendance: (record: AttendanceRecord) => void;
  removeAttendance: (id: string) => void;
}

export const createStaffSlice: StateCreator<StoreState, [], [], StaffSlice> = (set, get) => ({
  employees: [
    {
      id: 'emp-001',
      name: 'João Silva',
      role: 'waiter',
      position: 'Garçom',
      department: 'Salão',
      email: 'joao@tasca.com',
      phone: '+244 923 456 789',
      salary: 150000,
      status: 'active',
      hireDate: '2023-01-15',
      workSchedule: 'full-time',
      address: 'Luanda, Angola',
      emergencyContact: 'Maria Silva - +244 923 456 788',
      color: '#3b82f6',
      workDaysPerMonth: 22,
      dailyWorkHours: 8,
      externalBioId: 'BIO-001'
    },
    {
      id: 'emp-002',
      name: 'Ana Santos',
      role: 'chef',
      position: 'Cozinheira',
      department: 'Cozinha',
      email: 'ana@tasca.com',
      phone: '+244 923 456 790',
      salary: 180000,
      status: 'active',
      hireDate: '2023-02-01',
      workSchedule: 'full-time',
      address: 'Luanda, Angola',
      emergencyContact: 'José Santos - +244 923 456 791',
      color: '#f59e0b',
      workDaysPerMonth: 22,
      dailyWorkHours: 8,
      externalBioId: 'BIO-002'
    },
  ],
  workShifts: [],
  attendance: [],
  
  addEmployee: (emp: Employee) => {
    set((state) => ({ employees: [...state.employees, emp] }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Employee added locally', { id: emp.id }, 'STAFF');
  },

  updateEmployee: (emp: Employee) => {
    set((state) => ({
      employees: state.employees.map((e) => e.id === emp.id ? emp : e),
    }));
    
    // TODO: Implementar sync com Supabase quando método estiver disponível
    logger.info('Employee updated locally', { id: emp.id }, 'STAFF');
  },

  removeEmployee: (id: string) => {
    set((state) => ({
      employees: state.employees.filter((e) => e.id !== id),
    }));
    
    // TODO: Implementar remoção do Supabase quando método estiver disponível
    logger.info('Employee removed locally', { id }, 'STAFF');
  },

  addWorkShift: (shift: WorkShift) => {
    set((state) => ({ workShifts: [...state.workShifts, shift] }));
    logger.info('Work shift added', { id: shift.id }, 'STAFF');
  },

  updateWorkShift: (shift: WorkShift) => {
    set((state) => ({
      workShifts: state.workShifts.map((s) => s.id === shift.id ? shift : s),
    }));
    logger.info('Work shift updated', { id: shift.id }, 'STAFF');
  },

  removeWorkShift: (id: string) => {
    set((state) => ({
      workShifts: state.workShifts.filter((s) => s.id !== id),
    }));
    logger.info('Work shift removed', { id }, 'STAFF');
  },

  addAttendance: (record: AttendanceRecord) => {
    set((state) => ({ attendance: [...state.attendance, record] }));
    logger.info('Attendance record added', { id: record.id }, 'STAFF');
  },

  updateAttendance: (record: AttendanceRecord) => {
    set((state) => ({
      attendance: state.attendance.map((a) => a.id === record.id ? record : a),
    }));
    logger.info('Attendance record updated', { id: record.id }, 'STAFF');
  },

  removeAttendance: (id: string) => {
    set((state) => ({
      attendance: state.attendance.filter((a) => a.id !== id),
    }));
    logger.info('Attendance record removed', { id }, 'STAFF');
  },
});
