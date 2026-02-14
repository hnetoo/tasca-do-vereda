
import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseService } from './supabaseService';
import { webcrypto } from 'node:crypto';

describe('Authentication Service', () => {
  
  beforeAll(async () => {
    // Mock window.crypto for Node.js environment if needed
    if (typeof window === 'undefined') {
      Object.defineProperty(global, 'window', {
        value: { crypto: webcrypto },
        configurable: true
      });
    } else if (!window.crypto) {
        Object.defineProperty(window, 'crypto', {
            value: webcrypto,
            configurable: true
        });
    }
  });

  it('should calculate SHA-256 hash correctly', async () => {
    const pin = '1234';
    const hash = await supabaseService.calculateHash(pin);
    
    // SHA-256 of "1234" is:
    // 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
    
    expect(hash).toBe('03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');
    expect(hash.length).toBe(64);
  });

  it('should verify correct PIN via hash comparison', async () => {
    const pin = '1234';
    const storedHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    
    const inputHash = await supabaseService.calculateHash(pin);
    expect(inputHash).toBe(storedHash);
  });

  it('should reject incorrect PIN via hash comparison', async () => {
    const pin = '9999';
    const storedHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // Hash of 1234
    
    const inputHash = await supabaseService.calculateHash(pin);
    expect(inputHash).not.toBe(storedHash);
  });

  it('should handle empty PIN', async () => {
      const pin = '';
      const hash = await supabaseService.calculateHash(pin);
      // SHA-256 of empty string
      // e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

});
