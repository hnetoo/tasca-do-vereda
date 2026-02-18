import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, trend, color }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-500 tracking-wider">{title}</span>
        <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
          {icon}
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{subtitle}</span>
          {trend && (
            <div className={`flex items-center text-xs font-medium ${
              trend === 'up' ? 'text-emerald-500' : 
              trend === 'down' ? 'text-rose-500' : 'text-slate-500'
            }`}>
              {trend === 'up' && <ArrowUpRight size={12} className="mr-1" />}
              {trend === 'down' && <ArrowDownRight size={12} className="mr-1" />}
              {trend === 'neutral' && <Minus size={12} className="mr-1" />}
              <span>{trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
