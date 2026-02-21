import { createAuthSlice, AuthSlice } from './authSlice';
import { StoreState } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { MOCK_USERS } from '@/constants';

// Mock dependencies
jest.mock('@/services/logger', () => ({
  logger: {
    auth: jest.fn(),
    security: jest.fn(),
    audit: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/services/cryptoService', () => ({
  CryptoService: {
    initialize: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    encrypt: jest.fn(),
  },
}));

// Mock utils/crypto calculateHash since it's used in login (pin)
jest.mock('@/utils/crypto', () => ({
  calculateHash: jest.fn(),
}));

describe('AuthSlice', () => {
  let set: jest.Mock;
  let get: jest.Mock;
  let authSlice: AuthSlice;
  let mockSupabase: any;

  beforeEach(() => {
    set = jest.fn((partial) => {
      // simulate state update for simple cases if needed
      if (typeof partial === 'function') {
          // partial(state) logic
      }
    });
    
    // Initial state mock
    const state: Partial<StoreState> = {
      users: MOCK_USERS,
      currentUser: null,
      isAuthenticated: false,
      settings: {
          restaurantName: 'Test',
          supabaseConfig: { enabled: true }
      } as any,
      addNotification: jest.fn(),
      addAuditLog: jest.fn(),
    };
    
    get = jest.fn(() => state);

    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create the slice
    // We only test the methods returned by createAuthSlice
    authSlice = createAuthSlice(set, get, {} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginWithPassword', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'admin@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email,
        user_metadata: { role: 'admin', name: 'Admin User' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authSlice.loginWithPassword(email, password);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result.success).toBe(true);
      expect(set).toHaveBeenCalledWith(expect.objectContaining({
        isAuthenticated: true,
        currentUser: expect.objectContaining({
          email,
          role: 'ADMIN',
        }),
      }));
      expect(logger.auth).toHaveBeenCalled();
    });

    it('should fail login with invalid credentials', async () => {
      const email = 'admin@example.com';
      const password = 'wrongpassword';

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authSlice.loginWithPassword(email, password);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
      expect(set).not.toHaveBeenCalled(); // Should not update state
      expect(logger.security).toHaveBeenCalled();
    });

    it('should handle internal errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      const result = await authSlice.loginWithPassword('test@example.com', 'pass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
        // Setup initial state with a logged in user
        const user = { id: '1', name: 'User', role: 'ADMIN' };
        get.mockReturnValue({
            currentUser: user,
            addAuditLog: jest.fn(),
        });

        await authSlice.logout();

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(set).toHaveBeenCalledWith({
            currentUser: null,
            isAuthenticated: false,
        });
        expect(logger.auth).toHaveBeenCalled();
    });
  });
});
