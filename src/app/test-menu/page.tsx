'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export default function TestMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('TestMenu: Starting fetch from products table...');
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) {
          console.error('TestMenu: Error fetching products:', error);
          setError(error.message);
        } else {
          console.log('TestMenu: Success! Products fetched:', data);
          setProducts(data || []);
        }
      } catch (err: any) {
        console.error('TestMenu: Unexpected error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Carga: Tabela Products</h1>
      
      {loading && <p>Carregando...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Erro: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <p className="mb-4">Total de produtos encontrados: <strong>{products.length}</strong></p>
          
          {products.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>Nenhum produto encontrado. A tabela &apos;products&apos; existe mas está vazia.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map(product => (
                <div key={product.id} className="border p-4 rounded shadow bg-white">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-600">ID: {product.id}</p>
                  <p className="text-green-600 font-bold">{product.price} Kz</p>
                  <p className="text-xs text-gray-500">
                    Disponível Digital: {product.is_available_on_digital_menu ? 'Sim' : 'Não'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Imagem: {product.image_url || 'Sem imagem'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
