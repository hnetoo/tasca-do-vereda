'use client';


import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useStore } from '@/store/useStore';
import { 
  LayoutGrid, Plus, MousePointer2, Move, Trash2, Users, 
  AlertCircle, CheckCircle2, Home, Sun, 
  Beer, Square, Circle, RectangleHorizontal, RotateCw, Settings2,
  Clock
} from 'lucide-react';
import { Table, TableStatus, TableZone, TableShape } from '@/types';
import { MOCK_TABLES } from '@/constants';

const TableLayout = () => {
  const { 
    tables, addTable, updateTable, removeTable, updateTableStatus, 
    addNotification, activeOrders, saveStatus 
  } = useStore();
  const user = useSelector((state: any) => state.auth.user);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<{x: number, y: number} | null>(null);
  const [activeZone, setActiveZone] = useState<TableZone>('INTERIOR');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

    useEffect(() => {
        if (isAdmin && tables.length === 0) {
            MOCK_TABLES.forEach((t: Table) => addTable(t));
        }
    }, [isAdmin, tables, addTable]);

  const GRID_SIZE = 10; 
  const GRID_ROWS = 8; 

  const filteredTables = useMemo(() => tables.filter(t => t.zone === activeZone), [tables, activeZone]);
  const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { 
    style: 'currency', 
    currency: 'AOA', 
    maximumFractionDigits: 0 
  }).format(val);

  const getTableStats = (tableId: string) => {
    const tableOrders = activeOrders.filter(o => o.table_id === tableId && o.status === 'ABERTO');
    const total = tableOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    
    let timeElapsed = '';
    if (tableOrders.length > 0) {
      const earliest = new Date(Math.min(...tableOrders.map(o => new Date(o.timestamp || new Date()).getTime())));
      const diffMs = currentTime.getTime() - earliest.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        timeElapsed = `${diffMins}m`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        timeElapsed = `${hours}h ${mins}m`;
      }
    }

    return { total, timeElapsed };
  };

  const handleAddTable = () => {
    const currentTables = tables || [];
    const maxId = currentTables.length > 0 ? Math.max(...currentTables.map(t => parseInt(t.id) || 0)) : 0;
    const nextId = String(maxId + 1);
    
    let foundX = 0, foundY = 0;
    let found = false;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!filteredTables.find(t => t.x === x && t.y === y)) {
          foundX = x;
          foundY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newTable: Table = {
      id: nextId,
      name: activeZone === 'BALCAO' ? `Lugar ${nextId}` : activeZone === 'EXTERIOR' ? `Pátio ${nextId}` : `Mesa ${nextId}`,
      seats: activeZone === 'BALCAO' ? 1 : 4,
      status: 'AVAILABLE',
      x: foundX,
      y: foundY,
      zone: activeZone,
      shape: activeZone === 'BALCAO' ? 'RECTANGLE' : 'SQUARE',
      rotation: activeZone === 'BALCAO' ? 90 : 0,
      number: parseInt(nextId),
      is_active: true,
      color: null,
      created_at: new Date().toISOString(),
      group_id: null,
      height: null,
      label: null,
      updated_at: new Date().toISOString(),
      user_id: null,
      width: null,
    };

    addTable(newTable);
    setSelectedTableId(nextId);
    addNotification('success', `${activeZone} - Mesa ${nextId} adicionada.`);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    console.log('🎯 DRAG START: Starting drag for table:', id, 'EditMode:', isEditMode);
    try {
      // Tauri compatibility: ensure dataTransfer works
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.setData('application/json', JSON.stringify({ id, type: 'TABLE' }));
        console.log('🎯 DRAG START: Data transfer set successfully');
      }
    } catch (err) {
      console.error('Drag start error:', err);
      // Fallback for Tauri
      console.log('Drag started for table:', id);
    }
    setDraggedTableId(id);
    setSelectedTableId(id);
  };

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPos?.x !== x || dragOverPos?.y !== y) {
      setDragOverPos({x, y});
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverPos(null);
  };

  const handleDrop = async (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 DROP: Attempting drop at position:', { x, y }, 'EditMode:', isEditMode, 'DraggedTableId:', draggedTableId);
    setDragOverPos(null);
    if (!isEditMode || draggedTableId === null) {
      console.log('🎯 DROP: Cancelled - not in edit mode or no table dragged');
      return;
    }

    const table = tables.find(t => t.id === draggedTableId);
    if (!table) {
      console.log('🎯 DROP: Cancelled - table not found:', draggedTableId);
      return;
    }

    const occupied = filteredTables.find(t => t.x === x && t.y === y && t.id !== draggedTableId);
    if (occupied) {
      console.log('🎯 DROP: Cancelled - position occupied:', occupied);
      addNotification('error', 'Colisão detectada! O espaço já contém um objeto.');
      setDraggedTableId(null);
      return;
    }

    console.log('🎯 DROP: Moving table', table.name, 'from', { x: table.x, y: table.y }, 'to', { x, y });

    // Atualizar posição da mesa
    const updatedTable = { ...table, x, y };
    
    // Salvar via API
    try {
      const response = await fetch('/api/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTable)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao atualizar posição da mesa');
      }

      // Atualizar localmente também
      updateTable(updatedTable);
      addNotification('success', 'Mesa movida com sucesso!');
      console.log('🎯 DROP: Table moved successfully:', updatedTable);
    } catch (error: any) {
      console.error('Erro ao mover mesa:', error);
      addNotification('error', `Falha ao mover mesa: ${error.message}`);
    }
    
    setDraggedTableId(null);
  };

  const toggleStatus = (table: Table) => {
    if (isEditMode) {
      setSelectedTableId(table.id);
      return;
    }
    const nextStatus: Record<TableStatus, TableStatus> = {
      'AVAILABLE': 'RESERVED',
      'RESERVED': 'OCCUPIED',
      'OCCUPIED': 'PAYMENT',
      'PAYMENT': 'AVAILABLE',
      'DIRTY': 'AVAILABLE',
      'MAINTENANCE': 'AVAILABLE',
      'UPDATING': 'AVAILABLE'
    };
    updateTableStatus(table.id, nextStatus[table.status as TableStatus]);
  };

  const handleUpdateProperty = <T extends keyof Table>(prop: T, value: Table[T]) => {
    if (selectedTable) {
      const updatedTable = { ...selectedTable, [prop]: value };
      updateTable(updatedTable);
      addNotification('info', `${selectedTable.name} atualizada. Guardar layout para confirmar.`);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'border-green-500 bg-green-500/10 text-green-500';
      case 'OCCUPIED': return 'border-red-500 bg-red-600/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      case 'RESERVED': return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
      case 'PAYMENT': return 'border-primary bg-primary/20 text-primary animate-pulse shadow-glow';
      default: return 'border-slate-700 bg-slate-800 text-slate-400';
    }
  };

  const zoneConfig = {
    INTERIOR: { icon: Home, label: 'Interior', bg: 'bg-slate-900/40' },
    EXTERIOR: { icon: Sun, label: 'Exterior', bg: 'bg-blue-900/10' },
    BALCAO: { icon: Beer, label: 'Balcão', bg: 'bg-orange-900/10' },
  };

  return (
    <div className="flex h-full bg-background overflow-hidden relative font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="p-8 pb-4 flex justify-between items-end gap-6 shrink-0 relative z-20">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
               <LayoutGrid size={16} />
               <span className="text-xs font-mono font-bold tracking-widest uppercase">Arquitetura de Salão</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight italic">Gestão de Ambientes</h2>
          </div>
          
          <div className="flex gap-3 items-center">
            {saveStatus === 'SAVING' && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 animate-pulse">
                <Clock size={14} className="animate-spin" />
                <span>A guardar...</span>
              </div>
            )}
            {saveStatus === 'SAVED' && (
              <div className="flex items-center gap-2 text-xs font-medium text-green-500">
                <CheckCircle2 size={14} />
                <span>Guardado</span>
              </div>
            )}
            {saveStatus === 'ERROR' && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                <AlertCircle size={14} />
                <span>Erro ao guardar</span>
              </div>
            )}

            {isAdmin && (
              <button 
                onClick={() => { 
                  console.log('🎯 BUTTON: Edit mode toggle clicked, current state:', isEditMode);
                  setIsEditMode(!isEditMode); 
                  if(isEditMode) {
                    setSelectedTableId(null);
                  }
                }}
                className={`px-8 py-3 rounded-xl border-2 font-bold flex items-center gap-3 transition-all shadow-lg text-sm
                  ${isEditMode 
                    ? 'bg-red-500 text-white border-red-500 shadow-red-500/50 animate-pulse' 
                    : 'bg-green-500 text-white border-green-500 shadow-green-500/50 hover:bg-green-600'
                  }`}
              >
                {isEditMode ? <CheckCircle2 size={20} /> : <Move size={20} />}
                {isEditMode ? 'TERMINAR EDIÇÃO' : 'MOVER MESAS'}
              </button>
            )}
          </div>
        </header>

        <div className="px-8 py-4 flex gap-3 overflow-x-auto no-scrollbar shrink-0 relative z-20">
          {(['INTERIOR', 'EXTERIOR', 'BALCAO'] as TableZone[]).map(zone => {
             const Icon = zoneConfig[zone].icon;
             const isActive = activeZone === zone;
             return (
               <button
                 key={zone}
                 onClick={() => { setActiveZone(zone); setSelectedTableId(null); }}
                 className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all whitespace-nowrap
                   ${isActive ? 'bg-primary/20 border-primary text-primary shadow-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}
                 `}
               >
                  <Icon size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">{zoneConfig[zone].label}</span>
                  <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] opacity-60">{(tables || []).filter(t => t.zone === zone).length}</span>
               </button>
             );
          })}
        </div>

        <div className="flex-1 p-8 pt-4 overflow-hidden flex flex-col">
          {(!tables || tables.length === 0) ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center opacity-60">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                   <LayoutGrid size={48} className="text-slate-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-white">Nenhuma Mesa Encontrada</h3>
                   <p className="text-sm text-slate-400 max-w-md">
                     O banco de dados de mesas está vazio. Você pode começar do zero ou carregar o layout padrão.
                   </p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => {
                       if(window.confirm('Carregar layout padrão de mesas? Isso pode sobrescrever dados existentes.')) {
                          MOCK_TABLES.forEach((t: Table) => addTable(t));
                          window.location.reload();
                       }
                    }}
                    className="px-8 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-all shadow-glow flex items-center gap-2"
                  >
                     <RotateCw size={18} /> Inicializar Layout Padrão
                  </button>
                )}
             </div>
          ) : (
          <div className={`flex-1 relative glass-panel rounded-[2.5rem] border-white/5 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-700 ${zoneConfig[activeZone].bg}`}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
              style={{ 
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}>
            </div>

            <div 
              className="grid gap-2 relative z-10 p-4" 
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                width: 'min(98%, 1400px)',
                height: 'min(90vh, 600px)',
                aspectRatio: `${GRID_SIZE}/${GRID_ROWS}`
              }}
            >
              {Array.from({ length: GRID_ROWS }).map((_, y) => (
                Array.from({ length: GRID_SIZE }).map((_, x) => {
                  const table = filteredTables.find(t => t.x === x && t.y === y);
                  const isSelected = table?.id === selectedTableId;
                  const isOver = dragOverPos?.x === x && dragOverPos?.y === y;
                  const isOccupiedByOther = table && table.id !== draggedTableId;
                  
                  const { total, timeElapsed } = table ? getTableStats(table.id) : { total: 0, timeElapsed: '' };

                  return (
                    <div 
                      key={`${x}-${y}`}
                      onDragOver={(e) => handleDragOver(e, x, y)}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, x, y)}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all relative
                        ${isEditMode && !table ? 'border border-dashed border-white/10 hover:bg-white/5' : ''}
                        ${isOver && isOccupiedByOther ? 'bg-red-500/20 ring-2 ring-red-500' : ''}
                        ${isOver && !isOccupiedByOther && draggedTableId !== null ? 'bg-primary/20 ring-2 ring-primary' : ''}
                      `}
                    >
                      {table && (
                        <div 
                          draggable={isEditMode}
                          onDragStart={(e) => handleDragStart(e, table.id)}
                          onDragEnd={() => { setDragOverPos(null); setDraggedTableId(null); }}
                          onClick={() => toggleStatus(table)}
                          style={{ transform: `rotate(${table.rotation}deg)` }}
                          className={`w-full h-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group relative
                            ${getStatusColor((table.status || 'AVAILABLE') as TableStatus)}
                            ${isSelected ? 'ring-4 ring-primary ring-offset-4 ring-offset-background z-20 scale-105 shadow-glow' : 'hover:scale-105'}
                            ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
                            ${table.shape === 'CIRCLE' ? 'rounded-full' : table.shape === 'RECTANGLE' ? 'rounded-lg' : 'rounded-2xl'}
                            ${draggedTableId !== null && draggedTableId !== table.id ? 'pointer-events-none' : ''}
                          `}
                        >
                          {isOver && isOccupiedByOther && (
                            <div className="absolute inset-0 flex items-center justify-center z-30 bg-red-600/40 rounded-inherit">
                               <AlertCircle className="text-white" size={24} />
                            </div>
                          )}
                          
                          <div className={`flex flex-col items-center gap-0.5 w-full px-1 text-center ${table.rotation !== 0 ? 'rotate-[-' + table.rotation + 'deg]' : ''}`}>
                             <span className="font-black text-[9px] md:text-[10px] tracking-tighter uppercase leading-none mb-1">{table.name}</span>
                             
                             {/* Forma e Lugares */}
                             <div className="flex items-center justify-center gap-2 mb-2">
                               <div className="flex items-center gap-1">
                                 {table.shape === 'CIRCLE' && <Circle size={12} className="text-slate-300" />}
                                 {table.shape === 'RECTANGLE' && <RectangleHorizontal size={12} className="text-slate-300" />}
                                 {table.shape === 'SQUARE' && <Square size={12} className="text-slate-300" />}
                               </div>
                               <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-black/50 px-2 py-1 rounded-full border border-white/10">
                                 <Users size={10} /> {table.seats}
                               </div>
                             </div>
                             
                             {table.status === 'OCCUPIED' && !isEditMode && (
                               <div className="flex flex-col items-center animate-in fade-in duration-500">
                                 <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-white mb-0.5">
                                    <Clock size={10} className="text-primary" /> {timeElapsed}
                                 </div>
                                 <div className="text-[10px] font-mono font-black text-white bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
                                    {formatKz(total)}
                                 </div>
                               </div>
                             )}

                             {!table.activeOrderIds?.length && (table.status || 'AVAILABLE') !== 'OCCUPIED' && !(table.status || '').includes('PAGAMENTO') && isEditMode && (
                               <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded opacity-70">
                                  Editar
                               </div>
                             )}

                             {table.status === 'PAYMENT' && !isEditMode && (
                               <div className="flex flex-col items-center">
                                 <div className="text-[10px] font-mono font-black">FECHAR</div>
                                 <div className="text-[9px] font-mono font-bold">{formatKz(total)}</div>
                               </div>
                             )}
                          </div>

                          {/* Hover badge for capacity in occupied mode */}
                          {table.status === 'OCCUPIED' && !isEditMode && (
                             <div className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black p-1 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Users size={8} />
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-6 justify-center text-slate-500 font-bold uppercase tracking-widest text-[9px]">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div> Livre</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600/40 border border-red-500 shadow-glow"></div> Ocupado (Tempo & Valor Ativos)</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div> Reservado</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary/20 border border-primary animate-pulse"></div> Pagamento</div>
          </div>
        </div>
      </div>

      {isEditMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <Move size={20} />
            <span className="font-bold">MODO EDIÇÃO ATIVADO</span>
          </div>
          <div className="text-sm mt-1">Arraste as mesas para reposicionar</div>
        </div>
      )}
    </div>
  );
};

export default TableLayout;

