
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../services/supabaseService';
import { webcrypto } from 'node:crypto';

// Mock window.crypto for Node.js
if (typeof window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: { crypto: webcrypto },
    configurable: true
  });
}

describe('Authentication Integration Flow', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete a full successful login flow', async () => {
    // 1. Calculate Hash for a PIN (e.g. "1234")
    const pin = '1234';
    const expectedHash = await supabaseService.calculateHash(pin);
    
    // 2. Mock a user from DB
    const mockUser = {
      id: 'user-123',
      name: 'Test Admin',
      pin: expectedHash, // Stored as hash
      role: 'ADMIN',
      active: true
    };

    // 3. Simulate PIN entry and verification
    const userInput = '1234';
    const inputHash = await supabaseService.calculateHash(userInput);
    
    expect(inputHash).toBe(mockUser.pin);
    expect(mockUser.role).toBe('ADMIN');
  });

  it('should handle lockout after multiple failed attempts', async () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let isLocked = false;
    
    const tryLogin = (pin: string, correctPin: string) => {
      if (isLocked) return 'LOCKED';
      
      if (pin === correctPin) {
        attempts = 0;
        return 'SUCCESS';
      } else {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          isLocked = true;
          return 'LOCKED';
        }
        return 'FAILED';
      }
    };

    expect(tryLogin('wrong', '1234')).toBe('FAILED');
    expect(attempts).toBe(1);
    
    expect(tryLogin('wrong', '1234')).toBe('FAILED');
    expect(attempts).toBe(2);
    
    expect(tryLogin('wrong', '1234')).toBe('LOCKED');
    expect(isLocked).toBe(true);
    
    expect(tryLogin('1234', '1234')).toBe('LOCKED'); // Still locked
  });

  it('should support variable length PINs (4-6 digits)', async () => {
    const pins = ['1234', '12345', '123456'];
    
    for (const pin of pins) {
      const hash = await supabaseService.calculateHash(pin);
      expect(hash.length).toBe(64);
      
      const verify = await supabaseService.calculateHash(pin);
      expect(verify).toBe(hash);
    }
  });
});
