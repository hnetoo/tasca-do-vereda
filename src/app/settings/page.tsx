'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Settings, Users, CreditCard, FileText, Database, Shield, 
  DollarSign, Activity, ArrowLeft, Clock, TrendingUp
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Configurações</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Card */}
          <Link
            href="/settings/general"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <Settings className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Geral</h3>
            <p className="text-slate-400 text-sm mb-4">
              Informações do restaurante e configurações básicas
            </p>
            <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Fiscal Card */}
          <Link
            href="/settings/fiscal"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fiscal</h3>
            <p className="text-slate-400 text-sm mb-4">
              AGT, impostos e relatórios SAFT-T
            </p>
            <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Cloud Card */}
          <Link
            href="/settings/cloud"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                <Database className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nuvem</h3>
            <p className="text-slate-400 text-sm mb-4">
              Sincronização e backup automático
            </p>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Users Card */}
          <Link
            href="/settings/users"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gestão de Acesso</h3>
            <p className="text-slate-400 text-sm mb-4">
              Usuários da App com PINs e permissões
            </p>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Staff Card */}
          <Link
            href="/settings/staff"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                <Users className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Staff do Restaurante</h3>
            <p className="text-slate-400 text-sm mb-4">
              Funcionários sem PIN, apenas dados contratuais
            </p>
            <div className="flex items-center text-orange-400 group-hover:text-orange-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Payroll Card */}
          <Link
            href="/settings/payroll"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Folha Salarial</h3>
            <p className="text-slate-400 text-sm mb-4">
              Gestão de pagamentos com exportação PDF
            </p>
            <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Menu Digital Card */}
          <Link
            href="/settings/menu-digital"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-xl group-hover:bg-indigo-500/30 transition-colors">
                <Activity className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Menu Digital & QR Code</h3>
            <p className="text-slate-400 text-sm mb-4">
              Menu online com sincronização automática
            </p>
            <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* History Card */}
          <Link
            href="/settings/history"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Histórico Externo</h3>
            <p className="text-slate-400 text-sm mb-4">
              Importe dados financeiros de sistemas anteriores
            </p>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Configurar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Health Card */}
          <Link
            href="/settings/health"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                <Activity className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Base de Dados</h3>
            <p className="text-slate-400 text-sm mb-4">
              Status da conexão e logs de erro
            </p>
            <div className="flex items-center text-red-400 group-hover:text-red-300 transition-colors">
              <span className="text-sm font-medium">Verificar</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
