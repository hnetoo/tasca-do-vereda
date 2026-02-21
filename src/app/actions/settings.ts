
import { executeQuery } from '@/services/database/operations';
import { dbConfig } from '@/services/database/config';
import { logger } from '@/services/logger';
import { integrationAPIService } from '@/services/integrationAPIService';
import { disasterRecoveryService } from '@/services/disasterRecoveryService';
import { SystemSettings, MenuCategory, Product, FullApplicationState } from '@/types';
import { BackupMetadata } from '@/services/integrationAPIService';

export async function clearMenuAction(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Iniciando limpeza do menu (Categorias e Pratos)...', null, 'DATABASE_RESET');
    await executeQuery('DELETE FROM dishes');
    await executeQuery('DELETE FROM menu_categories');
    
    logger.info('Limpeza do menu concluída com sucesso.', null, 'DATABASE_RESET');
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao limpar menu', { error: error.message }, 'DATABASE_RESET');
    return { success: false, error: error.message };
  }
}

export async function clearAllDataAction(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Iniciando limpeza completa de dados...', null, 'DATABASE_RESET');
    await executeQuery('DELETE FROM settings');
    await executeQuery('DELETE FROM users');
    await executeQuery('DELETE FROM dishes');
    await executeQuery('DELETE FROM menu_categories'); // Updated from categories
    await executeQuery('DELETE FROM orders');
    await executeQuery('DELETE FROM order_items');
    await executeQuery('DELETE FROM cash_shifts');
    await executeQuery('DELETE FROM expenses');
    await executeQuery('DELETE FROM revenues');
    await executeQuery('DELETE FROM payroll_records');
    await executeQuery('DELETE FROM restaurant_tables');
    await executeQuery('DELETE FROM suppliers');
    await executeQuery('DELETE FROM system_logs');
    await executeQuery('DELETE FROM payment_corrections');
    await executeQuery('DELETE FROM layout_backups');
    await executeQuery('DELETE FROM customers');
    await executeQuery('DELETE FROM employees');
    await executeQuery('DELETE FROM stock_items');
    await executeQuery('DELETE FROM product_stock_movements');
    await executeQuery('DELETE FROM user_roles');
    await executeQuery('DELETE FROM roles');
    await executeQuery('DELETE FROM permissions');
    await executeQuery('DELETE FROM role_permissions');
    await executeQuery('DELETE FROM user_permissions');
    await executeQuery('DELETE FROM system_health_metrics');
    await executeQuery('DELETE FROM system_issues');
    
    logger.info('Limpeza completa de dados concluída com sucesso.', null, 'DATABASE_RESET');
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao limpar todos os dados', { error: error.message }, 'DATABASE_RESET');
    return { success: false, error: error.message };
  }
}

export async function hardResetAction(): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Iniciando hard reset da base de dados...', null, 'DATABASE_RESET');
    const result = await dbConfig.hardReset();
    if (result) {
      logger.info('Hard reset da base de dados concluído com sucesso.', null, 'DATABASE_RESET');
      return { success: true };
    } else {
      logger.error('Hard reset da base de dados falhou.', null, 'DATABASE_RESET');
      return { success: false, error: 'Hard reset da base de dados falhou.' };
    }
  } catch (error: any) {
    logger.error('Erro ao executar hard reset da base de dados', { error: error.message }, 'DATABASE_RESET');
    return { success: false, error: error.message };
  }
}

export async function testCloudConnectionAction(url: string, key: string): Promise<{ success: boolean; error?: string }> {


  try {
    logger.info('Iniciando teste de conexão Supabase (Server Action)...', null, 'CLOUD');
    await integrationAPIService.initialize(url, key);
    const result = await integrationAPIService.testConnection(url, key);
    if (result) {
      logger.info('Conexão Supabase estabelecida com sucesso (Server Action).', null, 'CLOUD');
      return { success: true };
    } else {
      throw new Error('Falha na resposta do servidor Supabase.');
    }
  } catch (error: any) {
    logger.error('Erro no teste de conexão Supabase (Server Action)', { error: error.message }, 'CLOUD');
    return { success: false, error: error.message };
  }
}

export async function fetchRemoteCategoriesAction(supabaseConfig: SystemSettings['supabaseConfig'], search: string): Promise<{ success: boolean; data?: MenuCategory[]; error?: string }> {


  try {
    if (!supabaseConfig?.enabled || !supabaseConfig?.url || !supabaseConfig?.key) {
      return { success: false, error: 'Configuração da cloud inválida.' };
    }
    await integrationAPIService.initialize(supabaseConfig.url, supabaseConfig.key);
    const catsRes = await integrationAPIService.fetchCategoriesPaged({ page: 1, pageSize: 100, search });
    if (catsRes.success && catsRes.data) {
      return { success: true, data: catsRes.data };
    } else {
      return { success: false, error: catsRes.error || 'Falha ao carregar categorias da cloud.' };
    }
  } catch (error: any) {
    logger.error('Erro ao carregar categorias da cloud (Server Action)', { error: error.message }, 'CLOUD');
    return { success: false, error: error.message };
  }
}

