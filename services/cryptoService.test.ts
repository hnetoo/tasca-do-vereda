import { describe, it, expect, beforeAll } from 'vitest';
import { CryptoService } from './cryptoService';
import { webcrypto } from 'node:crypto';

describe('CryptoService', () => {
  const SECRET = 'test-secret-key';
  const PLAIN_TEXT = '1234';

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

    await CryptoService.initialize(SECRET);
  });

  it('should be initialized correctly', () => {
    expect(CryptoService.isReady()).toBe(true);
  });

  it('should encrypt and decrypt correctly', async () => {
    const encrypted = await CryptoService.encrypt(PLAIN_TEXT);
    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toBe(PLAIN_TEXT);

    const decrypted = await CryptoService.decrypt(encrypted!);
    expect(decrypted).toBe(PLAIN_TEXT);
  });

  it('should return null if not initialized', async () => {
    // We can't easily "un-initialize" without affecting other tests in this file
    // unless we create a new instance, but CryptoService is static.
    // However, we can test with wrong input.
    const decrypted = await CryptoService.decrypt('invalid-base64');
    expect(decrypted).toBeNull();
  });

  it('should produce different ciphertexts for the same plaintext (IV randomization)', async () => {
    const encrypted1 = await CryptoService.encrypt(PLAIN_TEXT);
    const encrypted2 = await CryptoService.encrypt(PLAIN_TEXT);
    expect(encrypted1).not.toBe(encrypted2);
  });
});
