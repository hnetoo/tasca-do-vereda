'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

export default function StaffPage() {
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
                <Users className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Gestão de Pessoal</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Funcionários Card */}
          <Link
            href="/staff"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">12</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Funcionários</h3>
            <p className="text-slate-400 text-sm mb-4">
              Gerencie a equipe, cargos, salários e PINs de acesso
            </p>
            <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
              <span className="text-sm font-medium">Gerenciar Equipe</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Escalas Card */}
          <Link
            href="/escalas"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">8</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Escalas</h3>
            <p className="text-slate-400 text-sm mb-4">
              Crie e gerencie calendários de turnos e horários
            </p>
            <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
              <span className="text-sm font-medium">Gerenciar Escalas</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>

          {/* Folha Salarial Card */}
          <Link
            href="/payroll"
            className="group bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors">
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-400">AOA</div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Folha Salarial</h3>
            <p className="text-slate-400 text-sm mb-4">
              Processa pagamentos e gere histórico em Kwanza
            </p>
            <div className="flex items-center text-orange-400 group-hover:text-orange-300 transition-colors">
              <span className="text-sm font-medium">Gerenciar Pagamentos</span>
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total de Funcionários</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Escalas Ativas</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Folha Mensal</p>
                <p className="text-2xl font-bold text-white">450K AOA</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
