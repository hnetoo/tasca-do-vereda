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
  Shield,
  UserPlus,
  Briefcase,
  Link,
  Activity,
  Cloud,
  Database,
  History,
  Lock,
  ScanLine,
  FileCheck,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import StatusIndicator from '@/components/StatusIndicator';

export default function SettingsPage() {
  const router = useRouter();

  // Grupo Operacional
  const operationalSettings = [
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
      title: 'AGT / Fiscal',
      description: 'Certificação AGT, SAF-T e declarações fiscais',
      icon: FileCheck,
      href: '/settings/system/agt',
      color: 'from-red-600 to-red-700'
    },
    {
      title: 'Menu QR',
      description: 'Configurar menu digital e QR codes',
      icon: QrCode,
      href: '/settings/qr',
      color: 'from-green-600 to-green-700'
    },
    {
      title: 'QR Code Analytics',
      description: 'Análise de QR codes',
      icon: ScanLine,
      href: '/qrcodeanalytics',
      color: 'from-emerald-600 to-emerald-700'
    },
    {
      title: 'QR Code Menu Manager',
      description: 'Gestão de menus digitais',
      icon: QrCode,
      href: '/qrmenumanager',
      color: 'from-teal-600 to-teal-700'
    }
  ];

  // Grupo Administrativo
  const administrativeSettings = [
    {
      title: 'Utilizadores',
      description: 'Gestão de usuários e permissões',
      icon: UserPlus,
      href: '/settings/system/users',
      color: 'from-purple-600 to-purple-700'
    },
    {
      title: 'Cargos',
      description: 'Definir cargos e responsabilidades',
      icon: Briefcase,
      href: '/settings/system/roles',
      color: 'from-indigo-600 to-indigo-700'
    },
    {
      title: 'Gestão de Staff',
      description: 'Gestão de funcionários',
      icon: UserCog,
      href: '/roles',
      color: 'from-blue-600 to-blue-700'
    },
    {
      title: 'Escalas',
      description: 'Organização de horários',
      icon: Calendar,
      href: '/settings/staff/escalas',
      color: 'from-cyan-600 to-cyan-700'
    },
    {
      title: 'Folha Salarial',
      description: 'Gestão de salários e pagamentos',
      icon: Wallet,
      href: '/settings/payroll',
      color: 'from-amber-600 to-amber-700'
    }
  ];

  // Grupo de Sistema
  const systemSettings = [
    {
      title: 'Integrações',
      description: 'Conectar serviços externos',
      icon: Link,
      href: '/settings/system/integrations',
      color: 'from-pink-600 to-pink-700'
    },
    {
      title: 'Monitorização',
      description: 'Monitor de sistema e performance',
      icon: Activity,
      href: '/settings/system/health',
      color: 'from-red-600 to-red-700'
    },
    {
      title: 'Nuvem',
      description: 'Sincronização e backup na nuvem',
      icon: Cloud,
      href: '/settings/system/cloud',
      color: 'from-sky-600 to-sky-700',
      statusType: 'supabase' as const
    },
    {
      title: 'Backup/Restore',
      description: 'Backup e restauração de dados',
      icon: Database,
      href: '/settings/system/backup',
      color: 'from-slate-600 to-slate-700'
    },
    {
      title: 'DLP',
      description: 'Proteção contra perda de dados',
      icon: Lock,
      href: '/settings/system/dlp',
      color: 'from-rose-600 to-rose-700'
    },
    {
      title: 'Histórico',
      description: 'Logs e auditoria do sistema',
      icon: History,
      href: '/settings/system/history',
      color: 'from-violet-600 to-violet-700'
    }
  ];

  const renderSettingsGroup = (title: string, description: string, settings: any[]) => (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settings.map((setting) => (
          <button
            key={setting.href}
            onClick={() => router.push(setting.href)}
            className="group relative bg-[#0f172a] rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-800"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${setting.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
            
            {/* Content */}
            <div className="relative p-6 text-left">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${setting.color} text-white mb-4`}>
                <setting.icon className="w-6 h-6" />
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {setting.title}
              </h4>
              
              <p className="text-sm text-gray-400 mb-4">
                {setting.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
                
                {setting.statusType && (
                  <StatusIndicator type={setting.statusType} size="sm" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

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

        {/* Grupo Operacional */}
        {renderSettingsGroup(
          '🔧 Operacional',
          'Configurações essenciais para o funcionamento diário do restaurante',
          operationalSettings
        )}

        {/* Grupo Administrativo */}
        {renderSettingsGroup(
          '👥 Administrativo',
          'Gestão de equipa, recursos humanos e estrutura organizacional',
          administrativeSettings
        )}

        {/* Grupo de Sistema */}
        {renderSettingsGroup(
          '⚙️ Sistema',
          'Infraestrutura, segurança e operações técnicas do sistema',
          systemSettings
        )}

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
