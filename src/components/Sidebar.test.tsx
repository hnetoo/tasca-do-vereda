import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import { useStore } from '../store/useStore';
import { usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('../store/useStore', () => ({
  useStore: jest.fn(),
}));

const createMockStore = () => configureStore({
  reducer: { auth: authReducer },
  preloadedState: {
    auth: {
      user: null,
      isAuthenticated: false,
      isLocked: false,
      loading: false,
      error: null,
    }
  }
});

const renderWithRedux = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(<Provider store={store}>{component}</Provider>);
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useStore as unknown as jest.Mock).mockReturnValue({
      logout: jest.fn(),
      settings: { appLogoUrl: '' },
      isMobileMenuOpen: false,
      toggleMobileMenu: jest.fn(),
    });
  });

  it('should render the mobile toggle button when showSidebar is true', () => {
    renderWithRedux(<Sidebar showSidebar={true} />);
    const toggleButton = screen.getByLabelText('Toggle Menu');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should NOT render the mobile toggle button when showSidebar is false', () => {
    renderWithRedux(<Sidebar showSidebar={false} />);
    const toggleButton = screen.queryByLabelText('Toggle Menu');
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('should show owner menu items when path starts with /owner', () => {
    (usePathname as jest.Mock).mockReturnValue('/owner/dashboard');
    renderWithRedux(<Sidebar showSidebar={true} />);
    expect(screen.getByText('Gestão de Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Finanças')).toBeInTheDocument();
  });

  it('should show general menu items when path does not start with /owner', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    renderWithRedux(<Sidebar showSidebar={true} />);
    expect(screen.getByText('Comando')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(screen.getByText('Encomendas')).toBeInTheDocument();
    expect(screen.queryByText('Categorias')).not.toBeInTheDocument();
    expect(screen.queryByText('Produtos')).not.toBeInTheDocument();
  });
});
