'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugTablesPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<any>(null);

  useEffect(() => {
    const inspectTable = async () => {
      try {
        console.log('🔍 Inspecionando estrutura real da tabela restaurant_tables...');
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Buscar uma linha só para ver as colunas
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .limit(1);

        if (error) {
          console.error('❌ Erro ao inspecionar tabela:', error);
          setError(error.message);
          return;
        }

        if (data && data.length > 0) {
          const realColumns = Object.keys(data[0]);
          console.log('🎯 COLUNAS REAIS:', realColumns);
          console.log('🎯 DADOS EXEMPLO:', data[0]);
          
          setColumns(realColumns);
          setSampleData(data[0]);
        } else {
          console.log('⚠️ Tabela vazia');
        }
      } catch (err) {
        console.error('❌ Erro ao inspecionar:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    inspectTable();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔍 COLUNAS REAIS - restaurant_tables
        </h1>
        
        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">🔍 Carregando...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">❌ Erro: {error}</p>
          </div>
        )}
        
        {columns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 COLUNAS REAIS ENCONTRADAS:
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {columns.map((column, index) => (
                <div 
                  key={index}
                  className="bg-blue-50 border border-blue-200 rounded px-3 py-2"
                >
                  <code className="text-blue-800 text-sm">{column}</code>
                </div>
              ))}
            </div>
            
            {sampleData && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📋 DADOS EXEMPLO:
                </h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(sampleData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ COPIAR ESTAS COLUNAS PARA CORREÇÃO:
          </h3>
          <p className="text-yellow-700">
            Use estas colunas exatas na query em src/app/actions/tableLayout.ts
          </p>
        </div>
      </div>
    </div>
  );
}
