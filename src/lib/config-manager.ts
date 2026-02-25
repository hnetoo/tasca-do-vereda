// Configuração simples para SQLite sem dependências complexas
export interface DatabaseConfig {
  type: 'local_storage' | 'postgres' | 'sqlite';
  connectionString?: string;
  updatedAt?: string;
}

export const getStoredDatabaseConfigSync = () => {
  try {
    // Verificar se estamos no ambiente Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    
    if (isTauri) {
      // Ambiente Tauri: usar SQLite local
      console.log(' Ambiente Tauri detectado - usando SQLite local');
      console.log('🔍 Ambiente Tauri detectado - usando SQLite local');
      return { type: 'sqlite', connectionString: 'file:tasca.db' };
    } else {
      // Ambiente Web: usar SQLite no browser storage
      console.log('🌐 Ambiente Web detectado - usando SQLite local');
      return { type: 'sqlite', connectionString: 'file:tasca.db' };
    }
  } catch (error) {
    console.error('❌ Erro ao carregar configuração:', error);
    return { type: 'sqlite', connectionString: 'file:tasca.db' };
  }
};

export const getStoredDatabaseConfig = getStoredDatabaseConfigSync;

export const saveStoredDatabaseConfig = async (config: any) => {
  try {
    console.log('💾 Salvando configuração:', config);
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
  }
};

export const getCategories = async () => {
  try {
    const cfg = getStoredDatabaseConfigSync();
    if (cfg.type === 'sqlite') {
      const { sqliteOperations } = await import('@/services/database/sqliteOperations');
      const res = await sqliteOperations.getCategories();
      return res;
    }
    
    // Fallback para Supabase se não for SQLite
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.getCategories();
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return { success: false, data: [], error: error.message };
  }
};

export const getFinancialTransactions = async (params?: any) => {
  try {
    const cfg = getStoredDatabaseConfigSync();
    if (cfg.type === 'sqlite') {
      const { sqliteOperations } = await import('@/services/database/sqliteOperations');
      const res = await sqliteOperations.getFinancialTransactions(params);
      return res;
    }
    
    // Fallback para Supabase se não for SQLite
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.getFinancialTransactions(params);
  } catch (error) {
    console.error('Erro ao buscar transações financeiras:', error);
    return { success: false, data: [], error: error.message };
  }
};

export const saveSettings = async (settings: any) => {
  try {
    const cfg = getStoredDatabaseConfigSync();
    if (cfg.type === 'sqlite') {
      const { sqliteOperations } = await import('@/services/database/sqliteOperations');
      const res = await sqliteOperations.saveSettings(settings);
      return res;
    }
    
    // Fallback para Supabase se não for SQLite
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.saveSettings(settings);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return { success: false, error: error.message };
  }
};

export const saveSupplier = async (supplier: any) => {
  try {
    const cfg = getStoredDatabaseConfigSync();
    if (cfg.type === 'sqlite') {
      const { sqliteOperations } = await import('@/services/database/sqliteOperations');
      const res = await sqliteOperations.saveSupplier(supplier);
      return res;
    }
    
    // Fallback para Supabase se não for SQLite
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.saveSupplier(supplier);
  } catch (error) {
    console.error('Erro ao salvar fornecedor:', error);
    return { success: false, error: error.message };
  }
};
