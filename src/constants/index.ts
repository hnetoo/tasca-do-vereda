import { Employee } from '@/types';


export const LOCAL_STORAGE_SCHEMA_VERSION = 2;

// Usuários do Sistema
export const MOCK_USERS: Employee[] = [
  { id: '1', name: 'Gerente (Admin)', role: 'ADMIN', pin: '1234', active: true },
  { id: '2', name: 'Operador de Caixa', role: 'CAIXA', pin: '1111', active: true },
  { id: '3', name: 'Chefe de Cozinha', role: 'COZINHEIRO', pin: '2222', active: true },
  { id: '4', name: 'Garçom', role: 'GARCOM', pin: '3333', active: true },
  { id: '5', name: 'Proprietário', role: 'OWNER', pin: '2775', active: true },
];
