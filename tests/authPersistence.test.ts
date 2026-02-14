import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { useStore } from '../store/useStore';
import { CryptoService } from '../services/cryptoService';

// Mock localStorage and crypto
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', { value: { crypto: webcrypto, localStorage: localStorageMock } });
Object.defineProperty(globalThis, 'crypto', { value: webcrypto });

describe('Credential Persistence Integration', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Initialize CryptoService for testing
    await CryptoService.initialize('test-secret');
  });

  it('should persist credentials when rememberMe is true', async () => {
    const { login } = useStore.getState();
    
    // Simulate login with rememberMe
    await login('1234', undefined, true); 
    
    // Check if credentials are in localStorage (encrypted)
    const savedCreds = localStorage.getItem('saved_credentials');
    expect(savedCreds).not.toBeNull();
    
    // Decrypt and verify
    const decrypted = await CryptoService.decrypt(savedCreds!);
    const creds = JSON.parse(decrypted!);
    expect(creds.pin).toBe('1234');
  });

  it('should NOT persist credentials when rememberMe is false', async () => {
    const { login } = useStore.getState();
    
    // Simulate login without rememberMe
    await login('1234', undefined, false);
    
    const savedCreds = localStorage.getItem('saved_credentials');
    expect(savedCreds).toBeNull();
  });

  it('should clear credentials on manual logout', async () => {
    const { login, logout } = useStore.getState();
    
    // Save first
    await login('1234', undefined, true);
    expect(localStorage.getItem('saved_credentials')).not.toBeNull();
    
    // Logout
    logout();
    
    expect(localStorage.getItem('saved_credentials')).toBeNull();
  });
});
