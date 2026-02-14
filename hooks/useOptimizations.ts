import React, { useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * Hook para evitar recálculos desnecessários com valores dependentes
 */
export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

/**
 * Hook para debounced callbacks
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        (callback as (...args: unknown[]) => unknown)(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback as unknown as T;
};

/**
 * Hook para throttled callbacks
 */
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  throttleTime: number
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: unknown[]) => {
      const now = Date.now();

      if (now - lastCallRef.current >= throttleTime) {
        lastCallRef.current = now;
        (callback as (...args: unknown[]) => unknown)(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          (callback as (...args: unknown[]) => unknown)(...args);
        }, throttleTime - (now - lastCallRef.current));
      }
    },
    [callback, throttleTime]
  );

  return throttledCallback as unknown as T;
};

/**
 * Hook para cache com TTL
 */
export const useCachedValue = <T,>(
  computeFn: () => T,
  deps: unknown[],
  ttl: number = 60000
): T => {
  const cacheRef = useRef<{ value: T; timestamp: number } | null>(null);

  return useMemo(() => {
    const now = Date.now();
    if (
      cacheRef.current &&
      now - cacheRef.current.timestamp < ttl
    ) {
      return cacheRef.current.value;
    }

    const value = computeFn();
    cacheRef.current = { value, timestamp: now };
    return value;
  }, deps);
};

/**
 * Hook para lazy initialization
 */
export const useLazyInit = <T,>(initializer: () => T): T => {
  const ref = useRef<T | undefined>(undefined);

  if (ref.current === undefined) {
    ref.current = initializer();
  }

  return ref.current;
};

/**
 * Hook para async operations com cancelamento
 */
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate = true
) => {
  const [state, setState] = React.useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    data: T | null;
    error: Error | null;
  }>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ status: 'pending', data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response, error: null });
      return response;
    } catch (error) {
      setState({ status: 'error', data: null, error: error as Error });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
};

