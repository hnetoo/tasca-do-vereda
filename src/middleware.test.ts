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
      url: 'http://localhost:3000/admin/owner/dashboard',
      nextUrl: {
        pathname: '/admin/owner/dashboard',
        clone: jest.fn().mockReturnThis(),
        searchParams: new URLSearchParams(),
      },
      cookies: {
        getAll: jest.fn(),
        set: jest.fn(),
        has: jest.fn(() => false),
        get: jest.fn(),
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

  it('should redirect authenticated ADMIN from /login to /admin/owner', async () => {
    mockRequest.nextUrl.pathname = '/login';
    mockUser.user_metadata.role = 'ADMIN';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/admin/owner');
  });

  it('should redirect authenticated USER from /login to /dashboard', async () => {
    mockRequest.nextUrl.pathname = '/login';
    mockUser.user_metadata.role = 'USER';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/dashboard');
  });

  it('should redirect PIN authenticated ADMIN from /login to /admin/owner', async () => {
    mockRequest.nextUrl.pathname = '/login';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null }); // Not logged in via Supabase
    
    // Simulate PIN session cookie
    mockRequest.cookies.has.mockReturnValue(true);
    mockRequest.cookies.get = jest.fn().mockReturnValue({ value: 'pin_session=true; userId=123; userRole=ADMIN' });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/admin/owner');
  });
});
