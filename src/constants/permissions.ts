import { Permission } from '../types';

/**
 * Roles padrão do sistema
 */
export const DEFAULT_ROLES: Record<string, Permission[]> = {
  ADMIN: [
    'CREATE_ORDER',
    'EDIT_ORDER',
    'DELETE_ORDER',
    'PAY_ORDER',
    'VIEW_FINANCIAL',
    'MANAGE_USERS',
    'MANAGE_INVENTORY',
    'MANAGE_DELIVERIES',
    'VIEW_KITCHEN',
    'PRINT_BILL',
    'APPLY_DISCOUNT',
    'ACCESS_REPORTS',
    'MANAGE_TABLES',
    'MANAGE_RESERVATIONS',
    'MANAGE_EMPLOYEES',
    'QR_MENU_CONFIG',
    'BIOMETRIC_SYNC',
    'EXPORT_DATA',
    'VIEW_SYSTEM_HEALTH',
    'CLOSE_SHIFT'
  ],
  CAIXA: [
    'CREATE_ORDER',
    'EDIT_ORDER',
    'PAY_ORDER',
    'VIEW_FINANCIAL',
    'MANAGE_DELIVERIES',
    'PRINT_BILL',
    'APPLY_DISCOUNT',
    'MANAGE_TABLES',
    'MANAGE_RESERVATIONS',
    'CLOSE_SHIFT'
  ],
  GARCOM: [
    'CREATE_ORDER',
    'EDIT_ORDER',
    'PRINT_BILL',
    'MANAGE_TABLES',
    'MANAGE_RESERVATIONS'
  ],
  COZINHA: [
    'VIEW_KITCHEN',
    'ACCESS_REPORTS'
  ]
};

/**
 * Descrições das permissões
 */
export const permissionDescriptions: Record<Permission, string> = {
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
