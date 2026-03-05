'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuração direta para evitar erros de importação
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TableLayout() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .select('*')
          .order('number', { ascending: true });

        if (error) throw error;
        setTables(data || []);
      } catch (err) {
        console.error('Erro ao carregar mesas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  if (loading) return <div className="p-10 text-white">A carregar mapa da Tasca...</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-8 text-orange-500">Mapa de Mesas</h1>
      
      {tables.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700 p-20 text-center rounded-xl">
          <p className="text-slate-500 text-xl font-bold">Nenhuma mesa encontrada no Supabase.</p>
          <p className="text-slate-600">Verifica se a tabela 'restaurant_tables' tem dados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((mesa) => (
            <div 
              key={mesa.id}
              className={`h-32 rounded-xl flex flex-col items-center justify-center border-4 shadow-lg transition-transform active:scale-95 ${
                mesa.status === 'ocupada' ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'
              }`}
            >
              <span className="text-xs uppercase opacity-60">Mesa</span>
              <span className="text-4xl font-black">{mesa.number}</span>
              <span className="text-[10px] font-bold mt-2 uppercase">{mesa.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}