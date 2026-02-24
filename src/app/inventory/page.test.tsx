import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryPage from './page';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(),
}));

jest.mock('@/store/useStore', () => ({
  useStore: jest.fn(),
}));

describe('InventoryPage', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/inventory');
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams()); // Default to empty search params

    (useStore as unknown as jest.Mock).mockReturnValue({
      dishes: [],
      categories: [],
      stock: [],
      suppliers: [],
      addDish: jest.fn(),
      updateDish: jest.fn(),
      removeDish: jest.fn(),
      addCategory: jest.fn(),
      removeCategory: jest.fn(),
      updateCategory: jest.fn(),
      addStockItem: jest.fn(),
      updateStockItem: jest.fn(),
      removeStockItem: jest.fn(),
      updateStockQuantity: jest.fn(),
      setDishes: jest.fn(),
      addNotification: jest.fn(),
      scanAndRecoverCategories: jest.fn(),
      triggerSync: jest.fn(),
      integrityIssues: [],
      isDiagnosing: false,
      runIntegrityDiagnostics: jest.fn(),
      performSafeCleanup: jest.fn(),
      settings: { appLogoUrl: '' },
      isMobileMenuOpen: false,
      toggleMobileMenu: jest.fn(),
      employees: [],
      tables: [],
    });
  });

  it('should render "Novo Produto" button when activeTab is "menu"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=menu'));
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Novo Produto/i })).toBeInTheDocument();
  });

  it('should render "Novo Produto" button when activeTab is "categories"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=categories'));
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Novo Produto/i })).toBeInTheDocument();
  });

  it('should render "Novo Item" button when activeTab is "stock"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=stock'));
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Novo Item/i })).toBeInTheDocument();
  });

  it('should render "Sincronizar Cloud" button', () => {
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Sincronizar Cloud/i })).toBeInTheDocument();
  });

  it('should render "Exportar Menu JSON" button', () => {
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Exportar Menu JSON/i })).toBeInTheDocument();
  });

  it('should render "Publicar Menu (Hybrid)" button', () => {
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Publicar Menu \(Hybrid\)/i })).toBeInTheDocument();
  });

  it('should render "Otimizar Fotos" button when activeTab is "menu"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=menu'));
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Otimizar Fotos/i })).toBeInTheDocument();
  });

  it('should not render "Otimizar Fotos" button when activeTab is not "menu"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=categories'));
    render(<InventoryPage />);
    expect(screen.queryByRole('button', { name: /Otimizar Fotos/i })).not.toBeInTheDocument();
  });

  it('should render "Restaurar" button when activeTab is "categories"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=categories'));
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Restaurar/i })).toBeInTheDocument();
  });

  it('should not render "Restaurar" button when activeTab is not "categories"', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('tab=menu'));
    render(<InventoryPage />);
    expect(screen.queryByRole('button', { name: /Restaurar/i })).not.toBeInTheDocument();
  });

  it('should display the correct tab labels', () => {
    render(<InventoryPage />);
    expect(screen.getByRole('button', { name: /Produtos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categorias/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Integridade/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estoque/i })).toBeInTheDocument();
  });
});
