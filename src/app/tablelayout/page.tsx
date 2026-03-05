'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Home, Sun, Edit, Trash2, CheckCircle } from 'lucide-react';
import { formatKwanza } from '@/utils/currency';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Table {
  id: string;
  number: number;
  status: 'disponível' | 'ocupada' | 'reservada' | 'suja';
  capacity?: number;
  category: 'INTERIOR' | 'EXTERIOR';
  x: number;
  y: number;
}

export default function TableLayout() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
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

  // FUNÇÃO PARA ATUALIZAR STATUS DA MESA
  async function updateTableStatus(id: string, status: Table['status']) {
    console.log(' ATUALIZANDO STATUS DA MESA:', { id, status });
    
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        console.error('❌ ERRO AO ATUALIZAR STATUS:', error);
        alert('ERRO AO ATUALIZAR STATUS: ' + JSON.stringify(error));
        return;
      }
      
      // Atualizar estado local imediatamente
      setTables(tables.map(table => 
        table.id === id ? { ...table, status } : table
      ));
      
      console.log('✅ STATUS ATUALIZADO COM SUCESSO');
      setShowStatusMenu(null);
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO ATUALIZAR STATUS:', error);
      alert('Erro ao atualizar status. Verifique o console para detalhes.');
    }
  }

  // FUNÇÃO PARA EDITAR MESA
  async function editTable() {
    if (!editingTable) return;
    
    console.log(' EDITANDO MESA:', editingTable);
    
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({
          number: tableNumber,
          capacity: tableCapacity
        })
        .eq('id', editingTable.id);
      
      if (error) {
        console.error('❌ ERRO AO EDITAR MESA:', error);
        alert('ERRO AO EDITAR MESA: ' + JSON.stringify(error));
        return;
      }
      
      // Atualizar estado local
      setTables(tables.map(table => 
        table.id === editingTable.id 
          ? { ...table, number: parseInt(tableNumber), capacity: tableCapacity }
          : table
      ));
      
      console.log('✅ MESA EDITADA COM SUCESSO');
      setShowEditModal(false);
      setEditingTable(null);
      setTableNumber('');
      setTableCapacity(4);
      alert('Mesa editada com sucesso!');
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO EDITAR MESA:', error);
      alert('Erro ao editar mesa. Verifique o console para detalhes.');
    }
  }

  // FUNÇÃO PARA APAGAR MESA
  async function deleteTable(id: string) {
    if (!confirm('Tem certeza que deseja apagar esta mesa? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    console.log(' APAGANDO MESA:', id);
    
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ ERRO AO APAGAR MESA:', error);
        alert('ERRO AO APAGAR MESA: ' + JSON.stringify(error));
        return;
      }
      
      // Atualizar estado local
      setTables(tables.filter(table => table.id !== id));
      
      console.log('✅ MESA APAGADA COM SUCESSO');
      alert('Mesa apagada com sucesso!');
    } catch (error) {
      console.error('❌ ERRO CRÍTICO AO APAGAR MESA:', error);
      alert('Erro ao apagar mesa. Verifique o console para detalhes.');
    }
  }

  // FUNÇÃO PARA ADICIONAR MESA NOVA
  async function addTable() {
    console.log(' ADICIONANDO MESA...');
    console.log(' DADOS DA MESA:', {
      number: tableNumber || (tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1),
      status: 'disponível',
      category: selectedZone,
      capacity: tableCapacity,
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
          capacity: tableCapacity,
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
              capacity: tableCapacity,
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
            setTableCapacity(4);
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
        setTableCapacity(4);
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
    
    // Verificar se número já existe (exceto se estiver editando)
    const existingTable = tables.find(t => t.number === parseInt(tableNumber) && t.id !== editingTable?.id);
    if (existingTable) {
      alert('Este número de mesa já existe');
      return;
    }
    
    if (editingTable) {
      editTable();
    } else {
      addTable();
    }
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setTableNumber(table.number.toString());
    setTableCapacity(table.capacity || 4);
    setShowEditModal(true);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'disponível':
        return 'border-emerald-500 bg-emerald-600/20';
      case 'ocupada':
        return 'border-red-500 bg-red-600/20';
      case 'reservada':
        return 'border-yellow-500 bg-yellow-600/20';
      case 'suja':
        return 'border-gray-500 bg-gray-600/20';
      default:
        return 'border-emerald-500 bg-emerald-600/20';
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'disponível':
        return 'Livre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
      case 'suja':
        return 'Suja/Limpeza';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#0f172a] text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-black text-orange-500">DESIGNER DE MESAS</h1>
          <p className="text-slate-400 text-sm italic">Clique na mesa para mudar status • Arrasta para organizar</p>
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

      {/* Modal Adicionar Mesa */}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Capacidade (lugares)</label>
                <input
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 4"
                  min="1"
                  max="12"
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
                  setTableCapacity(4);
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

      {/* Modal Editar Mesa */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Edit className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-white">Editar Mesa</h2>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Capacidade (lugares)</label>
                <input
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 4"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                  setTableNumber('');
                  setTableCapacity(4);
                }}
                className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-gray-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-all font-bold"
              >
                Salvar
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
            onClick={() => setShowStatusMenu(showStatusMenu === mesa.id ? null : mesa.id)}
            style={{ left: `${mesa.x}px`, top: `${mesa.y}px`, position: 'absolute' }}
            className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center cursor-move shadow-2xl transition-all hover:scale-105 active:opacity-50 border-4 ${getStatusColor(mesa.status)} group`}
          >
            <span className="text-[10px] font-black opacity-50 uppercase">Mesa</span>
            <span className="text-3xl font-black">{mesa.number}</span>
            <div className="absolute -bottom-2 bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-slate-700">
              {getStatusText(mesa.status)}
            </div>
            
            {/* Botões de Editar e Apagar (hover) */}
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(mesa);
                }}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTable(mesa.id);
                }}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Menu de Status */}
            {showStatusMenu === mesa.id && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-900 rounded-lg shadow-xl border border-slate-700 z-50 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(mesa.id, 'disponível');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-emerald-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  Livre
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(mesa.id, 'ocupada');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-red-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  Ocupada
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(mesa.id, 'reservada');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-yellow-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  Reservada
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(mesa.id, 'suja');
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-gray-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  Suja/Limpeza
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}