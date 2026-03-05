'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, CheckCircle, AlertTriangle, Server, Database, Wifi, HardDrive } from 'lucide-react';

export default function HealthPage() {
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
                <Activity className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Saúde do Sistema</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Status Geral do Sistema</h2>
              <p className="text-slate-400">Todos os sistemas estão operacionais</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-green-500">Saudável</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-orange-500" />
              Status do Servidor
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">CPU</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <span className="text-green-400 text-sm">35%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Memória RAM</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="text-yellow-400 text-sm">68%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Disco</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-green-400 text-sm">45%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Uptime</span>
                  <span className="text-white font-medium">15 dias, 8 horas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Base de Dados
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Conexão</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Ativa
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Tamanho do BD</span>
                  <span className="text-white font-medium">1.2 GB</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Queries/min</span>
                  <span className="text-white font-medium">245</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Último Backup</span>
                  <span className="text-white font-medium">Ontem, 02:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-orange-500" />
              Rede
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Conexão Internet</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    Estável
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Latência</span>
                  <span className="text-white font-medium">12 ms</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Download</span>
                  <span className="text-white font-medium">85 Mbps</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Upload</span>
                  <span className="text-white font-medium">42 Mbps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Status */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-orange-500" />
              Armazenamento
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Espaço Total</span>
                  <span className="text-white font-medium">500 GB</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="text-sm text-slate-400 mt-1">325 GB usados</div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Logs</span>
                  <span className="text-white font-medium">2.3 GB</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Backups</span>
                  <span className="text-white font-medium">45 GB</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cache</span>
                  <span className="text-white font-medium">8.7 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6 bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6">Alertas do Sistema</h3>
          
          <div className="space-y-3">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <div className="text-white font-medium">Uso de Memória Elevado</div>
                <div className="text-sm text-slate-400">A memória RAM está a 68% de capacidade</div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="text-white font-medium">Backup Concluído</div>
                <div className="text-sm text-slate-400">Backup automático concluído com sucesso</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
