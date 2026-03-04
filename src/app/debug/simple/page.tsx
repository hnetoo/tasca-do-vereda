'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugSimplePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testDirect = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Teste 1: Verificar se tabela existe
        console.log('🔍 Teste 1: Verificando se tabela existe...');
        const { data: testData, error: testError } = await supabase
          .from('restaurant_tables')
          .select('count')
          .limit(1);

        if (testError) {
          setResult(`❌ ERRO TABELA: ${testError.message}`);
          return;
        }

        // Teste 2: Buscar dados reais
        console.log('🔍 Teste 2: Buscando dados reais...');
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .limit(1);

        if (error) {
          setResult(`❌ ERRO DADOS: ${error.message}`);
          return;
        }

        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          const sampleData = data[0];
          
          setResult(`
✅ SUCESSO - TABELA ENCONTRADA!
🎯 COLUNAS REAIS: ${columns.join(', ')}
📋 EXEMPLO: ${JSON.stringify(sampleData, null, 2)}
📊 TOTAL: ${data.length} registros
          `.trim());
        } else {
          setResult('⚠️ TABELA EXISTE MAS ESTÁ VAZIA');
        }

      } catch (err) {
        setResult(`❌ ERRO GERAL: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };

    testDirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          🔍 DEBUG SIMPLES - Sem Erros
        </h1>
        
        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">🔍 Testando conexão...</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 RESULTADO:
          </h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {result || 'Carregando...'}
          </pre>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💡 INSTRUÇÕES:
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Verificar o resultado acima</li>
            <li>Copiar as colunas reais</li>
            <li>Usar apenas essas colunas no código</li>
            <li>Não inventar nomes de colunas</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
