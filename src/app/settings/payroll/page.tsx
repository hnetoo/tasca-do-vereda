'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PayrollPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchPayroll = async () => {
      const { data } = await supabase.from('payroll').select('*');
      if (data) setRecords(data);
    };
    fetchPayroll();
  }, []);

  return (
    <div className="p-8 text-white bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Folha Salarial</h1>
      <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-4 text-left">Funcionário</th>
              <th className="p-4 text-left">Base</th>
              <th className="p-4 text-left">Total Líquido</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r.id} className="border-t border-slate-700">
                <td className="p-4">{r.funcionario || 'Sem Nome'}</td>
                <td className="p-4">{r.base_salary || 0} Kz</td>
                <td className="p-4 font-bold text-green-400">{r.net_total || 0} Kz</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}