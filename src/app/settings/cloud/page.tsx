'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Cloud, RefreshCw, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function CloudPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Sincronização na Nuvem</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sync Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Status de Sincronização</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Conexão com Servidor</span>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Online
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-300">Última Sincronização</span>
                  </div>
                  <span className="text-white font-medium">Há 2 min</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-slate-300">Dados Pendentes</span>
                  </div>
                  <span className="text-white font-medium">3 itens</span>
                </div>
              </div>

              <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar Agora
              </button>
            </div>
          </div>

          {/* Backup Configuration */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Configuração de Backup</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Backup Automático</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                <span className="text-sm text-slate-400">Backup diário às 02:00</span>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Frequência</span>
                  <select className="bg-slate-700 border border-slate-600 rounded-lg text-white px-3 py-1 text-sm">
                    <option>Diário</option>
                    <option>Semanal</option>
                    <option>Mensal</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Último Backup</span>
                  <span className="text-white font-medium">Ontem, 02:00</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Restaurar
                </button>
              </div>
            </div>
          </div>

          {/* Data Sync Details */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Detalhes de Sincronização</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Pedidos</span>
                  <span className="text-green-400 text-sm">✓ Sincronizado</span>
                </div>
                <div className="text-sm text-slate-400">Último: Há 5 min</div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Produtos</span>
                  <span className="text-green-400 text-sm">✓ Sincronizado</span>
                </div>
                <div className="text-sm text-slate-400">Último: Há 1 hora</div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Clientes</span>
                  <span className="text-yellow-400 text-sm">⏸ Pendente</span>
                </div>
                <div className="text-sm text-slate-400">3 alterações</div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Finanças</span>
                  <span className="text-green-400 text-sm">✓ Sincronizado</span>
                </div>
                <div className="text-sm text-slate-400">Último: Há 2 min</div>
              </div>
            </div>
          </div>

          {/* Cloud Storage */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Armazenamento na Nuvem</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Espaço Utilizado</span>
                  <span className="text-white font-medium">2.3 GB / 10 GB</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Plano Atual</span>
                  <span className="text-white font-medium">Básico</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Renovação</span>
                  <span className="text-white font-medium">15/03/2024</span>
                </div>
              </div>

              <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Gerenciar Plano
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
