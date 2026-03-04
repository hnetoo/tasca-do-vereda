'use client';

import React from 'react';
import { useTableInspector } from '@/hooks/useTableInspector';

export default function TableInspectorPage() {
  const { columns, loading, error } = useTableInspector();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔍 Inspetor de Tabelas - restaurant_tables
        </h1>
        
        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">🔍 Inspecionando estrutura da tabela...</p>
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
            
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Total de colunas:</strong> {columns.length}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Próximo passo:</strong> Usar apenas estas colunas na query
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Instruções para Correção:
          </h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-2">
            <li>Verificar as colunas reais acima</li>
            <li>Atualizar a query em src/app/actions/tableLayout.ts</li>
            <li>Remover colunas inexistentes (posicao_x, posicao_y, ambiente, table_number)</li>
            <li>Usar apenas as colunas que aparecem na lista</li>
            <li>Testar no console do navegador</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
