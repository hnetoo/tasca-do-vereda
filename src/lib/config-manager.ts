// Configuração simples para SQLite sem dependências complexas
export interface DatabaseConfig {
  type: 'local_storage' | 'postgres' | 'sqlite';
  connectionString?: string;
  url?: string; // Para compatibilidade com Supabase
  updatedAt?: string;
}

export const getStoredDatabaseConfigSync = () => {
  // A única fonte de verdade agora é o Supabase, que usa uma interface compatível com Postgres.
  // A lógica de detecção de ambiente (Tauri/Web) foi removida para garantir consistência.
  return { type: 'postgres' };
};

export const getStoredDatabaseConfig = getStoredDatabaseConfigSync;

export const saveStoredDatabaseConfig = async (config: any) => {
  try {
    // Esta função é mantida para compatibilidade, mas a configuração é fixa no Supabase.
    console.log('💾 A configuração da base de dados é gerenciada centralmente e não pode ser alterada.', config);
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
  }
};

export const getCategories = async () => {
  try {
    // A fonte de verdade é sempre o Supabase. A lógica para SQLite foi removida.
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.getCategories();
  } catch (error: any) {
    // Nota: A tabela correta é 'menu_categories'.
    // A implementação em `databaseOperations` deve usar `from('menu_categories')`.
    console.error('Erro ao buscar categorias (deve usar a tabela menu_categories):', error);
    return { success: false, data: [], error: error?.message || String(error) };
  }
};

export const getFinancialTransactions = async (params?: any) => {
  try {
    // A fonte de verdade é sempre o Supabase. A lógica para SQLite foi removida.
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('id, date, amount, description, category, type, status')
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Erro ao buscar transações financeiras:', error);
    return { success: false, data: [], error: error?.message || String(error) };
  }
};

export const saveSettings = async (settings: any) => {
  try {
    // A fonte de verdade é sempre o Supabase.
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.saveSettings(settings);
  } catch (error: any) {
    console.error('Erro ao salvar configurações:', error);
    return { success: false, error: error?.message || String(error) };
  }
};

export const saveSupplier = async (supplier: any) => {
  try {
    // A fonte de verdade é sempre o Supabase.
    const { databaseOperations } = await import('@/services/database/operations');
    return await databaseOperations.saveSupplier(supplier);
  } catch (error: any) {
    console.error('Erro ao salvar fornecedor:', error);
    return { success: false, error: error?.message || String(error) };
  }
};
