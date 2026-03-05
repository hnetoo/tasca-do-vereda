'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStaff() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
        
        if (error) {
          console.error('Error fetching staff:', error)
        } else {
          setStaff(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v-1m0 0V6a6 6 0 00-12 0v6m0 0v1a6 6 0 0012 0z" />
                </svg>
                <h1 className="text-xl font-semibold">Códigos de Acesso</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-6">Gerenciamento de PINs e Permissões</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Carregando...</p>
            </div>
          ) : staff && staff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-slate-400 font-medium">Nome</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Email</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Cargo</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">PIN</th>
                    <th className="px-6 py-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-800 hover:bg-slate-800">
                      <td className="px-6 py-4 text-white">{employee.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-300">{employee.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-300">{employee.role || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-300">****</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhum funcionário encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
