import React from 'react';

// Optimization utilities para melhorar performance

export const debounce = <T extends (...args: unknown[]) => unknown>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => (func as (...args: unknown[]) => void)(...args), wait);
  }) as T;
};

export const throttle = <T extends (...args: unknown[]) => unknown>(func: T, limit: number): T => {
  let inThrottle: boolean = false;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      (func as (...args: unknown[]) => void)(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// Cache com TTL (Time To Live)
export class CacheWithTTL<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) { // default 5 minutes
    this.ttl = ttl;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  hasKey(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Memoization helper
export const memoize = <T extends (...args: unknown[]) => unknown>(func: T): T => {
  const cache = new Map();
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = (func as (...args: unknown[]) => unknown)(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Lazy loading component helper
export const lazyLoadComponent = <P,>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ReactElement
) => {
  const Component = React.lazy(importFunc) as React.LazyExoticComponent<React.ComponentType<P>>;
  const LazyComponent: React.FC<P> = (props) => (
    <React.Suspense fallback={fallback}>
      {React.createElement(Component as React.ComponentType<any>, props as any)}
    </React.Suspense>
  );
  LazyComponent.displayName = 'LazyLoadedComponent';
  return LazyComponent;
};

// Request batching para reduzir chamadas a store
export class BatchQueue<T> {
  private queue: T[] = [];
  private processing = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => void;

  constructor(processor: (items: T[]) => void, flushIntervalMs: number = 100) {
    this.processor = processor;
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }

  add(item: T): void {
    this.queue.push(item);
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  flush(): void {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const items = [...this.queue];
    this.queue = [];

    this.processor(items);
    this.processing = false;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clearMarks(): void {
    this.marks.clear();
  }
}

// Virtual scrolling helper para listas grandes
export const useVirtualScroll = <T,>(items: T[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = {
    start: Math.max(0, Math.floor(scrollTop / itemHeight) - 1),
    end: Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + 1),
  };

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * itemHeight;

  return { visibleItems, offsetY, visibleRange, setScrollTop };
};
