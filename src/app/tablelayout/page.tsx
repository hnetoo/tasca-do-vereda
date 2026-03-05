'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TableLayout() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTables(); }, []);

  async function fetchTables() {
    const { data } = await supabase.from('restaurant_tables').select('*').order('number', { ascending: true });
    if (data) setTables(data);
    setLoading(false);
  }

  // FUNÇÃO PARA ADICIONAR MESA NOVA
  async function addTable() {
    const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    const { data, error } = await supabase.from('restaurant_tables')
      .insert([{ number: nextNumber, status: 'disponível', x: 50, y: 150 }])
      .select();
    if (data) setTables([...tables, data[0]]);
  }

  // FUNÇÃO PARA ATUALIZAR POSIÇÃO (DRAG END)
  async function updatePosition(id: string, x: number, y: number) {
    await supabase.from('restaurant_tables').update({ x, y }).eq('id', id);
  }

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - 40; // 40 é metade da largura da mesa
      const y = e.clientY - rect.top - 40;
      setTables(tables.map(t => t.id === id ? { ...t, x, y } : t));
      updatePosition(id, x, y);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#0f172a] text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-orange-500">DESIGNER DE MESAS</h1>
          <p className="text-slate-400 text-sm italic">Arrasta as mesas para organizar o salão</p>
        </div>
        <button 
          onClick={addTable}
          className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"
        >
          <span className="text-2xl">+</span> ADICIONAR MESA
        </button>
      </div>

      <div className="relative w-full h-[70vh] bg-slate-800/50 rounded-3xl border-4 border-slate-700/50 overflow-hidden backdrop-blur-sm">
        {/* Grelha de fundo para ajudar no alinhamento */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {tables.map((mesa) => (
          <div
            key={mesa.id}
            draggable
            onDragEnd={(e) => handleDragEnd(e, mesa.id)}
            style={{ left: `${mesa.x}px`, top: `${mesa.y}px`, position: 'absolute' }}
            className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center cursor-move shadow-2xl transition-transform hover:scale-105 active:opacity-50 border-4 ${
              mesa.status === 'ocupada' ? 'border-red-500 bg-red-600/20' : 'border-emerald-500 bg-emerald-600/20'
            }`}
          >
            <span className="text-[10px] font-black opacity-50 uppercase">Mesa</span>
            <span className="text-3xl font-black">{mesa.number}</span>
            <div className="absolute -bottom-2 bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-slate-700">
              {mesa.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}