'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKwanza } from '@/utils/currency';
import { Plus, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function PayrollPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: payrollData } = await supabase
        .from('payroll')
        .select(`
          *,
          staff!staff_id (
            name
          )
        `);
      
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, base_salary, status')
        .eq('status', 'active');
      
      if (payrollData) setRecords(payrollData);
      if (staffData) setStaff(staffData);
    };
    fetchData();
  }, []);

  const generateMonthlyPayroll = async () => {
    if (!confirm('Gerar folha para todos os funcionários ativos?')) return;
    
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      for (const employee of staff) {
        const netTotal = employee.base_salary;
        
        const { error } = await supabase
          .from('payroll')
          .insert({
            staff_id: employee.id,
            net_total: netTotal,
            mes_referencia: currentMonth,
            status_pagamento: 'pendente'
          });
        
        if (error) {
          console.error('Erro ao gerar folha para', employee.name, error);
        }
      }
      
      // Recarregar dados
      const { data } = await supabase
        .from('payroll')
        .select(`
          *,
          staff!staff_id (
            name
          )
        `);
      if (data) setRecords(data);
      
      alert('Folha do mês gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar folha:', error);
      alert('Erro ao gerar folha do mês');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Folha Salarial</h1>
          <p className="text-slate-400">Gestão inteligente de salários e pagamentos</p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={generateMonthlyPayroll}
            disabled={loading || staff.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:opacity-50 rounded-xl font-bold transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Gerar Folha do Mês</span>
              </>
            )}
          </button>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Funcionário</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Salário Base</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Líquido</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Mês Referência</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {record.staff?.name?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{record.staff?.name || 'Sem Nome'}</div>
                          <div className="text-xs text-slate-400">ID: {record.staff_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{formatKwanza(record.base_salary || 0)}</td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-400">
                        {formatKwanza(record.net_total || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                        {record.mes_referencia}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status_pagamento === 'pago' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : record.status_pagamento === 'pendente'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {record.status_pagamento === 'pago' ? '✓ Pago' : 
                         record.status_pagamento === 'pendente' ? '⏳ Pendente' : '✗ Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {records.map((record: any) => (
            <div key={record.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {record.staff?.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{record.staff?.name || 'Sem Nome'}</div>
                    <div className="text-xs text-slate-400">ID: {record.staff_id}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  record.status_pagamento === 'pago' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : record.status_pagamento === 'pendente'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {record.status_pagamento === 'pago' ? '✓ Pago' : 
                   record.status_pagamento === 'pendente' ? '⏳ Pendente' : '✗ Cancelado'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Base:</span>
                  <span className="text-white font-medium ml-2">{formatKwanza(record.base_salary || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Líquido:</span>
                  <span className="text-green-400 font-bold ml-2">{formatKwanza(record.net_total || 0)}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-700">
                <span className="text-xs text-slate-400">Mês: {record.mes_referencia}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}