import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Login from './page';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/store/useStore', () => ({
  useStore: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('@/services/cryptoService', () => ({
  CryptoService: {
    initialize: jest.fn(),
  },
}));

jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    security: jest.fn(),
    auth: jest.fn(),
  },
}));

describe('Login Component Redirection Logic', () => {
  let mockPush: jest.Mock;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    mockSearchParams = new URLSearchParams();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  const setupStore = (isAuthenticated: boolean, role: string) => {
    (useStore as unknown as jest.Mock).mockReturnValue({
      login: jest.fn(),
      loginWithPassword: jest.fn(),
      users: [],
      settings: { restaurantName: 'Test Restaurant' },
      isInitialized: true,
      isAuthenticated,
      currentUser: isAuthenticated ? { id: '1', name: 'Test User', role } : null,
    });
  };

  it('should redirect ADMIN to /admin/owner upon authentication', async () => {
    setupStore(true, 'ADMIN');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/owner');
    });
  });

  it('should redirect OWNER to /admin/owner upon authentication', async () => {
    setupStore(true, 'OWNER');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/owner');
    });
  });

  it('should redirect CAIXA (Staff) to /dashboard upon authentication', async () => {
    setupStore(true, 'CAIXA');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect GARCOM (Staff) to /dashboard upon authentication', async () => {
    setupStore(true, 'GARCOM');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should prioritize redirect_to query parameter if present', async () => {
    mockSearchParams.set('redirect_to', '/inventory');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    setupStore(true, 'ADMIN');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/inventory');
    });
  });

  it('should ignore redirect_to if it is /login', async () => {
    mockSearchParams.set('redirect_to', '/login');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    setupStore(true, 'ADMIN');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/owner');
    });
  });

  it('should NOT redirect if NOT authenticated', async () => {
    setupStore(false, '');
    render(<Login />);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
