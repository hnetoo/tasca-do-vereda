import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Check } from 'lucide-react';
import {
  calculateSalaryBreakdown,
  formatKzDetailed,
  validateMinimumWage,
  MINIMUM_WAGES_ANGOLA,
  SalaryBreakdown,
} from '../services/salaryCalculatorAngola';

interface SalaryCalculatorProps {
  name: string;
  role: string;
  salarioBase: number;
  workDaysPerMonth?: number;
  dailyWorkHours?: number;
  onClose?: () => void;
}

const SalaryCalculatorAngola: React.FC<SalaryCalculatorProps> = ({
  name,
  role,
  salarioBase,
  workDaysPerMonth = 22,
  dailyWorkHours = 8,
  onClose,
}) => {
  const breakdown = calculateSalaryBreakdown(salarioBase, role, workDaysPerMonth, dailyWorkHours);
  const isValidWage = validateMinimumWage(role, salarioBase);
  const minimumWage = MINIMUM_WAGES_ANGOLA[role as keyof typeof MINIMUM_WAGES_ANGOLA] || 120_000;

  const percentualIRT = ((breakdown.irt / salarioBase) * 100).toFixed(1);
  const percentualINSS = ((breakdown.inss / salarioBase) * 100).toFixed(1);
  const percentualLiquido = ((breakdown.salarioLiquido / salarioBase) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-white mb-1">{name}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{role}</p>
          </div>
          {!isValidWage && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-xs font-bold text-red-500 uppercase">Abaixo do mínimo</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Salário Bruto */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Salário Bruto</span>
          </div>
          <p className="text-3xl font-black text-white">{formatKzDetailed(breakdown.salarioBase)}</p>
          <p className="text-xs text-slate-500 mt-2 font-mono">Base mensal para contribuições</p>
        </div>

        {/* Salário Líquido */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-xs font-bold text-slate-400 uppercase">Salário Líquido</span>
          </div>
          <p className="text-3xl font-black text-green-400">{formatKzDetailed(breakdown.salarioLiquido)}</p>
          <p className="text-xs text-slate-500 mt-2 font-mono">{percentualLiquido}% do salário bruto</p>
        </div>
      </div>

      {/* Deductions Breakdown */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <h4 className="text-lg font-black text-white mb-6 flex items-center gap-2">
          <TrendingDown size={20} className="text-red-500" />
          Descontos e Contribuições
        </h4>

        <div className="space-y-4">
          {/* IRT */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/20 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">Imposto de Rendimento (IRT)</span>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                  {percentualIRT}%
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Calculado sobre salário tributável (dedução de independência pessoal: 50.000 Kz)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-red-400">{formatKzDetailed(breakdown.irt)}</p>
            </div>
          </div>

          {/* INSS */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">
                  INSS - Contribuição do Trabalhador
                </span>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                  3.6%
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Fundo de segurança social e proteção do trabalhador
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-orange-400">{formatKzDetailed(breakdown.inss)}</p>
            </div>
          </div>

          {/* Total Descontos */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-sm font-black text-white uppercase">Total de Descontos</span>
            <p className="text-2xl font-black text-red-400">
              {formatKzDetailed(breakdown.irt + breakdown.inss + breakdown.deducoes)}
            </p>
          </div>
        </div>
      </div>

      {/* Daily/Hourly Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5">
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Salário Diário</p>
          <p className="text-2xl font-black text-white">{formatKzDetailed(breakdown.salarioDiario)}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">~22 dias/mês</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5">
          <p className="text-xs text-slate-400 font-bold uppercase mb-2">Salário/Hora</p>
          <p className="text-2xl font-black text-white">{formatKzDetailed(breakdown.salarioHorario)}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">~8 horas/dia</p>
        </div>
      </div>

      {/* Minimum Wage Check */}
      <div className={`glass-panel rounded-2xl p-4 border ${
        isValidWage
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5'
      }`}>
        <div className="flex items-start gap-3">
          {isValidWage ? (
            <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-bold ${isValidWage ? 'text-green-400' : 'text-red-400'}`}>
              {isValidWage ? '✓ Salário Conforme' : '⚠ Salário Insuficiente'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Mínimo legal para {role}: <span className="font-bold text-white">{formatKzDetailed(minimumWage)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-slate-800/50">
        <p className="text-xs text-slate-400 font-mono leading-relaxed">
          <strong>ℹ️ Notas Importantes:</strong><br/>
          • IRT calculado conforme escalões 2024 Angola<br/>
          • INSS = 3.6% sobre salário bruto<br/>
          • Dedução de independência pessoal: 50.000 Kz<br/>
          • Valores em Kz angolano (AOA)
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-xs transition-all"
        >
          Fechar
        </button>
      )}
    </div>
  );
};

export default SalaryCalculatorAngola;
