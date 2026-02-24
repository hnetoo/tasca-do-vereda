import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logoutUser } from '@/store/slices/authSlice';
import { logger } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { hasPermission } from '@/services/permissionsService';
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
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });



  describe('Logout User Thunk', () => {
    it('should dispatch logout and call supabase signOut', async () => {
      const store = configureStore({
        reducer: { auth: authReducer },
      });

      await store.dispatch(logoutUser() as any);

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
  });

  describe('Admin/Owner Access Control', () => {
    it('should enforce strict permission checks', () => {
      // Admin has all permissions
      expect(hasPermission('ADMIN', 'any_permission')).toBe(true);

      // Owner has all permissions
      expect(hasPermission('OWNER', 'any_permission')).toBe(true);

      // Regular user without permission
      expect(hasPermission('USER', 'restricted_action', undefined, [])).toBe(false);

      // Regular user with specific permission
      expect(hasPermission('USER', 'restricted_action', undefined, ['restricted_action'])).toBe(true);
    });
  });
});
