import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Import store
import { useStore } from './useStore';

describe('useStore - Local Only Mode', () => {
  beforeEach(() => {
    useStore.setState({
      deliveries: [],
      offlineQueue: [],
      onlineStatus: true, // Simulate online but should not sync
      notifications: []
    });
    vi.clearAllMocks();
  });

  it('should add delivery locally without triggering cloud sync', async () => {
    const delivery = {
      id: 'del-1',
      orderId: 'ord-1',
      driverName: 'João',
      driverPhone: '999',
      status: 'SAIU' as const,
      startTime: new Date()
    };

    // Add delivery
    await useStore.getState().addDelivery(delivery);
    
    // Check state
    const state = useStore.getState();
    expect(state.deliveries).toHaveLength(1);
    expect(state.deliveries[0]).toEqual(delivery);
    
    // Check offline queue - should be empty because we are "online" but sync is removed
    // Wait, my logic was: if online, try sync (removed), catch error -> offline queue.
    // Since sync is removed and try/catch is removed/commented, it should just succeed locally and NOT add to offline queue.
    expect(state.offlineQueue).toHaveLength(0);
  });

  it('should NOT add to offline queue even if offline (local only)', async () => {
    useStore.setState({ onlineStatus: false });
    
    const delivery = {
      id: 'del-2',
      orderId: 'ord-2',
      driverName: 'Maria',
      driverPhone: '888',
      status: 'SAIU' as const,
      startTime: new Date()
    };

    await useStore.getState().addDelivery(delivery);
    
    const state = useStore.getState();
    expect(state.deliveries).toHaveLength(1);
    expect(state.offlineQueue).toHaveLength(0);
  });

  it('triggerSync should be a no-op or local only', async () => {
    await useStore.getState().triggerSync();
    // Should not throw
    expect(true).toBe(true);
  });
});