export async function fetchRemoteProductsAction(supabaseConfig: SystemSettings['supabaseConfig'], search: string, categoryId: string): Promise<{ success: boolean; data?: Product[]; error?: string }> {


  try {
    if (!supabaseConfig?.enabled || !supabaseConfig?.url || !supabaseConfig?.key) {
      return { success: false, error: 'Configuração da cloud inválida.' };
    }
    await integrationAPIService.initialize(supabaseConfig.url, supabaseConfig.key);
    const prodsRes = await integrationAPIService.fetchProductsPaged({ page: 1, pageSize: 200, search, categoryId });
    if (prodsRes.success && prodsRes.data) {
      return { success: true, data: prodsRes.data };
    } else {
      return { success: false, error: prodsRes.error || 'Falha ao carregar produtos da cloud.' };
    }
  } catch (error: any) {
    logger.error('Erro ao carregar produtos da cloud (Server Action)', { error: error.message }, 'CLOUD');
    return { success: false, error: error.message };
  }
}

export async function setupRLSAction(supabaseConfig: SystemSettings['supabaseConfig']): Promise<{ success: boolean; message?: string; error?: string }> {


  try {
    if (!supabaseConfig?.enabled || !supabaseConfig?.url || !supabaseConfig?.key) {
      return { success: false, error: 'Configuração da cloud inválida.' };
    }
    await integrationAPIService.initialize(supabaseConfig.url, supabaseConfig.key);
    const result = await integrationAPIService.setupRLS();
    if (result.success) {
      logger.info('RLS validado com sucesso (Server Action)', { result }, 'SECURITY');
      return { success: true, message: (result as any).message || 'Políticas validadas com sucesso.' };
    } else {
      logger.error('Falha na configuração/validação de RLS (Server Action)', { error: (result as any).error }, 'SECURITY');
      return { success: false, error: (result as any).error };
    }
  } catch (error: any) {
    logger.error('Erro ao configurar RLS (Server Action)', { error: error.message }, 'SECURITY');
    return { success: false, error: error.message };
  }
}

export async function setupBucketsAction(supabaseConfig: SystemSettings['supabaseConfig']): Promise<{ success: boolean; message?: string; error?: string }> {


  try {
    if (!supabaseConfig?.enabled || !supabaseConfig?.url || !supabaseConfig?.key) {
      return { success: false, error: 'Configuração da cloud inválida.' };
    }
    await integrationAPIService.initialize(supabaseConfig.url, supabaseConfig.key);
    const result = await integrationAPIService.setupBuckets();
    if (result.success) {
      logger.info('Buckets configurados com sucesso (Server Action)', { result }, 'STORAGE');
      return { success: true, message: (result as any).message || 'Buckets configurados com sucesso.' };
    } else {
      logger.error('Falha na configuração de buckets (Server Action)', { error: (result as any).error }, 'STORAGE');
      return { success: false, error: (result as any).error };
    }
  } catch (error: any) {
    logger.error('Erro ao configurar buckets (Server Action)', { error: error.message }, 'STORAGE');
    return { success: false, error: error.message };
  }
}

export async function captureFullStateAction(): Promise<{ success: boolean; data?: FullApplicationState; error?: string }> {


  try {
    const state = await disasterRecoveryService.captureFullState();
    return { success: true, data: state };
  } catch (error: any) {
    logger.error('Erro ao capturar estado completo (Server Action)', { error: error.message }, 'BACKUP');
    return { success: false, error: error.message };
  }
}

export async function restoreFullStateAction(state: FullApplicationState): Promise<{ success: boolean; error?: string }> {


  try {
    logger.warn('Iniciando restauração completa do estado da aplicação...', null, 'BACKUP');
    await disasterRecoveryService.applyState(state);
    logger.info('Restauração completa do estado da aplicação concluída com sucesso.', null, 'BACKUP');
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao restaurar estado da aplicação (Server Action)', { error: error.message }, 'BACKUP');
    return { success: false, error: error.message };
  }
}

export async function syncBackupAction(backupMetadata: BackupMetadata, backupData: unknown): Promise<{ success: boolean; error?: string }> {


  try {
    const result = await integrationAPIService.syncBackup(backupMetadata, backupData);
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    logger.error('Erro ao sincronizar backup (Server Action)', { error: error.message }, 'BACKUP');
    return { success: false, error: error.message };
  }
}

export async function syncMenuAction(categories: MenuCategory[], products: Product[], settings: SystemSettings): Promise<{ success: boolean; error?: string }> {


  try {
    const result = await integrationAPIService.syncMenu(categories, products, settings);
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    logger.error('Erro ao sincronizar menu (Server Action)', { error: error.message }, 'CLOUD');
    return { success: false, error: error.message };
  }
}

export async function fetchMenuAction(supabaseConfig: SystemSettings['supabaseConfig']): Promise<{ success: boolean; data?: { categories: MenuCategory[], products: Product[] }; error?: string }> {


  try {
    if (!supabaseConfig?.enabled || !supabaseConfig?.url || !supabaseConfig?.key) {
      return { success: false, error: 'Configuração da cloud inválida.' };
    }
    await integrationAPIService.initialize(supabaseConfig.url, supabaseConfig.key);
    const result = await integrationAPIService.fetchMenu();
    if (result.success && result.data) {
      return { 
        success: true, 
        data: {
          categories: result.data.categories,
          products: result.data.dishes || []
        } 
      };
    } else {
      return { success: false, error: result.error || 'Falha ao carregar menu da cloud.' };
    }
  } catch (error: any) {
    logger.error('Erro ao carregar menu da cloud (Server Action)', { error: error.message }, 'CLOUD');
    return { success: false, error: error.message };
  }
}

