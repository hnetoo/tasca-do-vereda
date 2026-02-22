import { createAuthSlice, AuthSlice } from '@/store/slices/authSlice';
import { StoreState } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { MOCK_USERS } from '@/constants/index';

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

describe('Auth Security Policies', () => {
  let set: jest.Mock;
  let get: jest.Mock;
  let authSlice: AuthSlice;
  let mockSupabase: any;

  beforeEach(() => {
    set = jest.fn();
    
    // Initial state mock
    const state: Partial<StoreState> = {
      users: MOCK_USERS,
      currentUser: { id: 'user-1', name: 'Test User', role: 'ADMIN', permissions: [] },
      isAuthenticated: true,
      settings: {
          restaurantName: 'Test',
          supabaseConfig: { enabled: true }
      } as any,
      addNotification: jest.fn(),
      addAuditLog: jest.fn(),
      logout: jest.fn(), // Mock logout as it's called by validateSession
    };
    
    get = jest.fn(() => state);

    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create the slice
    authSlice = createAuthSlice(set, get, {} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear document cookie mock if any
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
    });
  });

  describe('Session Verification on Startup', () => {
    it('should validate session successfully when cookie exists', async () => {
      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        value: 'pin_session=valid_token; path=/',
        writable: true,
      });

      const isValid = await authSlice.validateSession();

      expect(isValid).toBe(true);
      expect(get().logout).not.toHaveBeenCalled();
    });

    it('should validate session successfully when Supabase session exists (even without cookie)', async () => {
      // No cookie
      Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true,
      });

      // Valid Supabase session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      const isValid = await authSlice.validateSession();

      expect(isValid).toBe(true);
      expect(get().logout).not.toHaveBeenCalled();
    });

    it('should invalidate session and logout when neither cookie nor Supabase session exists', async () => {
      // No cookie
      Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true,
      });

      // No Supabase session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const isValid = await authSlice.validateSession();

      expect(isValid).toBe(false);
      expect(get().logout).toHaveBeenCalled();
      expect(logger.auth).toHaveBeenCalledWith(
        expect.stringContaining('Sessão inválida'),
        expect.anything()
      );
    });
  });

  describe('Unauthorized Access Logging', () => {
    it('should log audit event on logout', async () => {
        // We need to use the real logout implementation for this test, not the mock
        // So we recreate the slice with the real logout function but mocked dependencies
        const realLogoutSlice = createAuthSlice(set, get, {} as any);
        
        await realLogoutSlice.logout();

        expect(get().addAuditLog).toHaveBeenCalledWith(expect.objectContaining({
            action: 'USER_LOGOUT',
            details: expect.stringContaining('terminou sessão'),
        }));
    });
  });

  describe('Admin/Owner Access Control', () => {
      it('should enforce strict permission checks', () => {
          // Admin has all permissions
          get.mockReturnValue({ currentUser: { role: 'ADMIN' } });
          expect(authSlice.hasPermission('any_permission')).toBe(true);

          // Owner has all permissions
          get.mockReturnValue({ currentUser: { role: 'OWNER' } });
          expect(authSlice.hasPermission('any_permission')).toBe(true);

          // Regular user without permission
          get.mockReturnValue({ currentUser: { role: 'USER', permissions: [] } });
          expect(authSlice.hasPermission('restricted_action')).toBe(false);

          // Regular user with specific permission
          get.mockReturnValue({ currentUser: { role: 'USER', permissions: ['restricted_action'] } });
          expect(authSlice.hasPermission('restricted_action')).toBe(true);
      });
  });
});
