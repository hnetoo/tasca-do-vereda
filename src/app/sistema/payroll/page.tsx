'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPayroll() {
      try {
        const { data, error } = await supabase
          .from('payroll')
          .select('*')
        
        if (error) {
          console.error('Error fetching payroll:', error)
          setPayroll([])
        } else {
          setPayroll(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setPayroll([])
      } finally {
        setLoading(false)
      }
    }

    fetchPayroll()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/sistema"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h1 className="text-xl font-semibold">Folha Salarial</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6">Processamento de Pagamentos</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Carregando...</p>
            </div>
          ) : payroll && payroll.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-slate-400 font-medium">Funcionário</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Salário Base</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Bônus</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Total</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800">
                      <td className="px-6 py-4 text-white">{item.funcionario || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-300">{item.salario_base || 'N/A'} AOA</td>
                      <td className="px-6 py-4 text-slate-300">{item.bonus || '0'} AOA</td>
                      <td className="px-6 py-4 text-white font-semibold">{item.total || 'N/A'} AOA</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Processado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhum registro de folha salarial encontrado.</p>
              <p className="text-slate-500 text-sm mt-2">A tabela de folha salarial pode não existir ainda no banco de dados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
