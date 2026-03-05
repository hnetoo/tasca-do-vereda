'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle } from 'lucide-react';

export default function FiscalPage() {
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
                <Shield className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Configurações Fiscais</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AGT Certification */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Certificação AGT</h2>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Status da Certificação</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Ativo
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Número de Certificado</span>
                  <span className="text-white font-medium">AGT-2024-001234</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Validade</span>
                  <span className="text-white font-medium">31/12/2024</span>
                </div>
              </div>

              <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Sincronizar com AGT
              </button>
            </div>
          </div>

          {/* Tax Configuration */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Configuração de Impostos</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Taxa de IVA (%)
                </label>
                <input
                  type="number"
                  defaultValue="14"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Taxa de Turismo (%)
                </label>
                <input
                  type="number"
                  defaultValue="2"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Taxa de Serviço (%)
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <button className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Salvar Configurações
              </button>
            </div>
          </div>

          {/* SAFT-T Reports */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Relatórios SAFT-T</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Último SAFT-T Gerado</span>
                  <span className="text-white font-medium">01/02/2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Período</span>
                  <span className="text-white font-medium">Janeiro/2024</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Gerar SAFT-T
                </button>
                <button className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Submeter AGT
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-400">Relatórios Anteriores:</div>
                <div className="space-y-1">
                  <div className="p-2 bg-slate-800 rounded text-sm flex items-center justify-between">
                    <span className="text-slate-300">Dezembro/2023</span>
                    <button className="text-blue-400 hover:text-blue-300">Download</button>
                  </div>
                  <div className="p-2 bg-slate-800 rounded text-sm flex items-center justify-between">
                    <span className="text-slate-300">Novembro/2023</span>
                    <button className="text-blue-400 hover:text-blue-300">Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fiscal Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Status Fiscal</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Sincronização AGT</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    OK
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Validação de Faturas</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Ativo
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Arquivamento Digital</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                    Pendente
                  </span>
                </div>
              </div>

              <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Verificar Conformidade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
