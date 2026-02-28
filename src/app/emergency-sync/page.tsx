'use client';

import React, { useState } from 'react';

export default function EmergencySyncPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const getLocalStorageData = () => {
    try {
      const storageData = localStorage.getItem('tasca-vereda-storage-v2');
      if (!storageData) {
        setError('Nenhum dado encontrado no localStorage');
        return null;
      }

      const parsed = JSON.parse(storageData);
      console.log('📦 LocalStorage data:', parsed);
      
      // Extrair dados importantes
      const data = {
        orders: parsed.orders || [],
        dishes: parsed.dishes || [],
        expenses: parsed.expenses || [],
        activeOrders: parsed.activeOrders || []
      };

      console.log('📊 Extracted data:', {
        orders: data.orders.length,
        dishes: data.dishes.length,
        expenses: data.expenses.length,
        activeOrders: data.activeOrders.length
      });

      return data;
    } catch (err: any) {
      setError(`Erro ao ler localStorage: ${err.message}`);
      return null;
    }
  };

  const emergencySync = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = getLocalStorageData();
      if (!data) return;

      console.log('🚨 Starting emergency sync...');
      
      const response = await fetch('/api/emergency-sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log('📊 Sync result:', result);

      if (result.success) {
        setResult(result);
      } else {
        setError(result.error || 'Erro na sincronização');
      }

    } catch (err: any) {
      setError(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/emergency-sync', {
        method: 'POST'
      });
      const result = await response.json();
      setResult(result);
    } catch (err: any) {
      setError(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-red-500">
          🚨 FUNÇÃO DE EMERGÊNCIA - SYNC PARA SUPABASE
        </h1>

        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-red-400">⚠️ AVISO IMPORTANTE</h2>
          <ul className="space-y-2 text-sm">
            <li>• Esta função deve ser usada apenas em emergência</li>
            <li>• Faça backup completo antes de prosseguir</li>
            <li>• Os dados serão sincronizados com o Supabase</li>
            <li>• Mobile continuará a zeros até este processo</li>
          </ul>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={testConnection}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            🔍 Testar Conexão com API
          </button>

          <button 
            onClick={emergencySync}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Sincronizando...' : '🚨 SINCRONIZAR DADOS EMERGÊNCIA'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-400 mb-2">❌ Erro:</h3>
            <pre className="text-sm text-red-300">{error}</pre>
          </div>
        )}

        {result && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="font-bold text-green-400 mb-2">✅ Resultado:</h3>
            <pre className="text-sm text-green-300 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 text-xs text-gray-400">
          <h3 className="font-bold mb-2">📋 Instruções:</h3>
          <ol className="space-y-1">
            <li>1. Clique em &quot;Testar Conexão&quot; para verificar API</li>
            <li>2. Se OK, clique em &quot;Sincronizar Dados Emergência&quot;</li>
            <li>3. Aguarde o processo completar</li>
            <li>4. Verifique resultado no console</li>
            <li>5. Teste mobile após sync</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
