'use client';

import React, { useState } from 'react';
import { X, User, Briefcase, Phone, DollarSign, Mail, Calendar, Hash, Banknote, IdCard, Palette, Clock } from 'lucide-react';
import { Employee } from '@/types';
import { useStore } from '@/store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ROLES } from '@/constants/permissions';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const createDefaultEmployee = (): Employee => ({
  id: uuidv4(),
  name: '',
  role: 'GARCOM',
  pin: null,
  phone: '',
  email: null,
  nif: null,
  address: null,
  salary: 0,
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
  externalBioId: null,
  lastUpdated: new Date().toISOString(),
});

interface EmployeeModalContentProps {
  employee: Employee | null;
  onClose: () => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  roles: { id: string; name: string }[];
}

const EmployeeModalContent: React.FC<EmployeeModalContentProps> = ({ employee, onClose, addEmployee, updateEmployee, roles }) => {
  const [formData, setFormData] = useState<Employee>(() => (employee ? { ...employee } : createDefaultEmployee()));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    if (employee) {
      updateEmployee(formData);
    } else {
      addEmployee(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-2xl text-white max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User size={20} className="text-primary" />
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <User size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-400 mb-1">Cargo</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Briefcase size={18} className="text-slate-500 ml-3" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-400 mb-1">Telefone</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Phone size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Salary */}
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-slate-400 mb-1">Salário</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <DollarSign size={18} className="text-slate-500 ml-3" />
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary ?? ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Mail size={18} className="text-slate-500 ml-3" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Admission Date */}
          <div>
            <label htmlFor="admissionDate" className="block text-sm font-medium text-slate-400 mb-1">Data de Admissão</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Calendar size={18} className="text-slate-500 ml-3" />
              <input
                type="date"
                id="admissionDate"
                name="admissionDate"
                value={formData.admissionDate ? new Date(formData.admissionDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: new Date(e.target.value) }))}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* NIF */}
          <div>
            <label htmlFor="nif" className="block text-sm font-medium text-slate-400 mb-1">NIF</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Hash size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="nif"
                name="nif"
                value={formData.nif || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Social Security Number */}
          <div>
            <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-slate-400 mb-1">Nº Segurança Social</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Hash size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="socialSecurityNumber"
                name="socialSecurityNumber"
                value={formData.socialSecurityNumber || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label htmlFor="bankAccount" className="block text-sm font-medium text-slate-400 mb-1">Conta Bancária</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Banknote size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="bankAccount"
                name="bankAccount"
                value={formData.bankAccount || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* BI */}
          <div>
            <label htmlFor="bi" className="block text-sm font-medium text-slate-400 mb-1">BI</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <IdCard size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="bi"
                name="bi"
                value={formData.bi || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-slate-400 mb-1">Cor</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Palette size={18} className="text-slate-500 ml-3" />
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color || '#06b6d4'}
                onChange={handleChange}
                className="flex-1 h-10 p-1 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Work Days Per Month */}
          <div>
            <label htmlFor="workDaysPerMonth" className="block text-sm font-medium text-slate-400 mb-1">Dias de Trabalho por Mês</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Calendar size={18} className="text-slate-500 ml-3" />
              <input
                type="number"
                id="workDaysPerMonth"
                name="workDaysPerMonth"
                value={formData.workDaysPerMonth ?? ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Daily Work Hours */}
          <div>
            <label htmlFor="dailyWorkHours" className="block text-sm font-medium text-slate-400 mb-1">Horas de Trabalho Diárias</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <Clock size={18} className="text-slate-500 ml-3" />
              <input
                type="number"
                id="dailyWorkHours"
                name="dailyWorkHours"
                value={formData.dailyWorkHours ?? ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* External Bio ID */}
          <div>
            <label htmlFor="externalBioId" className="block text-sm font-medium text-slate-400 mb-1">ID Biométrico Externo</label>
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
              <IdCard size={18} className="text-slate-500 ml-3" />
              <input
                type="text"
                id="externalBioId"
                name="externalBioId"
                value={formData.externalBioId || ''}
                onChange={handleChange}
                className="flex-1 p-2.5 bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {employee ? 'Guardar Alterações' : 'Adicionar Funcionário'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const { addEmployee, updateEmployee } = useStore();
  const roles = Object.keys(DEFAULT_ROLES).map(role => ({ id: role, name: role }));

  if (!isOpen) return null;

  return (
    <EmployeeModalContent
      key={employee?.id ?? 'new'}
      employee={employee}
      onClose={onClose}
      addEmployee={addEmployee}
      updateEmployee={updateEmployee}
      roles={roles}
    />
  );
};

export default EmployeeModal;
