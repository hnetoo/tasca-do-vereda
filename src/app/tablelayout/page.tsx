'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Home, Sun } from 'lucide-react';
import { formatKwanza } from '@/utils/currency';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TableLayout() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedZone, setSelectedZone] = useState<'INTERIOR' | 'EXTERIOR'>('INTERIOR');
  const [filterZone, setFilterZone] = useState<'TODOS' | 'INTERIOR' | 'EXTERIOR'>('TODOS');

  useEffect(() => { 
    const load = async () => {
      console.log(' CARREGANDO MESAS...');
      try {
        const { data, error } = await supabase.from('restaurant_tables').select('*').order('number', { ascending: true });
        
        if (error) {
          console.error('❌ ERRO AO CARREGAR MESAS:', error);
          alert('ERRO DETALHADO: ' + JSON.stringify(error));
          return;
        }
        
        console.log(' MESAS CARREGADAS:', data?.length || 0, 'registros');
        if (data) setTables(data);
      } catch (error) {
        console.error(' ERRO CRÍTICO AO CARREGAR MESAS:', error);
        alert('Erro ao carregar mesas. Verifique o console para detalhes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // FUNÇÃO PARA ADICIONAR MESA NOVA
  async function addTable() {
    console.log(' ADICIONANDO MESA...');
    console.log(' DADOS DA MESA:', {
      number: tableNumber || (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1),
      status: 'disponível',
      category: selectedZone,
      x: 50,
      y: 150
    });

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert([{ 
          number: tableNumber || (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1), 
          status: 'disponível', 
          category: selectedZone,
          x: 50, 
          y: 150 
        }])
        .select();
      
      if (error) {
        console.error('❌ ERRO SUPABASE AO CRIAR MESA:', error);
        
        // TENTAR COM COLUNA EM PORTUGUÊS SE CATEGORY FALHAR
        if (error.message?.includes('category')) {
          console.log('🔄 TENTANDO COM CATEGORIA EM PORTUGUÊS...');
          const { data: dataPT, error: errorPT } = await supabase
            .from('restaurant_tables')
            .insert([{ 
              number: tableNumber || (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1), 
              status: 'disponível', 
              categoria: selectedZone, // COLUNA EM PORTUGUÊS
              x: 50, 
              y: 150 
            }])
            .select();
          
          if (errorPT) {
            console.error('❌ ERRO TAMBÉM COM CATEGORIA PT:', errorPT);
            alert('ERRO DETALHADO: ' + JSON.stringify(errorPT));
            return;
          }
          
          if (dataPT && dataPT.length > 0) {
            console.log('✅ MESA CRIADA COM CATEGORIA PT:', dataPT[0]);
            setTables([...tables, dataPT[0]]);
            setShowModal(false);
            setTableNumber('');
            alert('Mesa criada com sucesso!');
            return;
          }
        }
        
        alert('ERRO DETALHADO: ' + JSON.stringify(error));
        return;
      }
      
      if (data && data.length > 0) {
        console.log(' MESA CRIADA COM SUCESSO:', data[0]);
        setTables([...tables, data[0]]);
        setShowModal(false);
        setTableNumber('');
        alert('Mesa criada com sucesso!');
      } else {
        console.error(' NENHUM DADO RETORNADO AO CRIAR MESA');
        alert('Erro ao criar mesa: nenhum dado retornado');
      }
    } catch (error) {
      console.error(' ERRO CRÍTICO AO CRIAR MESA:', error);
      alert('Erro ao criar mesa. Verifique o console para detalhes.');
    }
  }

  // FUNÇÃO PARA ATUALIZAR POSIÇÃO (DRAG END)
  async function updatePosition(id: string, x: number, y: number) {
    console.log(' ATUALIZANDO POSIÇÃO DA MESA:', { id, x, y });
    
    try {
      const { error } = await supabase.from('restaurant_tables').update({ x, y }).eq('id', id);
      
      if (error) {
        console.error(' ERRO AO ATUALIZAR POSIÇÃO:', error);
        return;
      }
      
      console.log(' POSIÇÃO ATUALIZADA COM SUCESSO');
    } catch (error) {
      console.error(' ERRO CRÍTICO AO ATUALIZAR POSIÇÃO:', error);
    }
  }

  const filteredTables = tables.filter(table => {
  if (filterZone === 'TODOS') return true;
  return table.category === filterZone;
});

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - 40; // 40 é metade da largura da mesa
      const y = e.clientY - rect.top - 40;
      setTables(tables.map(t => t.id === id ? { ...t, x, y } : t));
      updatePosition(id, x, y);
    }
  };

  const handleSubmit = () => {
    if (!tableNumber) {
      alert('Por favor, insira o número da mesa');
      return;
    }
    
    // Verificar se número já existe
    const existingTable = tables.find(t => t.number === parseInt(tableNumber));
    if (existingTable) {
      alert('Este número de mesa já existe');
      return;
    }
    
    addTable();
  };

  return (
    <div className="p-6 min-h-screen bg-[#0f172a] text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-black text-orange-500">DESIGNER DE MESAS</h1>
          <p className="text-slate-400 text-sm italic">Arrasta as mesas para organizar o salão</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"
        >
          <Plus className="w-5 h-5" />
          <span className="text-lg">ADICIONAR MESA</span>
        </button>
      </div>

      {/* Filtro de Visualização */}
      <div className="mb-6">
        <div className="flex gap-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          {(['TODOS', 'INTERIOR', 'EXTERIOR'] as const).map((zone) => (
            <button
              key={zone}
              onClick={() => setFilterZone(zone)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterZone === zone
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {zone === 'TODOS' && 'Todas'}
              {zone === 'INTERIOR' && 'Interior'}
              {zone === 'EXTERIOR' && 'Exterior'}
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-white">Nova Mesa</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Número</label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Zona</label>
                <div className="flex gap-2 bg-slate-800 rounded-lg p-1 border border-gray-600">
                  <button
                    onClick={() => setSelectedZone('INTERIOR')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedZone === 'INTERIOR' 
                        ? 'bg-orange-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Interior
                  </button>
                  <button
                    onClick={() => setSelectedZone('EXTERIOR')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedZone === 'EXTERIOR' 
                        ? 'bg-orange-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Exterior
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTableNumber('');
                }}
                className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-gray-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-all font-bold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full h-[70vh] bg-slate-800/50 rounded-3xl border-4 border-slate-700/50 overflow-hidden backdrop-blur-sm">
        {/* Grelha de fundo para ajudar no alinhamento */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {filteredTables.map((mesa) => (
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