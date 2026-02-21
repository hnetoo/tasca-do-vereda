import { Product, Table, Customer, Reservation, StockItem, User, MenuCategory, Dish } from '@/types';
import { Grid3X3, Coffee, Pizza, Beer, IceCream, Utensils } from 'lucide-react';

// Icons available for categories
export const AVAILABLE_ICONS = [
  { name: 'Grid3X3', label: 'Geral', icon: Grid3X3 },
  { name: 'Coffee', label: 'Pequeno Almoço/Bebidas Quentes', icon: Coffee },
  { name: 'Pizza', label: 'Pratos Principais', icon: Pizza },
  { name: 'Beer', label: 'Bebidas Alcoólicas', icon: Beer },
  { name: 'IceCream', label: 'Sobremesas', icon: IceCream },
  { name: 'Utensils', label: 'Talheres', icon: Utensils },
];

// Usuários do Sistema
export const MOCK_USERS: User[] = [
  { id: '1', name: 'Gerente (Admin)', role: 'ADMIN', pin: '1234', active: true },
  { id: '2', name: 'Operador de Caixa', role: 'CAIXA', pin: '1111', active: true },
  { id: '3', name: 'Chefe de Cozinha', role: 'COZINHEIRO', pin: '2222', active: true },
  { id: '4', name: 'Garçom', role: 'GARCOM', pin: '3333', active: true },
  { id: '5', name: 'Proprietário', role: 'OWNER', pin: '2775', active: true },
];

// Categorias Iniciais
export const MOCK_CATEGORIES: MenuCategory[] = [];

// Cardápio Autêntico Angolano
export const MOCK_MENU: Dish[] = [];

// Estoque Inicial
export const MOCK_STOCK: StockItem[] = [
  { 
    id: '1', 
    name: 'Arroz Branco', 
    quantity: 25, 
    unit: 'kg', 
    min_threshold: 10, 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as unknown as StockItem,
  { 
    id: '2', 
    name: 'Fuba de Bombó', 
    quantity: 30, 
    unit: 'kg', 
    min_threshold: 10, 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as unknown as StockItem,
];

// Mesas
export const MOCK_TABLES: Table[] = [
  {
    id: '999',
    name: 'Balcão',
    seats: 100,
    status: 'AVAILABLE' as const,
    x: 0,
    y: 0,
    zone: 'INTERIOR' as const,
    shape: 'RECTANGLE' as const,
    rotation: 0,
    number: 999,
    is_active: true,
    color: null,
    created_at: null,
    group_id: null,
    height: null,
    label: null,
    updated_at: null,
    user_id: null,
    width: null,
  },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    name: `Mesa ${i + 1}`,
    seats: 4,
    status: 'AVAILABLE' as const,
    x: i % 4,
    y: Math.floor(i / 4),
    zone: 'INTERIOR' as const,
    shape: 'SQUARE' as const,
    rotation: 0,
    number: i + 1,
    is_active: true,
    color: null,
    created_at: null,
    group_id: null,
    height: null,
    label: null,
    updated_at: null,
    user_id: null,
    width: null,
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
