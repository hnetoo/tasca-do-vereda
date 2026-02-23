
export async function getDatabaseConfigAction(): Promise<{ success: boolean; data?: DatabaseConfig; error?: string }> {
  try {
    const config = await getStoredDatabaseConfig();
    return { success: true, data: config };
  } catch (error: any) {
    logger.error('Erro ao ler configuração de banco de dados (Server Action)', { error: error.message }, 'DATABASE');
    return { success: false, error: error.message };
  }
}

export async function saveDatabaseConfigAction(config: DatabaseConfig): Promise<{ success: boolean; error?: string }> {
  try {
    logger.warn('Salvando nova configuração de banco de dados...', { type: config.type }, 'DATABASE');
    await saveStoredDatabaseConfig(config);
    logger.info('Configuração de banco de dados salva com sucesso.', null, 'DATABASE');
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao salvar configuração de banco de dados (Server Action)', { error: error.message }, 'DATABASE');
    return { success: false, error: error.message };
  }
}
