import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Login from './page';
import { useRouter, useSearchParams } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import { UserRole } from '@/types/auth.types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
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

// Mock supabaseAuthService to avoid delay and ensure success
jest.mock('@/services/supabaseAuth.service', () => ({
  supabaseAuthService: {
    loginWithPin: jest.fn((pin, role) => {
      return Promise.resolve({
        user: {
          id: '1',
          name: 'Test User',
          role: role,
          pin: 'hashed',
          email: 'test@example.com'
        },
        role: role,
        authenticatedAt: Date.now()
      });
    })
  }
}));

const createMockStore = (preloadedState: any) => configureStore({
  reducer: { auth: authReducer },
  preloadedState
});

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

  const renderWithRedux = (component: React.ReactElement, initialState: any = {}) => {
    const store = createMockStore(initialState);
    return render(<Provider store={store}>{component}</Provider>);
  };

  const performLogin = async (roleName: string, pin: string) => {
    // 1. Click on role card
    const roleButton = screen.getByText(roleName);
    fireEvent.click(roleButton);

    // 2. Enter PIN
    const pinInput = screen.getByPlaceholderText('Digite seu PIN');
    fireEvent.change(pinInput, { target: { value: pin } });

    // 3. Click Submit
    const submitButton = screen.getByText('Entrar');
    fireEvent.click(submitButton);
  };

  it('should redirect ADMIN to /dashboard upon authentication', async () => {
    renderWithRedux(<Login />);
    await performLogin('Gerente', '1234');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect OWNER to /dashboard upon authentication', async () => {
    renderWithRedux(<Login />);
    await performLogin('Proprietário', '5678');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect CAIXA (Staff) to /dashboard upon authentication', async () => {
    renderWithRedux(<Login />);
    await performLogin('Operador de Caixa', '1111');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect GARCOM (Staff) to /dashboard upon authentication', async () => {
    renderWithRedux(<Login />);
    await performLogin('Garçom', '3333');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('should redirect to redirect_to param if present', async () => {
    mockSearchParams.set('redirect_to', '/inventory');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    renderWithRedux(<Login />);
    await performLogin('Gerente', '1234');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/inventory');
    });
  });
});
