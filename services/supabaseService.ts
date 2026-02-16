import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from './logger';
import { exponentialBackoff } from '../utils/retry';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: { url: string; key: string } | null = null;
  private syncStatus: { status: 'idle' | 'success' | 'error' | 'retrying'; isConnected: boolean; lastSuccessAt: number | null; lastErrorAt: number | null; retries: number; errorMessage?: string; hasCriticalError: boolean; criticalErrorMessage?: string } = { status: 'idle', isConnected: false, lastSuccessAt: null, lastErrorAt: null, retries: 0, hasCriticalError: false };
  private circuitBreaker: { open: boolean; failures: number; threshold: number; openedAt: number; cooldownMs: number; halfOpenProbe: boolean } = { open: false, failures: 0, threshold: 3, openedAt: 0, cooldownMs: 30000, halfOpenProbe: false };
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private realtimeHandlers: Map<string, (payload: any) => void> = new Map();

  initialize(url: string, key: string, onRealtimeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Record<string, unknown>; old: Record<string, unknown>; tableName: string }) => void) {
    if (this.client) {
      logger.info('Supabase client already initialized. Skipping re-initialization.', {}, 'SupabaseService');
      return;
    }
    if (!url || !key) return;
    try {
      this.client = createClient(url, key);
      this.config = { url, key };
      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'idle';
      logger.info('Supabase client initialized', {}, 'SupabaseService');
      if (onRealtimeChange) {
        this.realtimeHandlers.set('default', onRealtimeChange);
      }
    } catch (error) {
      logger.error('Failed to initialize Supabase client', error, 'SupabaseService');
    }
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  isConnected(): boolean {
    return this.syncStatus.isConnected;
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  async syncSettings(settings: any): Promise<void> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot sync settings.', {}, 'SupabaseService');
      return;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt < this.circuitBreaker.cooldownMs)) {
      logger.warn('Circuit breaker is open. Skipping syncSettings.', {}, 'SupabaseService');
      return;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt >= this.circuitBreaker.cooldownMs)) {
      this.circuitBreaker.halfOpenProbe = true;
      logger.info('Circuit breaker in half-open state. Probing for recovery.', {}, 'SupabaseService');
    }

    try {
      const { data, error } = await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not available during backoff');
        return this.client.from('settings').upsert({ id: 1, ...settings });
      }, 5, 1000, 'SupabaseService.syncSettings');

      if (error) {
        throw error;
      }

      logger.info('Settings synced to Supabase', { data }, 'SupabaseService');
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.retries = 0;
      this.syncStatus.status = 'success';
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.open = false;
      this.circuitBreaker.halfOpenProbe = false;
    } catch (error: any) {
      logger.error('Failed to sync settings to Supabase', { error: error.message }, 'SupabaseService');
      this.syncStatus.lastErrorAt = Date.now();
      this.syncStatus.status = 'error';
      this.syncStatus.retries++;
      this.circuitBreaker.failures++;

      if (this.circuitBreaker.halfOpenProbe && error) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        this.circuitBreaker.halfOpenProbe = false;
        logger.warn('Half-open probe failed. Circuit breaker opened.', {}, 'SupabaseService');
      } else if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        logger.warn('Circuit breaker opened due to too many failures.', {}, 'SupabaseService');
      }
      throw error;
    }
  }

  async fetchSettings(): Promise<any | null> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot fetch settings.', {}, 'SupabaseService');
      return null;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt < this.circuitBreaker.cooldownMs)) {
      logger.warn('Circuit breaker is open. Skipping fetchSettings.', {}, 'SupabaseService');
      return null;
    }

    if (this.circuitBreaker.open && (Date.now() - this.circuitBreaker.openedAt >= this.circuitBreaker.cooldownMs)) {
      this.circuitBreaker.halfOpenProbe = true;
      logger.info('Circuit breaker in half-open state. Probing for recovery.', {}, 'SupabaseService');
    }

    try {
      const { data, error } = await exponentialBackoff(async () => {
        if (!this.client) throw new Error('Supabase client not available during backoff');
        return this.client.from('settings').select('*').single();
      }, 5, 1000, 'SupabaseService.fetchSettings');

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error for initial fetch
        throw error;
      }

      logger.info('Settings fetched from Supabase', { data }, 'SupabaseService');
      this.syncStatus.lastSuccessAt = Date.now();
      this.syncStatus.retries = 0;
      this.syncStatus.status = 'success';
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.open = false;
      this.circuitBreaker.halfOpenProbe = false;
      return data;
    } catch (error: any) {
      logger.error('Failed to fetch settings from Supabase', { error: error.message }, 'SupabaseService');
      this.syncStatus.lastErrorAt = Date.now();
      this.syncStatus.status = 'error';
      this.syncStatus.retries++;
      this.circuitBreaker.failures++;

      if (this.circuitBreaker.halfOpenProbe && error) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        this.circuitBreaker.halfOpenProbe = false;
        logger.warn('Half-open probe failed. Circuit breaker opened.', {}, 'SupabaseService');
      } else if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.open = true;
        this.circuitBreaker.openedAt = Date.now();
        logger.warn('Circuit breaker opened due to too many failures.', {}, 'SupabaseService');
      }
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot verify PIN.', {}, 'SupabaseService');
      return false;
    }
    try {
      const { data, error } = await this.client.from('settings').select('adminPin').single();
      if (error) {
        logger.error('Error fetching admin PIN from Supabase', { error: error.message }, 'SupabaseService');
        return false;
      }
      return data?.adminPin === pin;
    } catch (error: any) {
      logger.error('Failed to verify PIN with Supabase', { error: error.message }, 'SupabaseService');
      return false;
    }
  }

  async calculateHash(data: string): Promise<string> {
    return calculateHash(data);
  }

  subscribeToTableChanges(tableName: string, handler: (payload: any) => void, eventType: '*' | 'INSERT' | 'UPDATE' | 'DELETE' = '*'): void {
    if (!this.client) {
      logger.warn('Supabase client not initialized. Cannot subscribe to table changes.', { tableName }, 'SupabaseService');
      return;
    }
    if (this.subscriptions.has(tableName)) {
      logger.info(`Already subscribed to ${tableName}. Re-subscribing.`, {}, 'SupabaseService');
      this.removeRealtimeHandler(tableName);
    }

    const channel = this.client
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: eventType, schema: 'public', table: tableName }, (payload) => {
        logger.info(`Realtime change detected for ${tableName}`, { payload }, 'SupabaseService');
        handler({ ...payload, tableName });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info(`Subscribed to ${tableName} changes`, {}, 'SupabaseService');
          this.subscriptions.set(tableName, channel);
          this.realtimeHandlers.set(tableName, handler);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(`Error subscribing to ${tableName} changes`, {}, 'SupabaseService');
        }
      });
  }

  removeRealtimeHandler(tableName: string): void {
    const channel = this.subscriptions.get(tableName);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(tableName);
      this.realtimeHandlers.delete(tableName);
      logger.info(`Unsubscribed from ${tableName} changes`, {}, 'SupabaseService');
    }
  }

  unsubscribeFromAllChanges(): void {
    this.subscriptions.forEach((channel, tableName) => {
      channel.unsubscribe();
      logger.info(`Unsubscribed from ${tableName} changes`, {}, 'SupabaseService');
    });
    this.subscriptions.clear();
    this.realtimeHandlers.clear();
  }
}

export const supabaseService = new SupabaseService();
