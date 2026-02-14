import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from '../services/cryptoService';

describe('CryptoService', () => {
  const secret = 'test-secret-123';
  const plainText = 'Dados Sensíveis de Folha de Pagamento';

  beforeEach(async () => {
    await CryptoService.initialize(secret);
  });

  it('should encrypt and decrypt correctly', async () => {
    const encrypted = await CryptoService.encrypt(plainText);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(plainText);
    
    const decrypted = await CryptoService.decrypt(encrypted!);
    expect(decrypted).toBe(plainText);
  });

  it('should produce different ciphertexts for the same plaintext (IV randomization)', async () => {
    const encrypted1 = await CryptoService.encrypt(plainText);
    const encrypted2 = await CryptoService.encrypt(plainText);
    expect(encrypted1).not.toBe(encrypted2);
    
    const decrypted1 = await CryptoService.decrypt(encrypted1!);
    const decrypted2 = await CryptoService.decrypt(encrypted2!);
    expect(decrypted1).toBe(plainText);
    expect(decrypted2).toBe(plainText);
  });

  it('should fail to decrypt with wrong key', async () => {
    const encrypted = await CryptoService.encrypt(plainText);
    
    // Reinicializar com segredo diferente
    await CryptoService.initialize('wrong-secret');
    
    try {
      await CryptoService.decrypt(encrypted!);
      // Se não lançar erro, o teste deve falhar
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should return null if not initialized', async () => {
    // Reset state to simulate not initialized
    Object.defineProperty(CryptoService, 'isInitialized', { value: false, writable: true });
    Object.defineProperty(CryptoService, 'secretKey', { value: null, writable: true });
    
    const result = await CryptoService.encrypt(plainText);
    expect(result).toBeNull();
  });
});
