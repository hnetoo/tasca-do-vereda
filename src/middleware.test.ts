import { middleware } from './middleware';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock dependencies
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

describe('Middleware', () => {
  let mockRequest: any;
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockRequest = {
      nextUrl: {
        pathname: '/admin/owner/dashboard',
        clone: jest.fn().mockReturnThis(),
        searchParams: new URLSearchParams(),
      },
      cookies: {
        getAll: jest.fn(),
        set: jest.fn(),
      },
    };

    mockUser = {
      id: 'user-123',
      user_metadata: { role: 'admin' },
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
    (NextResponse.next as jest.Mock).mockReturnValue({
      cookies: {
        set: jest.fn(),
      },
    });
  });

  it('should allow access to admin route for authenticated admin user', async () => {
    // User is authenticated and admin (default setup)
    await middleware(mockRequest);

    expect(createServerClient).toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    // Should proceed
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated user trying to access admin route', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(mockRequest.nextUrl.pathname).toBe('/login');
    expect(mockRequest.nextUrl.searchParams.get('redirect_to')).toBe('/admin/owner/dashboard');
  });

  it('should redirect unauthorized user (non-admin) trying to access admin route', async () => {
    mockUser.user_metadata.role = 'user'; // Not admin/owner
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(mockRequest.nextUrl.pathname).toBe('/login');
    expect(mockRequest.nextUrl.searchParams.get('error')).toBe('unauthorized');
  });

  it('should allow access to public routes (e.g. /login)', async () => {
    mockRequest.nextUrl.pathname = '/login';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated user trying to access protected route (e.g. /dashboard)', async () => {
    mockRequest.nextUrl.pathname = '/dashboard';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(mockRequest.nextUrl.pathname).toBe('/login');
    expect(mockRequest.nextUrl.searchParams.get('redirect_to')).toBe('/dashboard');
  });

  it('should allow authenticated user to access protected route (e.g. /dashboard)', async () => {
    mockRequest.nextUrl.pathname = '/dashboard';
    // User is authenticated (default setup)

    await middleware(mockRequest);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});
