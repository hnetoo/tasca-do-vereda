/**
 * Sistema Avançado de Permissões
 * Controlo detalhado de acesso baseado em roles dinâmicas e features
 */

import { UserRole, Permission, CustomRole } from '../types';
import { DEFAULT_ROLES, permissionDescriptions } from '../constants/permissions';

/**
 * Obter permissões de um role (padrão ou customizado) ou utilizador específico
 */
export const getPermissions = (role: UserRole, customRoles?: CustomRole[], userPermissions?: Permission[]): Permission[] => {
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
export const hasPermission = (role: UserRole, permission: Permission, customRoles?: CustomRole[], userPermissions?: Permission[]): boolean => {
  const permissions = getPermissions(role, customRoles, userPermissions);
  return permissions.includes(permission);
};

/**
 * Verificar se role pode executar ação em order
 */
export const canManageOrder = (role: UserRole, action: 'create' | 'edit' | 'delete' | 'pay', customRoles?: CustomRole[], userPermissions?: Permission[]): boolean => {
  const permissionMap: Record<string, Permission> = {
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
export const canAccessModule = (role: UserRole, module: 'pos' | 'kitchen' | 'finance' | 'users' | 'inventory', customRoles?: CustomRole[], userPermissions?: Permission[]): boolean => {
  const modulePermissions: Record<string, Permission> = {
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
export const featureRequiresPermission: Record<string, Permission> = {
  'discounts': 'APPLY_DISCOUNT',
  'delete-orders': 'DELETE_ORDER',
  'reports': 'ACCESS_REPORTS',
  'export': 'EXPORT_DATA',
  'biometric': 'BIOMETRIC_SYNC'
};

/**
 * Verificar se role pode usar feature
 */
export const canUseFeature = (role: UserRole, feature: string, customRoles?: CustomRole[], userPermissions?: Permission[]): boolean => {
  const requiredPermission = featureRequiresPermission[feature];
  if (!requiredPermission) return true; // Feature aberta por padrão
  return hasPermission(role, requiredPermission, customRoles, userPermissions);
};

/**
 * Todas as permissões disponíveis
 */
export const ALL_PERMISSIONS: Permission[] = [
  'CREATE_ORDER',
  'EDIT_ORDER',
  'DELETE_ORDER',
  'PAY_ORDER',
  'VIEW_FINANCIAL',
  'MANAGE_USERS',
  'MANAGE_INVENTORY',
  'VIEW_KITCHEN',
  'PRINT_BILL',
  'APPLY_DISCOUNT',
  'ACCESS_REPORTS',
  'MANAGE_TABLES',
  'MANAGE_RESERVATIONS',
  'MANAGE_EMPLOYEES',
  'MANAGE_DELIVERIES',
  'QR_MENU_CONFIG',
  'BIOMETRIC_SYNC',
  'EXPORT_DATA',
  'CLOSE_SHIFT',
  'CORRECT_PAYMENT_PRE_PRINT',
  'CORRECT_PAYMENT_POST_PRINT'
];
