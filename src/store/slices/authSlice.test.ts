import authReducer, { logoutUser, logout, resetAuthStatus, setUserSession, loginWithPin } from './authSlice';
import { StoreState } from '@/types';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { MOCK_USERS } from '@/constants/index';
import { configureStore } from '@reduxjs/toolkit';
import { AuthState } from '@/types/auth.types';
import { supabaseAuthService } from '@/services/supabaseAuth.service';

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

jest.mock('@/services/supabaseAuth.service', () => ({
  supabaseAuthService: {
    loginWithPin: jest.fn(),
  },
}));

// Mock utils/crypto calculateHash since it's used in login (pin)
jest.mock('@/utils/crypto', () => ({
  calculateHash: jest.fn(),
}));

// Mock store setup
const createMockStore = (initialState?: Partial<AuthState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLocked: false,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

describe('AuthSlice', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logoutUser', () => {
    let setCookieSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on the document.cookie setter
      setCookieSpy = jest.spyOn(document, 'cookie', 'set');
    });

    afterEach(() => {
      setCookieSpy.mockRestore(); // Restore the original setter
    });

    it('should logout successfully and clear session', async () => {
      // Set up initial state with an authenticated user
      const store = createMockStore({
        user: { id: '1', name: 'Test User', role: 'ADMIN', email: 'test@example.com', pin: '1234', metadata: {} },
        isAuthenticated: true,
      });

      await store.dispatch(logoutUser() as any);

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      // Verify cookies are cleared by checking the setter calls
      expect(setCookieSpy).toHaveBeenCalledWith('tasca_auth_token=; path=/; max-age=0; SameSite=Lax');
      expect(setCookieSpy).toHaveBeenCalledWith('pin_session=; path=/; max-age=0; SameSite=Lax');
    });
  });

  describe('loginWithPin', () => {
    it('should set loading to true when loginWithPin is pending', async () => {
      const store = createMockStore();
      store.dispatch(loginWithPin({ pin: '1234', role: 'ADMIN' }) as any);
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle successful loginWithPin', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        pin: '1234',
        metadata: {},
      };
      (supabaseAuthService.loginWithPin as jest.Mock).mockResolvedValue({ user: mockUser });

      const store = createMockStore();
      await store.dispatch(loginWithPin({ pin: '1234', role: 'ADMIN' }) as any);

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it('should handle failed loginWithPin', async () => {
      const mockError = { type: 'CredenciaisInvalidas', message: 'PIN inválido' };
      (supabaseAuthService.loginWithPin as jest.Mock).mockRejectedValue(mockError);

      const store = createMockStore();
      await store.dispatch(loginWithPin({ pin: 'wrong', role: 'ADMIN' }) as any);

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toEqual(mockError);
    });
  });

  describe('setUserSession', () => {
    it('should set user session and authenticate', () => {
      const store = createMockStore();
      const mockUser = { id: '1', name: 'Test User', role: 'ADMIN', email: 'test@example.com', pin: '1234', metadata: {} };
      store.dispatch(setUserSession(mockUser));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('should clear session if null user is provided', () => {
      const store = createMockStore({
        user: { id: '1', name: 'Test User', role: 'ADMIN', email: 'test@example.com', pin: '1234', metadata: {} },
        isAuthenticated: true,
      });
      store.dispatch(setUserSession(null));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('resetAuthStatus', () => {
    it('should reset auth status to initial state', () => {
      const store = createMockStore({
        user: { id: '1', name: 'Test User', role: 'ADMIN', email: 'test@example.com', pin: '1234', metadata: {} },
        isAuthenticated: true,
        isLocked: true,
        error: { type: 'SomeError', message: 'Error message' },
        loading: true,
      });
      store.dispatch(resetAuthStatus());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLocked).toBe(false);
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
