import { logger } from './logger';

export class CryptoService {
  private static secretKey: CryptoKey | null = null;
  private static SALT = new TextEncoder().encode('TASCA-DO-VEREDA-SALT-V1');
  private static isInitialized = false;

  static async initialize(secret: string) {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API não suportada neste ambiente');
      }

      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      this.secretKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: this.SALT,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false, // not extractable for security
        ["encrypt", "decrypt"]
      );
      
      this.isInitialized = true;
      // logger.auth might not be available in all environments/tests
      if (typeof logger.auth === 'function') {
        logger.auth('CryptoService inicializado com sucesso', { 
          salt: 'TASCA-DO-VEREDA-SALT-V1',
          iterations: 100000 
        });
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Falha ao inicializar CryptoService', { error: error.message }, 'SECURITY');
      this.isInitialized = false;
    }
  }

  static async encrypt(text: string): Promise<string | null> {
    if (!this.isInitialized || !this.secretKey) {
      logger.warn('CryptoService não inicializado ou chave ausente para encriptação');
      return null;
    }
    
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API indisponível');
      }

      const enc = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        this.secretKey,
        enc.encode(text)
      );

      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      // Safe Base64 conversion without spread operator for large arrays
      let binary = '';
      for (let i = 0; i < combined.byteLength; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      const base64 = btoa(binary);

      if (typeof logger.debug === 'function') {
        logger.debug('Dados encriptados com sucesso', { ivLength: iv.length });
      }
      return base64;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro na encriptação', { error: error.message }, 'SECURITY');
      return null;
    }
  }

  static async decrypt(encryptedText: string): Promise<string | null> {
    if (!encryptedText || encryptedText === 'null' || encryptedText === 'undefined') {
        return null;
    }

    if (!this.isInitialized || !this.secretKey) {
      logger.warn('CryptoService não inicializado ou chave ausente para decriptação');
      return null;
    }

    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API indisponível');
      }

      // Safe Base64 decode
      let binary;
      try {
        binary = atob(encryptedText);
      } catch (e) {
        logger.error('Erro ao decodificar Base64', { error: String(e) }, 'SECURITY');
        return null;
      }

      const combined = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
      }
      
      if (combined.length < 13) { // IV(12) + at least 1 byte of data
          throw new Error('Dados encriptados inválidos ou corrompidos');
      }
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        this.secretKey,
        data
      );

      // logger.debug might not be available in all environments/tests
      if (typeof logger.debug === 'function') {
        logger.debug('Dados decriptados com sucesso');
      }
      return new TextDecoder().decode(decrypted);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro na decriptação', { error: error.message }, 'SECURITY');
      return null;
    }
  }
  
  static isReady() {
    return this.isInitialized;
  }
}
