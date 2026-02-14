import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { useStore } from '../store/useStore';
import { CryptoService } from '../services/cryptoService';
import { MOCK_USERS } from '../constants';

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

// Mock CryptoService to control its state
vi.mock('../services/cryptoService', async (importOriginal) => {
  const actual = await importOriginal() as any;
  const mockCryptoService = {
    ...actual.CryptoService,
    initialize: vi.fn(),
    isReady: vi.fn(() => false), // Initially not ready
    encrypt: vi.fn((data) => Promise.resolve(`encrypted_${data}`)),
    decrypt: vi.fn((data) => Promise.resolve(data.replace('encrypted_', ''))),
    reset: vi.fn(() => {
      // Reset the mock's internal state for isReady
      (mockCryptoService.isReady as any).mockReturnValue(false);
      (mockCryptoService.initialize as any).mockClear();
    }),
  };
  return {
    ...actual,
    CryptoService: mockCryptoService,
  };
});

describe('AuthSlice - Post-PIN Crash Fix Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset CryptoService mock before each test
    (CryptoService as any).reset();
    // Set up initial store state for login
    useStore.setState({
      users: MOCK_USERS,
      settings: {
        adminPin: '1234',
        apiToken: 'test-token',
        restaurantName: 'Test Restaurant',
        supabaseConfig: { enabled: false, url: '', key: '' },
        nif: '123456789',
        address: 'Test Address',
        phone: '123456789',
        currency: 'KZ',
        taxRate: 14,
        webhookEnabled: false
      },
      addNotification: vi.fn(),
      addAuditLog: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize CryptoService if not ready during login with rememberMe', async () => {
    // Ensure CryptoService is initially not ready
    expect(CryptoService.isReady()).toBe(false);
    expect(CryptoService.initialize).not.toHaveBeenCalled();

    const { login } = useStore.getState();
    const userPin = MOCK_USERS[0].pin; // Assuming MOCK_USERS[0] has a pin
    const userId = MOCK_USERS[0].id;

    // Simulate login with rememberMe
    const success = await login(userPin, userId, true);

    expect(success).toBe(true);
    // Expect CryptoService.initialize to have been called once
    expect(CryptoService.initialize).toHaveBeenCalledTimes(1);
    // Expect it to be called with the correct secret
    expect(CryptoService.initialize).toHaveBeenCalledWith('1234'); // adminPin from settings
    // After initialization, CryptoService should be considered ready for subsequent calls
    (CryptoService.isReady as any).mockReturnValue(true);
    expect(CryptoService.isReady()).toBe(true);
  });

  it('should not re-initialize CryptoService if already ready during login with rememberMe', async () => {
    // Manually set CryptoService as ready before login
    (CryptoService.isReady as any).mockReturnValue(true);
    expect(CryptoService.isReady()).toBe(true);
    expect(CryptoService.initialize).not.toHaveBeenCalled();

    const { login } = useStore.getState();
    const userPin = MOCK_USERS[0].pin;
    const userId = MOCK_USERS[0].id;

    // Simulate login with rememberMe
    const success = await login(userPin, userId, true);

    expect(success).toBe(true);
    // Expect CryptoService.initialize NOT to have been called
    expect(CryptoService.initialize).not.toHaveBeenCalled();
  });

  it('should not attempt to initialize CryptoService if rememberMe is false', async () => {
    // Ensure CryptoService is initially not ready
    expect(CryptoService.isReady()).toBe(false);
    expect(CryptoService.initialize).not.toHaveBeenCalled();

    const { login } = useStore.getState();
    const userPin = MOCK_USERS[0].pin;
    const userId = MOCK_USERS[0].id;

    // Simulate login without rememberMe
    const success = await login(userPin, userId, false);

    expect(success).toBe(true);
    // Expect CryptoService.initialize NOT to have been called
    expect(CryptoService.initialize).not.toHaveBeenCalled();
  });

  it('should handle errors during CryptoService operations gracefully', async () => {
    // Force CryptoService.initialize to throw an error
    (CryptoService.initialize as any).mockImplementationOnce(() => {
      throw new Error('CryptoService initialization failed');
    });
    (CryptoService.isReady as any).mockReturnValue(false); // Ensure it's not ready initially

    const { login } = useStore.getState();
    const userPin = MOCK_USERS[0].pin;
    const userId = MOCK_USERS[0].id;

    // Simulate login with rememberMe
    const success = await login(userPin, userId, true);

    expect(success).toBe(true); // Login should still succeed even if persistence fails
    expect(CryptoService.initialize).toHaveBeenCalledTimes(1);
    // Verify that both success and error notifications were added
    const addNotificationMock = useStore.getState().addNotification as ReturnType<typeof vi.fn>;
    expect(addNotificationMock).toHaveBeenCalledTimes(2);
    expect(addNotificationMock).toHaveBeenCalledWith('success', expect.stringContaining('Bem-vindo'));
    expect(addNotificationMock).toHaveBeenCalledWith(
      'error',
      'Falha ao salvar credenciais. Por favor, tente novamente.'
    );
  });
});
