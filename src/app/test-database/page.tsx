'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { generateUUID } from '@/utils/uuid';
import { MenuCategory, Dish } from '@/types';

export default function TestDatabasePage() {
  const { addCategory, addDish, categories, dishes } = useStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testCategory = async () => {
    addLog('🧪 Testando criação de categoria...');
    try {
      const newCategory: MenuCategory = {
        id: generateUUID(),
        name: `Teste ${Date.now()}`,
        icon: 'Tag',
        sortOrder: 999,
        isActive: true,
        isAvailableOnDigitalMenu: true
      };
      
      addLog(`📦 Categoria: ${JSON.stringify(newCategory)}`);
      
      // Adicionar ao store
      await addCategory(newCategory);
      
      addLog('✅ Categoria adicionada ao store');
      
      // Verificar se está na lista
      const found = categories.find((c: any) => c.id === newCategory.id);
      if (found) {
        addLog('✅ Categoria encontrada na lista');
      } else {
        addLog('❌ Categoria NÃO encontrada na lista');
      }
    } catch (error: any) {
      addLog(`❌ Erro: ${error?.message || String(error)}`);
    }
  };

  const testDish = async () => {
    addLog('🧪 Testando criação de produto...');
    try {
      if (categories.length === 0) {
        addLog('❌ Nenhuma categoria disponível');
        return;
      }
      
      const newDish: Dish = {
        id: generateUUID(),
        name: `Produto Teste ${Date.now()}`,
        description: 'Produto de teste',
        price: 1000,
        categoryId: categories[0]?.id,
        isActive: true,
        available: true,
        isAvailableOnDigitalMenu: true,
        taxCode: 'NOR',
        trackStock: false,
        stockQuantity: 0,
        minStockQuantity: 0,
        unit: 'unidade'
      };
      
      addLog(`📦 Produto: ${JSON.stringify(newDish)}`);
      
      const success = await addDish(newDish);
      
      if (success) {
        addLog('✅ Produto adicionado com sucesso');
      } else {
        addLog('❌ Falha ao adicionar produto');
      }
      
      // Verificar se está na lista
      const found = dishes.find((d: any) => d.id === newDish.id);
      if (found) {
        addLog('✅ Produto encontrado na lista');
      } else {
        addLog('❌ Produto NÃO encontrado na lista');
      }
    } catch (error: any) {
      addLog(`❌ Erro: ${error?.message || String(error)}`);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setLogs([]);
    addLog('🚀 Iniciando testes...');
    
    await testCategory();
    await new Promise(r => setTimeout(r, 500));
    await testDish();
    
    addLog('✅ Testes concluídos');
    setIsTesting(false);
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🧪 Teste da Base de Dados</h1>
      
      <div className="flex gap-4 mb-8">
        <button
          onClick={runAllTests}
          disabled={isTesting}
          className="bg-primary text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {isTesting ? 'Testando...' : 'Executar Testes'}
        </button>
        
        <button
          onClick={() => setLogs([])}
          className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold"
        >
          Limpar Logs
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">📋 Logs</h2>
          <div className="bg-gray-900 p-4 rounded-xl h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Clique em &quot;Executar Testes&quot; para começar</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">📊 Estado Atual</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-xl">
              <h3 className="font-bold mb-2">Categorias ({categories.length})</h3>
              <div className="max-h-32 overflow-y-auto">
                {categories.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="text-sm text-gray-400">{c.name}</div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-xl">
              <h3 className="font-bold mb-2">Produtos ({dishes.length})</h3>
              <div className="max-h-32 overflow-y-auto">
                {dishes.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="text-sm text-gray-400">{d.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
