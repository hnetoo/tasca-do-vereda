'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

interface OfflineCacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string;
  compress?: boolean;
}

class OfflineCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private dbName = 'tasca-offline-cache';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private pendingSync: Map<string, any> = new Map();

  constructor() {
    this.initDB();
    this.setupOnlineListeners();
    this.loadCacheFromStorage();
  }

  private async initDB() {
    if (typeof indexedDB === 'undefined') return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  private setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem('tasca-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem('tasca-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  async set<T>(key: string, data: T, options: OfflineCacheOptions = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
      version: options.version || '1.0.0'
    };

    this.cache.set(key, entry);

    // Save to localStorage as fallback
    this.saveCacheToStorage();

    // Save to IndexedDB for larger data
    if (this.db) {
      await this.saveToIndexedDB(key, entry);
    }

    // If offline, mark for sync
    if (!this.isOnline) {
      this.pendingSync.set(key, { data, action: 'set' });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.delete(key);
        return null;
      }
      return entry.data;
    }

    // Try IndexedDB
    if (this.db) {
      const dbEntry = await this.getFromIndexedDB(key);
      if (dbEntry) {
        if (dbEntry.expiresAt && Date.now() > dbEntry.expiresAt) {
          await this.deleteFromIndexedDB(key);
          return null;
        }
        // Update memory cache
        this.cache.set(key, dbEntry);
        return dbEntry.data;
      }
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.saveCacheToStorage();
    
    if (this.db) {
      await this.deleteFromIndexedDB(key);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.saveCacheToStorage();
    
    if (this.db) {
      await this.clearIndexedDB();
    }
    
    this.pendingSync.clear();
  }

  private async saveToIndexedDB(key: string, entry: CacheEntry<any>): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put({ key, ...entry });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getFromIndexedDB(key: string): Promise<CacheEntry<any> | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async syncPendingData(): Promise<void> {
    if (this.pendingSync.size === 0) return;

    const syncPromises = Array.from(this.pendingSync.entries()).map(async ([key, data]) => {
      try {
        // Here you would sync with your backend
        console.log(`Syncing ${key} with backend:`, data);
        // await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ key, data }) });
        this.pendingSync.delete(key);
      } catch (error) {
        console.error(`Failed to sync ${key}:`, error);
      }
    });

    await Promise.all(syncPromises);
  }

  // Utility methods
  isDataExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || !entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getPendingSyncCount(): number {
    return this.pendingSync.size;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Global cache instance
const cacheManager = new OfflineCacheManager();

// Hook for using offline cache
export function useOfflineCache<T>(key: string, options: OfflineCacheOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cachedData = await cacheManager.get<T>(key);
        
        if (cachedData !== null) {
          setData(cachedData);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [key]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateCache = useCallback(async (newData: T) => {
    try {
      await cacheManager.set(key, newData, options);
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cache');
    }
  }, [key, options]);

  const clearCache = useCallback(async () => {
    try {
      await cacheManager.delete(key);
      setData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  }, [key]);

  return {
    data,
    loading,
    error,
    isOnline,
    updateCache,
    clearCache,
    isExpired: cacheManager.isDataExpired(key),
    cacheManager
  };
}

// Specialized hooks for different data types
export function useOfflineProducts() {
  return useOfflineCache('products', { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
}

export function useOfflineOrders() {
  return useOfflineCache('orders', { ttl: 60 * 60 * 1000 }); // 1 hour
}

export function useOfflineMenu() {
  return useOfflineCache('menu', { ttl: 12 * 60 * 60 * 1000 }); // 12 hours
}

export function useOfflineSettings() {
  return useOfflineCache('settings', { ttl: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

export { cacheManager };
export type { OfflineCacheOptions, CacheEntry };
