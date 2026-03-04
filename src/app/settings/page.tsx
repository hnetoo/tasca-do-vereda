'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Table, 
  Users, 
  DollarSign, 
  Home,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Geral',
      description: 'Configurações básicas do sistema',
      icon: Settings,
      href: '/settings/general',
      color: 'from-gray-600 to-gray-700'
    },
    {
      title: 'Fiscal',
      description: 'Configurações fiscais e certificação',
      icon: Settings,
      href: '/settings/fiscal',
      color: 'from-orange-600 to-orange-700'
    },
    {
      title: 'Mesas',
      description: 'Criar, editar e organizar mesas do restaurante',
      icon: Table,
      href: '/settings/tables',
      color: 'from-blue-600 to-blue-700'
    },
    {
      title: 'Menu QR',
      description: 'Configurar menu digital e QR codes',
      icon: Settings,
      href: '/settings/qr',
      color: 'from-green-600 to-green-700'
    },
    {
      title: 'Financeiro',
      description: 'Folha de salário e gestão financeira',
      icon: DollarSign,
      href: '/settings/payroll',
      color: 'from-yellow-600 to-yellow-700'
    },
    {
      title: 'Utilizadores',
      description: 'Administrar usuários e permissões do sistema',
      icon: Users,
      href: '/settings/system/users',
      color: 'from-purple-600 to-purple-700'
    },
    {
      title: 'Cargos',
      description: 'Definir cargos e permissões',
      icon: Users,
      href: '/settings/system/roles',
      color: 'from-indigo-600 to-indigo-700'
    },
    {
      title: 'Integrações',
      description: 'Configurar integrações externas',
      icon: Settings,
      href: '/settings/system/integrations',
      color: 'from-pink-600 to-pink-700'
    },
    {
      title: 'Monitorização',
      description: 'Saúde do sistema e logs',
      icon: Settings,
      href: '/settings/system/health',
      color: 'from-red-600 to-red-700'
    },
    {
      title: 'Nuvem/App',
      description: 'Configurações de aplicação e backup',
      icon: Settings,
      href: '/settings/system/cloud',
      color: 'from-cyan-600 to-cyan-700'
    },
    {
      title: 'Backup/Restore',
      description: 'Backup e restauração de dados',
      icon: Settings,
      href: '/settings/system/backup',
      color: 'from-teal-600 to-teal-700'
    },
    {
      title: 'AGT',
      description: 'Configurações de comunicação fiscal',
      icon: Settings,
      href: '/settings/fiscal',
      color: 'from-amber-600 to-amber-700'
    },
    {
      title: 'DLP',
      description: 'Proteção de dados e privacidade',
      icon: Settings,
      href: '/settings/system/dlp',
      color: 'from-lime-600 to-lime-700'
    },
    {
      title: 'Histórico',
      description: 'Logs e auditoria do sistema',
      icon: Settings,
      href: '/settings/system/history',
      color: 'from-emerald-600 to-emerald-700'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Configurações</h1>
                <p className="text-sm text-slate-400">Painel de Gestão</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/owner')}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Central de Configurações</h2>
          <p className="text-slate-400">
            Gerencie todas as configurações do restaurante em um único local
          </p>
        </div>

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <button
              key={section.href}
              onClick={() => router.push(section.href)}
              className="group relative bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-700"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative p-6 text-left">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${section.color} text-white mb-4`}>
                  <section.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {section.title}
                </h3>
                
                <p className="text-sm text-slate-400 mb-4">
                  {section.description}
                </p>
                
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-sm text-slate-400">Mesas Configuradas</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">8</div>
              <div className="text-sm text-slate-400">Usuários Ativos</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-green-400">15</div>
              <div className="text-sm text-slate-400">Funcionários</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
