import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json');

export interface DatabaseConfig {
  type: 'local_storage' | 'postgres' | 'sqlite';
  connectionString?: string;
  updatedAt?: string;
}

export function getStoredDatabaseConfigSync(): DatabaseConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData) as DatabaseConfig;
    }
  } catch (error) {
    console.error('Failed to load database config:', error);
    return { type: 'sqlite', connectionString: 'file:tasca.db' };
  }
}

export async function saveStoredDatabaseConfig(config: DatabaseConfig): Promise<void> {
  const configToSave = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database config:', error);
  }
}
