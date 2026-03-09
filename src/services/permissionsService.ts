/**
 * Sistema Avançado de Permissões
 * Controlo detalhado de acesso baseado em roles dinâmicas e features
 */

import { Permission } from '../types';
import { DEFAULT_ROLES, permissionDescriptions } from '../constants/permissions';

/**
 * Obter permissões de um role (padrão ou customizado) ou utilizador específico
 */
export const getPermissions = (role: string, customRoles?: any[], userPermissions?: Permission[]): Permission[] => {
  // Se o utilizador tem permissões específicas definidas, estas têm prioridade
  if (userPermissions && userPermissions.length > 0) {
    return userPermissions;
  }

  // Verificar se é um role customizado
  if (customRoles) {
    const customRole = customRoles.find(r => r.id === role || r.name === role);
    if (customRole) {
      return customRole.permissions;
    }
  }
  
  // Verificar roles padrão
  return DEFAULT_ROLES[role] ?? [];
};

/**
 * Verificar se utilizador tem permissão específica
 */
export const hasPermission = (role: string, permission: Permission | string, customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const permissions = getPermissions(role, customRoles, userPermissions);
  return permissions.some(p => typeof p === 'string' ? p === permission : p.id === permission);
};

export const hasAnyPermission = (role: string, requiredPermissions: (Permission | string)[], customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const permissions = getPermissions(role, customRoles, userPermissions);
  return requiredPermissions.some(permission => 
    permissions.some(p => typeof p === 'string' ? p === permission : p.id === permission)
  );
};

export const hasAllPermissions = (role: string, requiredPermissions: (Permission | string)[], customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const permissions = getPermissions(role, customRoles, userPermissions);
  return requiredPermissions.every(permission => 
    permissions.some(p => typeof p === 'string' ? p === permission : p.id === permission)
  );
};

/**
 * Verificar se role pode executar ação em order
 */
export const canManageOrder = (role: string, action: 'create' | 'edit' | 'delete' | 'pay', customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const permissionMap: Record<string, string> = {
    create: 'CREATE_ORDER',
    edit: 'EDIT_ORDER',
    delete: 'DELETE_ORDER',
    pay: 'PAY_ORDER'
  };
  return hasPermission(role, permissionMap[action], customRoles, userPermissions);
};

/**
 * Verificar acesso a módulo
 */
export const canAccessModule = (role: string, module: 'pos' | 'kitchen' | 'finance' | 'users' | 'inventory', customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const modulePermissions: Record<string, string> = {
    pos: 'CREATE_ORDER',
    kitchen: 'VIEW_KITCHEN',
    finance: 'VIEW_FINANCIAL',
    users: 'MANAGE_USERS',
    inventory: 'MANAGE_INVENTORY'
  };
  return hasPermission(role, modulePermissions[module], customRoles, userPermissions);
};

/**
 * Permissões por feature (para habilitar/desabilitar features)
 */
export const featureRequiresPermission: Record<string, string> = {
  'discounts': 'APPLY_DISCOUNT',
  'delete-orders': 'DELETE_ORDER',
  'reports': 'ACCESS_REPORTS',
  'export': 'EXPORT_DATA',
  'biometric': 'BIOMETRIC_SYNC'
};

export const canUseFeature = (role: string, feature: string, customRoles?: any[], userPermissions?: Permission[]): boolean => {
  const requiredPermission = featureRequiresPermission[feature];
  if (!requiredPermission) return true; // Feature aberta por padrão
  return hasPermission(role, requiredPermission, customRoles, userPermissions);
};

/**
 * Todas as permissões disponíveis
 */
export const ALL_PERMISSIONS: Permission[] = [
  { id: 'CREATE_ORDER', name: 'Create Order', description: 'Create new orders', module: 'orders', action: 'create' },
  { id: 'EDIT_ORDER', name: 'Edit Order', description: 'Edit existing orders', module: 'orders', action: 'edit' },
  { id: 'DELETE_ORDER', name: 'Delete Order', description: 'Delete orders', module: 'orders', action: 'delete' },
  { id: 'PAY_ORDER', name: 'Pay Order', description: 'Process payments', module: 'orders', action: 'pay' },
  { id: 'VIEW_FINANCIAL', name: 'View Financial', description: 'View financial reports', module: 'financial', action: 'view' },
  { id: 'MANAGE_USERS', name: 'Manage Users', description: 'Manage user accounts', module: 'users', action: 'manage' },
  { id: 'MANAGE_INVENTORY', name: 'Manage Inventory', description: 'Manage inventory', module: 'inventory', action: 'manage' },
  { id: 'VIEW_KITCHEN', name: 'View Kitchen', description: 'View kitchen display', module: 'kitchen', action: 'view' },
  { id: 'PRINT_BILL', name: 'Print Bill', description: 'Print bills', module: 'billing', action: 'print' },
  { id: 'APPLY_DISCOUNT', name: 'Apply Discount', description: 'Apply discounts', module: 'orders', action: 'discount' },
  { id: 'ACCESS_REPORTS', name: 'Access Reports', description: 'Access reports', module: 'reports', action: 'access' },
  { id: 'MANAGE_TABLES', name: 'Manage Tables', description: 'Manage restaurant tables', module: 'tables', action: 'manage' },
  { id: 'MANAGE_RESERVATIONS', name: 'Manage Reservations', description: 'Manage reservations', module: 'reservations', action: 'manage' },
  { id: 'MANAGE_EMPLOYEES', name: 'Manage Employees', description: 'Manage employees', module: 'employees', action: 'manage' },
  { id: 'MANAGE_DELIVERIES', name: 'Manage Deliveries', description: 'Manage deliveries', module: 'deliveries', action: 'manage' },
  { id: 'QR_MENU_CONFIG', name: 'QR Menu Config', description: 'Configure QR menu', module: 'menu', action: 'configure' },
  { id: 'BIOMETRIC_SYNC', name: 'Biometric Sync', description: 'Sync biometric data', module: 'biometric', action: 'sync' },
  { id: 'EXPORT_DATA', name: 'Export Data', description: 'Export system data', module: 'data', action: 'export' },
  { id: 'CLOSE_SHIFT', name: 'Close Shift', description: 'Close cash register shift', module: 'shift', action: 'close' },
  { id: 'CORRECT_PAYMENT_PRE_PRINT', name: 'Correct Payment Pre Print', description: 'Correct payment before printing', module: 'payment', action: 'correct_pre' },
  { id: 'CORRECT_PAYMENT_POST_PRINT', name: 'Correct Payment Post Print', description: 'Correct payment after printing', module: 'payment', action: 'correct_post' }
];
