import fs from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json');

export interface DatabaseConfig {
  type: 'local_storage' | 'postgres' | 'sqlite';
  connectionString?: string;
  updatedAt?: string;
}

export async function getStoredDatabaseConfig(): Promise<DatabaseConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Default to local_storage if file doesn't exist or error
    return { type: 'local_storage' };
  }
}

export function getStoredDatabaseConfigSync(): DatabaseConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return { type: 'local_storage' };
    }
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { type: 'local_storage' };
  }
}

export async function saveStoredDatabaseConfig(config: DatabaseConfig): Promise<void> {
  const configToSave = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
}
