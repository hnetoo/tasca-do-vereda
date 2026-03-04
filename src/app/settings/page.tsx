'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Users, 
  DollarSign, 
  Home,
  ChevronRight,
  BarChart2,
  QrCode,
  Calendar,
  Wallet,
  TrendingUp,
  FileText,
  UserCog,
  Shield
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
      icon: Shield,
      href: '/settings/fiscal',
      color: 'from-orange-600 to-orange-700'
    },
    {
      title: 'Menu QR',
      description: 'Configurar menu digital e QR codes',
      icon: QrCode,
      href: '/settings/qr',
      color: 'from-green-600 to-green-700'
    },
    {
      title: 'Financeiro',
      description: 'Folha de salário e gestão financeira',
      icon: DollarSign,
      href: '/settings/payroll',
      color: 'from-blue-600 to-blue-700'
    }
  ];

  const submenuSections = [
    {
      title: 'Financeiro',
      description: 'Gestão financeira e folha salarial',
      icon: DollarSign,
      color: 'from-blue-600 to-blue-700',
      items: [
        { title: 'Finanças', description: 'Controlo financeiro e relatórios', href: '/finance', icon: DollarSign },
        { title: 'Folha Salarial', description: 'Gestão de salários e pagamentos', href: '/settings/payroll', icon: Wallet }
      ]
    },
    {
      title: 'Analytics',
      description: 'Análise de dados e relatórios',
      icon: BarChart2,
      color: 'from-purple-600 to-purple-700',
      items: [
        { title: 'Analytics', description: 'Análise de dados em tempo real', href: '/analytics', icon: TrendingUp },
        { title: 'Relatórios', description: 'Relatórios detalhados do negócio', href: '/reports', icon: FileText }
      ]
    },
    {
      title: 'Gestão de Staff',
      description: 'Gestão de equipa e escalas',
      icon: Users,
      color: 'from-indigo-600 to-indigo-700',
      items: [
        { title: 'Staff', description: 'Gestão de funcionários', href: '/roles', icon: UserCog },
        { title: 'Escalas', description: 'Organização de horários', href: '/settings/staff/escalas', icon: Calendar }
      ]
    },
    {
      title: 'QR Codes',
      description: 'Ferramentas de QR Code',
      icon: QrCode,
      color: 'from-emerald-600 to-emerald-700',
      items: [
        { title: 'QR Code Analytics', description: 'Análise de QR codes', href: '/qrcodeanalytics', icon: BarChart2 },
        { title: 'QR Code Menu Manager', description: 'Gestão de menus digitais', href: '/qrmenumanager', icon: QrCode }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="bg-[#0f172a] shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Configurações</h1>
                <p className="text-sm text-gray-400">Painel de Gestão</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/owner')}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
          <p className="text-gray-400">
            Gerencie todas as configurações do restaurante em um único local
          </p>
        </div>

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <button
              key={section.href}
              onClick={() => router.push(section.href)}
              className="group relative bg-[#0f172a] rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-800"
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
                
                <p className="text-sm text-gray-400 mb-4">
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

        {/* Submenu Sections */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">Módulos Especializados</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {submenuSections.map((section) => (
              <div key={section.title} className="bg-[#0f172a] rounded-xl border border-gray-800 overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${section.color} p-6`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <section.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{section.title}</h4>
                      <p className="text-white/80 text-sm">{section.description}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-6 space-y-4">
                  {section.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="w-full text-left p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-gray-600 transition-colors">
                            <item.icon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </h5>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-[#0f172a] rounded-xl shadow-sm p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-sm text-gray-400">Mesas Configuradas</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">8</div>
              <div className="text-sm text-gray-400">Usuários Ativos</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-400">15</div>
              <div className="text-sm text-gray-400">Funcionários</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
