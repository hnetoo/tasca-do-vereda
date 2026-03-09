'use client';

import React, { useState } from 'react';
import { directSupabaseService } from '@/services/directSupabaseService';

export default function QuickTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const runTest = async () => {
    setLoading(true);
    console.log('🚀 INICIANDO TESTE RÁPIDO...');
    
    try {
      // Testar mesas
      console.log('🔍 TESTANDO MESAS...');
      const tablesResult = await directSupabaseService.listTables();
      
      // Testar criar categoria Bebidas
      console.log('🔍 TESTANDO CRIAR CATEGORIA BEBIDAS...');
      const bebidasCategory = {
        id: crypto.randomUUID(),
        name: 'Bebidas',
        description: 'Todas as bebidas do menu',
        icon: '🥤',
        sort_order: 1,
        parent_id: null,
        isAvailableOnDigitalMenu: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createResult = await directSupabaseService.createCategory(bebidasCategory);
      
      // Testar listar categorias
      console.log('🔍 TESTANDO LISTAR CATEGORIAS...');
      const categoriesResult = await directSupabaseService.listCategories();
      
      // Testar pratos
      console.log('🔍 TESTANDO PRATOS...');
      const dishesResult = await directSupabaseService.listDishes();
      
      const testResults = {
        tables: tablesResult,
        createBebidas: createResult,
        categories: categoriesResult,
        dishes: dishesResult
      };
      
      setResults(testResults);
      
      console.log('📊 RESULTADOS:', testResults);
      
      const allSuccess = Object.values(testResults).every((r: any) => r.success);
      
      if (allSuccess) {
        console.log('🎉 TODOS OS TESTES PASSARAM!');
      } else {
        console.log('⚠️ ALGUNS TESTES FALHARAM');
      }
      
    } catch (error) {
      console.error('❌ ERRO NO TESTE:', error);
      setResults({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-lg border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">🚀 Teste Imediato Supabase</h2>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? 'Executando Teste...' : '🚀 Executar Teste Completo'}
      </button>

      {results.error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mb-4">
          <p className="text-red-400">❌ Erro: {results.error}</p>
        </div>
      )}

      {Object.keys(results).length > 0 && !results.error && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">📊 Resultados:</h3>
          
          {results.tables && (
            <div className={`p-3 rounded-lg border ${results.tables.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className={results.tables.success ? 'text-emerald-400' : 'text-red-400'}>
                🪑 Mesas: {results.tables.success ? `✅ ${results.tables.data?.length || 0} encontradas` : '❌ Erro'}
              </p>
              {results.tables.data && (
                <div className="mt-2 text-sm text-slate-300">
                  {results.tables.data.slice(0, 3).map((table: any, i: number) => (
                    <p key={i}>• Mesa {table.number} - {table.status}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {results.createBebidas && (
            <div className={`p-3 rounded-lg border ${results.createBebidas.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className={results.createBebidas.success ? 'text-emerald-400' : 'text-red-400'}>
                🥤 Bebidas: {results.createBebidas.success ? '✅ Criada com sucesso' : '❌ Erro'}
              </p>
              {results.createBebidas.data && (
                <p className="mt-2 text-sm text-slate-300">ID: {results.createBebidas.data.id}</p>
              )}
            </div>
          )}

          {results.categories && (
            <div className={`p-3 rounded-lg border ${results.categories.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className={results.categories.success ? 'text-emerald-400' : 'text-red-400'}>
                📋 Categorias: {results.categories.success ? `✅ ${results.categories.data?.length || 0} encontradas` : '❌ Erro'}
              </p>
              {results.categories.data && (
                <div className="mt-2 text-sm text-slate-300">
                  {results.categories.data.slice(0, 3).map((cat: any, i: number) => (
                    <p key={i}>• {cat.name} {cat.icon}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {results.dishes && (
            <div className={`p-3 rounded-lg border ${results.dishes.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className={results.dishes.success ? 'text-emerald-400' : 'text-red-400'}>
                🍽️ Pratos: {results.dishes.success ? `✅ ${results.dishes.data?.length || 0} encontrados` : '❌ Erro'}
              </p>
              {results.dishes.data && (
                <div className="mt-2 text-sm text-slate-300">
                  {results.dishes.data.slice(0, 3).map((dish: any, i: number) => (
                    <p key={i}>• {dish.name} - {dish.price} AKZ</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-slate-800 rounded-lg border border-white/10">
            <p className="text-slate-300 text-sm">
              📊 Verifique o console do browser para logs detalhados!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
