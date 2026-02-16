import { logger } from '../../services/logger';

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 1000,
  context: string = 'Operation'
): Promise<{ data: T | null; error: any }> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt <= retries) {
    try {
      const result = await fn();
      return { data: result, error: null };
    } catch (error: any) {
      attempt++;
      if (attempt > retries) {
        return { data: null, error };
      }
      
      logger.warn(`${context}: Attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return { data: null, error: new Error('Max retries reached') };
}
