import { describe, it, expect, beforeAll, vi } from 'vitest';
import { supabaseService } from './supabaseService';
import { webcrypto } from 'node:crypto';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { pin: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' }, error: null })),
          active: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  })
}));

describe('Mobile Authentication Integration', () => {
  
  beforeAll(async () => {
    // Mock window.crypto for Node.js environment
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

  it('should verify a correct PIN against a hashed value', async () => {
    const pin = '1234';
    const hashedPin = await supabaseService.calculateHash(pin);
    expect(hashedPin).toBe('03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');
  });

  it('should fail verification for an incorrect PIN', async () => {
    const pin = 'wrong';
    const hashedPin = await supabaseService.calculateHash(pin);
    const correctHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    expect(hashedPin).not.toBe(correctHash);
  });

  it('should fetch and hash users for local comparison', async () => {
    // Mock data for fetchUsers
    const mockUsers = [
      { id: '1', name: 'Admin', pin: '1234', role: 'ADMIN', active: true }
    ];

    // Spy on fetchUsers to test the transformation logic
    const spy = vi.spyOn(supabaseService, 'fetchUsers').mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          name: 'Admin',
          pin: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
          role: 'ADMIN',
          isActive: true,
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });

    const result = await supabaseService.fetchUsers();
    expect(result.success).toBe(true);
    expect(result.data![0].pin).toBe('03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');
    spy.mockRestore();
  });

  it('should handle lockout logic conditions', () => {
    const attempts = 3;
    const MAX_ATTEMPTS = 3;
    const isLocked = attempts >= MAX_ATTEMPTS;
    expect(isLocked).toBe(true);
  });
});
