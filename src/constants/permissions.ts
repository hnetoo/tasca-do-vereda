import { Permission } from '../types';

/**
 * Roles padrão do sistema
 */
export const DEFAULT_ROLES: Record<string, Permission[]> = {
  ADMIN: [
    { id: 'CREATE_ORDER', name: 'Create Order', description: 'Create new orders', module: 'orders', action: 'create' },
    { id: 'EDIT_ORDER', name: 'Edit Order', description: 'Edit existing orders', module: 'orders', action: 'edit' },
    { id: 'DELETE_ORDER', name: 'Delete Order', description: 'Delete orders', module: 'orders', action: 'delete' },
    { id: 'PAY_ORDER', name: 'Pay Order', description: 'Process payments', module: 'orders', action: 'pay' },
    { id: 'VIEW_FINANCIAL', name: 'View Financial', description: 'View financial reports', module: 'financial', action: 'view' },
    { id: 'MANAGE_USERS', name: 'Manage Users', description: 'Manage user accounts', module: 'users', action: 'manage' },
    { id: 'MANAGE_INVENTORY', name: 'Manage Inventory', description: 'Manage inventory', module: 'inventory', action: 'manage' },
    { id: 'MANAGE_DELIVERIES', name: 'Manage Deliveries', description: 'Manage deliveries', module: 'deliveries', action: 'manage' },
    { id: 'VIEW_KITCHEN', name: 'View Kitchen', description: 'View kitchen display', module: 'kitchen', action: 'view' },
    { id: 'PRINT_BILL', name: 'Print Bill', description: 'Print bills', module: 'billing', action: 'print' },
    { id: 'APPLY_DISCOUNT', name: 'Apply Discount', description: 'Apply discounts', module: 'orders', action: 'discount' },
    { id: 'ACCESS_REPORTS', name: 'Access Reports', description: 'Access reports', module: 'reports', action: 'access' },
    { id: 'MANAGE_TABLES', name: 'Manage Tables', description: 'Manage restaurant tables', module: 'tables', action: 'manage' },
    { id: 'MANAGE_RESERVATIONS', name: 'Manage Reservations', description: 'Manage reservations', module: 'reservations', action: 'manage' },
    { id: 'MANAGE_EMPLOYEES', name: 'Manage Employees', description: 'Manage employees', module: 'employees', action: 'manage' },
    { id: 'QR_MENU_CONFIG', name: 'QR Menu Config', description: 'Configure QR menu', module: 'menu', action: 'configure' },
    { id: 'BIOMETRIC_SYNC', name: 'Biometric Sync', description: 'Sync biometric data', module: 'biometric', action: 'sync' },
    { id: 'EXPORT_DATA', name: 'Export Data', description: 'Export system data', module: 'data', action: 'export' },
    { id: 'VIEW_SYSTEM_HEALTH', name: 'View System Health', description: 'View system health', module: 'system', action: 'view' },
    { id: 'CLOSE_SHIFT', name: 'Close Shift', description: 'Close cash register shift', module: 'shift', action: 'close' },
    { id: 'CORRECT_PAYMENT_PRE_PRINT', name: 'Correct Payment Pre Print', description: 'Correct payment before printing', module: 'payment', action: 'correct_pre' },
    { id: 'CORRECT_PAYMENT_POST_PRINT', name: 'Correct Payment Post Print', description: 'Correct payment after printing', module: 'payment', action: 'correct_post' }
  ],
  CAIXA: [
    { id: 'CREATE_ORDER', name: 'Create Order', description: 'Create new orders', module: 'orders', action: 'create' },
    { id: 'EDIT_ORDER', name: 'Edit Order', description: 'Edit existing orders', module: 'orders', action: 'edit' },
    { id: 'PAY_ORDER', name: 'Pay Order', description: 'Process payments', module: 'orders', action: 'pay' },
    { id: 'VIEW_FINANCIAL', name: 'View Financial', description: 'View financial reports', module: 'financial', action: 'view' },
    { id: 'MANAGE_DELIVERIES', name: 'Manage Deliveries', description: 'Manage deliveries', module: 'deliveries', action: 'manage' },
    { id: 'PRINT_BILL', name: 'Print Bill', description: 'Print bills', module: 'billing', action: 'print' },
    { id: 'APPLY_DISCOUNT', name: 'Apply Discount', description: 'Apply discounts', module: 'orders', action: 'discount' },
    { id: 'MANAGE_TABLES', name: 'Manage Tables', description: 'Manage restaurant tables', module: 'tables', action: 'manage' },
    { id: 'MANAGE_RESERVATIONS', name: 'Manage Reservations', description: 'Manage reservations', module: 'reservations', action: 'manage' },
    { id: 'CLOSE_SHIFT', name: 'Close Shift', description: 'Close cash register shift', module: 'shift', action: 'close' }
  ],
  GARCOM: [
    { id: 'CREATE_ORDER', name: 'Create Order', description: 'Create new orders', module: 'orders', action: 'create' },
    { id: 'EDIT_ORDER', name: 'Edit Order', description: 'Edit existing orders', module: 'orders', action: 'edit' },
    { id: 'PRINT_BILL', name: 'Print Bill', description: 'Print bills', module: 'billing', action: 'print' },
    { id: 'MANAGE_TABLES', name: 'Manage Tables', description: 'Manage restaurant tables', module: 'tables', action: 'manage' },
    { id: 'MANAGE_RESERVATIONS', name: 'Manage Reservations', description: 'Manage reservations', module: 'reservations', action: 'manage' }
  ],
  COZINHA: [
    { id: 'VIEW_KITCHEN', name: 'View Kitchen', description: 'View kitchen display', module: 'kitchen', action: 'view' },
    { id: 'ACCESS_REPORTS', name: 'Access Reports', description: 'Access reports', module: 'reports', action: 'access' }
  ]
};

/**
 * Descrições das permissões
 */
export const permissionDescriptions: Record<string, string> = {
  CREATE_ORDER: 'Criar novas encomendas/mesas',
  EDIT_ORDER: 'Editar encomendas existentes',
  DELETE_ORDER: 'Eliminar encomendas',
  PAY_ORDER: 'Processar pagamentos',
  VIEW_FINANCIAL: 'Ver dados financeiros',
  MANAGE_USERS: 'Criar, editar e eliminar utilizadores',
  MANAGE_INVENTORY: 'Gerenciar inventário e produtos',
  VIEW_KITCHEN: 'Acesso ao KDS (Kitchen Display System)',
  PRINT_BILL: 'Imprimir contas/recibos',
  APPLY_DISCOUNT: 'Aplicar descontos em encomendas',
  ACCESS_REPORTS: 'Ver relatórios e análises',
  MANAGE_TABLES: 'Gerenciar mesas e layout',
  MANAGE_RESERVATIONS: 'Gerenciar reservas',
  MANAGE_EMPLOYEES: 'Gerenciar dados de funcionários',
  MANAGE_DELIVERIES: 'Gerenciar encomendas e entregas',
  QR_MENU_CONFIG: 'Configurar QR Code menu digital',
  BIOMETRIC_SYNC: 'Sincronizar sistemas biométricos',
  EXPORT_DATA: 'Exportar dados do sistema',
  VIEW_SYSTEM_HEALTH: 'Visualizar estado de saúde do sistema',
  CLOSE_SHIFT: 'Realizar fecho de caixa',
  CORRECT_PAYMENT_PRE_PRINT: 'Corrigir pagamentos antes da impressão',
  CORRECT_PAYMENT_POST_PRINT: 'Corrigir pagamentos após a impressão'
};
