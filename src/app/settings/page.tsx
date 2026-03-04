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
      title: 'Gestão de Mesas',
      description: 'Criar, editar e organizar mesas do restaurante',
      icon: Table,
      href: '/settings/tables',
      color: 'from-blue-600 to-blue-700'
    },
    {
      title: 'Gestão de Usuários',
      description: 'Administrar usuários e permissões do sistema',
      icon: Users,
      href: '/settings/system/users',
      color: 'from-purple-600 to-purple-700'
    },
    {
      title: 'Financeiro e RH',
      description: 'Folha de salário e gestão financeira',
      icon: DollarSign,
      href: '/settings/payroll',
      color: 'from-green-600 to-green-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-500">Painel de Gestão</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/owner')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Central de Configurações</h2>
          <p className="text-gray-600">
            Gerencie todas as configurações do restaurante em um único local
          </p>
        </div>

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <button
              key={section.href}
              onClick={() => router.push(section.href)}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative p-6 text-left">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${section.color} text-white mb-4`}>
                  <section.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>
                
                <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Mesas Configuradas</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Usuários Ativos</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-sm text-gray-600">Funcionários</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
