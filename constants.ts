
import { Dish, Table, Customer, Reservation, StockItem, User, MenuCategory } from './types';

// Usuários do Sistema
export const MOCK_USERS: User[] = [
  { id: '1', name: 'Gerente (Admin)', role: 'ADMIN', pin: '1234' },
  { id: '2', name: 'Operador de Caixa', role: 'CAIXA', pin: '1111' },
  { id: '3', name: 'Chefe de Cozinha', role: 'COZINHA', pin: '2222' },
  { id: '4', name: 'Garçom', role: 'GARCOM', pin: '3333' },
];

// Categorias Iniciais
export const MOCK_CATEGORIES: MenuCategory[] = [];

// Cardápio Autêntico Angolano
export const MOCK_MENU: Dish[] = [];

// Estoque Inicial
export const MOCK_STOCK: StockItem[] = [
  { id: '1', name: 'Arroz Branco', quantity: 25, unit: 'kg', minThreshold: 10 },
  { id: '2', name: 'Fuba de Bombó', quantity: 30, unit: 'kg', minThreshold: 10 },
];

// Mesas
export const MOCK_TABLES: Table[] = [
  {
    id: 999,
    name: 'Balcão',
    seats: 100,
    status: 'LIVRE' as const,
    x: 0,
    y: 0,
    zone: 'INTERIOR' as const,
    shape: 'RECTANGLE' as const,
    rotation: 0,
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Mesa ${i + 1}`,
    seats: 4,
    status: 'LIVRE' as const,
    x: i % 4,
    y: Math.floor(i / 4),
    zone: 'INTERIOR' as const,
    shape: 'SQUARE' as const,
    rotation: 0,
  })),
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'João Silva',
    phone: '923123456',
    nif: '123456789',
    points: 150,
    balance: 2500.50,
    visits: 5,
    lastVisit: new Date('2026-01-20T10:00:00Z'),
  },
  {
    id: 'cust-2',
    name: 'Maria Santos',
    phone: '912987654',
    nif: '987654321',
    points: 300,
    balance: -1000.00, // Debito
    visits: 10,
    lastVisit: new Date('2026-01-25T14:30:00Z'),
  },
  {
    id: 'cust-3',
    name: 'Pedro Costa',
    phone: '930112233',
    nif: '112233445',
    points: 50,
    balance: 0,
    visits: 2,
    lastVisit: new Date('2026-01-18T18:45:00Z'),
  },
];
export const MOCK_RESERVATIONS: Reservation[] = [];
