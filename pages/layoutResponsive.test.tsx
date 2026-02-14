import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CategoryMenu } from '../components/public-menu/CategoryMenu';
import { ProductMenu } from '../components/public-menu/ProductMenu';
import Login from './Login';

vi.mock('../store/useStore', () => ({
  useStore: () => ({
    login: vi.fn(),
    users: [],
    settings: {
      restaurantName: 'Tasca',
      appLogoUrl: ''
    }
  })
}));

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
} as Storage;

describe('Responsividade de layout', () => {
  it('usa layout horizontal no CategoryMenu quando mobile', () => {
    const html = renderToString(
      <CategoryMenu
        categories={[{ id: '1', name: 'Entradas', icon: '', sort_order: 0, is_active: true }]}
        selectedCatId="TODOS"
        onSelectCategory={() => undefined}
        categoryCounts={{ TODOS: 1, '1': 1 }}
        isSidebarOpen={false}
      />
    );

    expect(html).toContain('snap-x');
    expect(html).toContain('min-w-[170px]');
  });

  it('usa layout vertical no CategoryMenu quando sidebar', () => {
    const html = renderToString(
      <CategoryMenu
        categories={[{ id: '1', name: 'Entradas', icon: '', sort_order: 0, is_active: true }]}
        selectedCatId="1"
        onSelectCategory={() => undefined}
        categoryCounts={{ TODOS: 1, '1': 1 }}
        isSidebarOpen={true}
      />
    );

    expect(html).toContain('flex flex-col');
    expect(html).toContain('w-full');
  });

  it('aplica breakpoints de grid no ProductMenu', () => {
    const html = renderToString(
      <ProductMenu
        products={[{ id: '1', name: 'Prato', price: 10, categoryId: '1', disponivel: true, taxCode: 'NOR', taxPercentage: 14 }]}
        selectedCatId="TODOS"
        viewMode="grid"
        searchTerm=""
        cart={{}}
        onProductClick={() => undefined}
        onAddToCart={() => undefined}
        onUpdateCart={() => undefined}
        formatPrice={(val) => String(val)}
        imageErrorMap={{}}
        setImageErrorMap={() => undefined}
      />
    );

    expect(html).toContain('sm:grid-cols-2');
    expect(html).toContain('2xl:grid-cols-5');
  });

  it('centraliza e aumenta o login com dimensões responsivas', () => {
    const html = renderToString(<Login />);
    expect(html).toContain('min-h-[100dvh]');
    expect(html).toContain('max-w-xl');
  });
});
