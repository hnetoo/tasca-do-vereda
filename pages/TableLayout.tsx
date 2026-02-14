
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  LayoutGrid, Plus, MousePointer2, Move, Trash2, Users, 
  AlertCircle, CheckCircle2, Home, Sun, 
  Beer, Square, Circle, RectangleHorizontal, RotateCw, Settings2,
  Clock
} from 'lucide-react';
import { Table, TableStatus, TableZone, TableShape } from '../types';
import { MOCK_TABLES } from '../constants';

const TableLayout = () => {
  const { 
    tables, addTable, updateTable, removeTable, updateTableStatus, 
    addNotification, currentUser, activeOrders, saveStatus 
  } = useStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<{x: number, y: number} | null>(null);
  const [activeZone, setActiveZone] = useState<TableZone>('INTERIOR');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar o tempo a cada minuto para o indicador de ocupação
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';

  const GRID_SIZE = 10; 
  const GRID_ROWS = 8; 

  const filteredTables = useMemo(() => tables.filter(t => t.zone === activeZone), [tables, activeZone]);
  const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { 
    style: 'currency', 
    currency: 'AOA', 
    maximumFractionDigits: 0 
  }).format(val);

  const getTableStats = (tableId: number) => {
    const tableOrders = activeOrders.filter(o => o.tableId === tableId && o.status === 'ABERTO');
    const total = tableOrders.reduce((acc, o) => acc + o.total, 0);
    
    let timeElapsed = '';
    if (tableOrders.length > 0) {
      const earliest = new Date(Math.min(...tableOrders.map(o => new Date(o.timestamp).getTime())));
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
    const nextId = currentTables.length > 0 ? Math.max(...currentTables.map(t => t.id)) + 1 : 1;
    
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
      status: 'LIVRE',
      x: foundX,
      y: foundY,
      zone: activeZone,
      shape: activeZone === 'BALCAO' ? 'RECTANGLE' : 'SQUARE',
      rotation: activeZone === 'BALCAO' ? 90 : 0
    };

    addTable(newTable);
    setSelectedTableId(nextId);
    addNotification('success', `${activeZone} - Mesa ${nextId} adicionada.`);
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id.toString());
      e.dataTransfer.setData('application/json', JSON.stringify({ id, type: 'TABLE' }));
    } catch (err) {
      console.error('Drag start error:', err);
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

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPos(null);
    if (!isEditMode || draggedTableId === null) return;

    const table = tables.find(t => t.id === draggedTableId);
    if (!table) return;

    const occupied = filteredTables.find(t => t.x === x && t.y === y && t.id !== draggedTableId);
    if (occupied) {
      addNotification('error', 'Colisão detectada! O espaço já contém um objeto.');
      setDraggedTableId(null);
      return;
    }

    const updatedTable = { ...table, x, y };
    updateTable(updatedTable);
    setSelectedTableId(draggedTableId);
    setDraggedTableId(null);
    addNotification('success', `${table.name} movida para nova posição. Guardar layout para confirmar.`);
  };

  const toggleStatus = (table: Table) => {
    if (isEditMode) {
      setSelectedTableId(table.id);
      return;
    }
    const nextStatus: Record<TableStatus, TableStatus> = {
      'LIVRE': 'RESERVADO',
      'RESERVADO': 'OCUPADO',
      'OCUPADO': 'PAGAMENTO',
      'PAGAMENTO': 'LIVRE'
    };
    updateTableStatus(table.id, nextStatus[table.status]);
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
      case 'LIVRE': return 'border-green-500 bg-green-500/10 text-green-500';
      case 'OCUPADO': return 'border-red-500 bg-red-600/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      case 'RESERVADO': return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
      case 'PAGAMENTO': return 'border-primary bg-primary/20 text-primary animate-pulse shadow-glow';
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
                  setIsEditMode(!isEditMode); 
                  if(isEditMode) {
                    setSelectedTableId(null);
                  }
                }}
                className={`px-6 py-2.5 rounded-xl border font-bold flex items-center gap-2 transition-all shadow-lg ${isEditMode ? 'bg-primary text-black border-primary shadow-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
              >
                {isEditMode ? <CheckCircle2 size={18} /> : <Settings2 size={18} />}
                {isEditMode ? 'Sair do Editor' : 'Editor de Layout'}
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
                            ${getStatusColor(table.status)}
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
                             
                             {table.status === 'OCUPADO' && !isEditMode && (
                               <div className="flex flex-col items-center animate-in fade-in duration-500">
                                 <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-white mb-0.5">
                                    <Clock size={10} className="text-primary" /> {timeElapsed}
                                 </div>
                                 <div className="text-[10px] font-mono font-black text-white bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
                                    {formatKz(total)}
                                 </div>
                               </div>
                             )}

                             {!table.currentOrderId && table.status !== 'OCUPADO' && !table.status.includes('PAGAMENTO') && isEditMode && (
                               <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded opacity-70">
                                  Editar
                               </div>
                             )}

                             {table.status === 'PAGAMENTO' && !isEditMode && (
                               <div className="flex flex-col items-center">
                                 <div className="text-[10px] font-mono font-black">FECHAR</div>
                                 <div className="text-[9px] font-mono font-bold">{formatKz(total)}</div>
                               </div>
                             )}
                          </div>

                          {/* Hover badge for capacity in occupied mode */}
                          {table.status === 'OCUPADO' && !isEditMode && (
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
        <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-300">
           <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Settings2 size={16} className="text-primary" /> Painel do Objeto
              </h3>
              <button 
                onClick={handleAddTable}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
                title="Adicionar Novo Objeto"
              >
                 <Plus size={18} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {selectedTable ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-primary focus:outline-none text-white font-bold text-sm"
                        value={selectedTable.name}
                        onChange={(e) => handleUpdateProperty('name', e.target.value)}
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Lugares (PAX)</label>
                      <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                        <button onClick={() => handleUpdateProperty('seats', Math.max(1, selectedTable.seats - 1))} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">-</button>
                        <span className="flex-1 text-center font-bold text-white">{selectedTable.seats} Lugares</span>
                        <button onClick={() => handleUpdateProperty('seats', selectedTable.seats + 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">+</button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Formato Geométrico</label>
                      <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'SQUARE', icon: Square },
                           { id: 'CIRCLE', icon: Circle },
                           { id: 'RECTANGLE', icon: RectangleHorizontal }
                         ].map(shape => (
                           <button 
                             key={shape.id}
                             onClick={() => handleUpdateProperty('shape', shape.id as TableShape)}
                             className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                               ${selectedTable.shape === shape.id ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-slate-500 hover:bg-white/10'}
                             `}
                           >
                              <shape.icon size={20} />
                              <span className="text-[8px] font-bold uppercase">{shape.id}</span>
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Orientação (Graus)</label>
                      <button onClick={() => handleUpdateProperty('rotation', (selectedTable.rotation + 90) % 360)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white hover:bg-white/10 transition-all">
                         <RotateCw size={18} className="text-primary" /> Rodar Objeto ({selectedTable.rotation}°)
                      </button>
                   </div>

                   <div className="pt-8 border-t border-white/5">
                      <button 
                        onClick={() => { 
                          if(window.confirm('Eliminar mesa permanentemente?')) { 
                            removeTable(selectedTable.id);
                            addNotification('success', `${selectedTable.name} eliminada. Guardar layout para confirmar.`);
                            setSelectedTableId(null);
                          }
                        }}
                        className="w-full py-4 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                      >
                         <Trash2 size={16} /> Eliminar Mesa
                      </button>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                   <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <MousePointer2 size={32} />
                   </div>
                   <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Selecione uma mesa<br/>para editar</p>
                </div>
              )}
           </div>

           <div className="p-6 bg-black/40 border-t border-white/10">
              <div className="flex gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">
                 <Move size={14} className="shrink-0 text-primary" />
                 <p>Arraste objetos para reposicionar. Avisos de colisão ativos.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TableLayout;
