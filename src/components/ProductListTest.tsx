import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { databaseOperations } from '@/services/database/operations';

const ProductListTest = () => {
  const { products, setProducts } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Direct DB call to verify table content independent of store state
        const dbProducts = await databaseOperations.getProducts();
        console.log('ProductListTest: Fetched products from DB', dbProducts);
        
        if (dbProducts.length > 0) {
            setProducts(dbProducts);
        } else {
            console.warn('ProductListTest: No products found in DB');
        }
      } catch (err: any) {
        console.error('ProductListTest: Error loading products', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [setProducts]);

  if (loading) return <div className="p-4 text-white">Carregando teste de produtos...</div>;
  if (error) return <div className="p-4 text-red-500">Erro: {error}</div>;

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">TESTE DE FOGO: Tabela Products</h1>
      <div className="mb-4 text-sm text-slate-400">
        Total de produtos: {products.length}
      </div>
      
      {products.length === 0 ? (
        <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded">
          A tabela &apos;products&apos; parece vazia ou não foi carregada. Verifique se a migração ocorreu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="p-4 border border-white/10 rounded bg-white/5">
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400">{p.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-mono text-primary">{p.price} Kz</span>
                <span className="text-xs px-2 py-1 rounded bg-white/10">
                  {p.category_id}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Stock: {p.track_stock ? `${p.stock_quantity} ${p.unit}` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListTest;
