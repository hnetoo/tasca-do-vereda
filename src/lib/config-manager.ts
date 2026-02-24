import fs from 'fs/promises';
import { readFileSync, existsSync, constants as FS_CONSTANTS } from 'fs';
import path from 'path';

function resolveWritableConfigPath(): string {
  const explicit = process.env.DATABASE_CONFIG_PATH;
  if (explicit) return explicit;
  const defaultPath = path.join(process.cwd(), 'database-config.json');
  try {
    // Try access write permissions on the directory
    const dir = path.dirname(defaultPath);
    // Note: fs.promises.access is async; for sync check fallback below
    // If running on serverless (e.g. Vercel), /var/task is read-only; prefer /tmp
    // We don't rely solely on access; use environment hint
    const isVercel = !!process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT;
    if (isVercel) {
      return path.join('/tmp', 'database-config.json');
    }
    return defaultPath;
  } catch {
    return path.join('/tmp', 'database-config.json');
  }
}

const CONFIG_FILE = resolveWritableConfigPath();

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
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
  } catch (error: any) {
    // Attempt fallback to /tmp if primary path failed (read-only FS)
    const fallbackPath = path.join('/tmp', 'database-config.json');
    try {
      await fs.writeFile(fallbackPath, JSON.stringify(configToSave, null, 2), 'utf-8');
    } catch (err: any) {
      throw error;
    }
  }
}
