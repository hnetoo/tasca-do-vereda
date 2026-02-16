
import { logger } from '../services/logger';

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  context: string = 'Retry Operation'
): Promise<{ data: T | null; error: any }> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        logger.error(`Failed after ${retries} attempts: ${context}`, error, 'RetryService');
        return { data: null, error };
      }
      const backoff = delay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed. Retrying in ${backoff}ms: ${context}`, error, 'RetryService');
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  return { data: null, error: new Error('Max retries exceeded') };
}
