
import { isTauri } from '@tauri-apps/api/core';
import { logger } from './logger';

export const initTauri = async () => {
  try {
    // Check if running in Tauri
    if (isTauri()) {
      logger.info('Tauri environment detected', undefined, 'SYSTEM');
      return true;
    }
    logger.info('Running in browser mode', undefined, 'SYSTEM');
    return false;
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('Failed to initialize Tauri', { error: err.message }, 'SYSTEM');
    throw err;
  }
};
