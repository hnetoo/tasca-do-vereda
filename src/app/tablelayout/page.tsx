'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  LayoutGrid, MousePointer2, Move, Trash2, Users, 
  AlertCircle, CheckCircle2, Home, Sun, 
  Beer, Square, Circle, RectangleHorizontal, RotateCw, Settings2,
  Clock, Plus, Edit3
} from 'lucide-react';
import EnhancedTableLayout from '@/components/EnhancedTableLayout';
import { supabase } from '@/lib/supabase';

const TableLayout = () => {
  const { 
    tables, addTable, updateTable, removeTable, updateTableStatus, 
    addNotification, activeOrders, saveStatus 
  } = useStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeZone, setActiveZone] = useState<'INTERIOR' | 'EXTERIOR' | 'BALCAO'>('INTERIOR');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadTables = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.from('restaurant_tables').select('*');
        console.log('Mesas carregadas:', data);
        if (data) {
          data.forEach(table => {
            const existingTable = tables.find(t => t.id === table.id);
            if (!existingTable) {
              addTable({
                id: table.id,
                number: table.number,
                label: table.label,
                x: table.x,
                y: table.y,
                seats: table.seats || 4,
                shape: table.shape,
                status: table.status,
                is_active: table.is_active !== false,
                color: table.color || 'blue',
                ambiente: table.ambiente || 'INTERIOR'
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTables();
  }, [tables, addTable]);

  const filteredTables = useMemo(() => {
    return tables; // Remove filter to show ALL tables
  }, [tables]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setClickPosition({ x, y });
    setShowCreateModal(true);
  };

  const handleCreateTable = (tableData: any) => {
    if (!clickPosition) return;
    
    const newTable = {
      id: crypto.randomUUID(),
      label: tableData.label,
      number: tableData.number,
      seats: tableData.capacity || 4,
      shape: tableData.shape,
      x: clickPosition.x,
      y: clickPosition.y,
      ambiente: activeZone,
      color: '#3B82F6',
      status: 'available',
      is_active: true
    };
    
    addTable(newTable);
    setShowCreateModal(false);
    setClickPosition(null);
    addNotification(`Mesa ${tableData.number} criada com sucesso`, 'success');
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('Tem certeza que deseja remover esta mesa?')) {
      removeTable(tableId);
      addNotification('Mesa removida com sucesso', 'success');
    }
  };

  const handleUpdateTablePosition = (tableId: string, x: number, y: number) => {
    updateTable(tableId, { x, y });
  };

  const handleUpdateTableStatus = (tableId: string, status: any) => {
    updateTableStatus(tableId, status);
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Layout de Mesas</h1>
            <p className="text-gray-400 text-sm">Organize e configure o layout do restaurante</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Zone Selector */}
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value as 'INTERIOR' | 'EXTERIOR' | 'BALCAO')}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Selecionar zona"
            >
              <option value="INTERIOR">Interior</option>
              <option value="EXTERIOR">Exterior</option>
              <option value="BALCAO">Balcão</option>
            </select>

            {/* Edit Mode Toggle */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isEditMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Concluído
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Editar Layout
                </>
              )}
            </button>

            <button
              onClick={() => window.location.href = '/owner'}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Mesas</p>
                <p className="text-2xl font-bold text-white">{filteredTables.length}</p>
              </div>
              <LayoutGrid className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Disponíveis</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredTables.filter(t => t.status === 'available').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Ocupadas</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {filteredTables.filter(t => t.status === 'occupied').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Reservadas</p>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredTables.filter(t => t.status === 'reserved').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Layout */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">
            {activeZone === 'INTERIOR' ? 'Interior' : activeZone === 'EXTERIOR' ? 'Exterior' : 'Balcão'}
          </h2>
          {isEditMode && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MousePointer2 className="w-4 h-4" />
              Clique para adicionar mesa
            </div>
          )}
        </div>

        <div 
          className="relative bg-slate-900 border border-slate-700 rounded-lg min-h-[600px] cursor-crosshair"
          onClick={handleMapClick}
        >
          <EnhancedTableLayout
            tables={filteredTables}
            isEditMode={isEditMode}
            activeZone={activeZone}
            selectedTableId={selectedTableId}
            onUpdatePosition={handleUpdateTablePosition}
            onUpdateStatus={handleUpdateTableStatus}
            onDeleteTable={handleDeleteTable}
          />
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateModal && clickPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Nova Mesa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Número</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1"
                  id="tableNumber"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Etiqueta</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mesa 1"
                  id="tableLabel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Capacidade</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 4"
                  id="tableCapacity"
                  min="1"
                  max="20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Forma</label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="tableShape"
                  title="Selecionar forma da mesa"
                >
                  <option value="square">Quadrada</option>
                  <option value="circle">Redonda</option>
                  <option value="rectangle">Retangular</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setClickPosition(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const number = (document.getElementById('tableNumber') as HTMLInputElement).value;
                  const label = (document.getElementById('tableLabel') as HTMLInputElement).value;
                  const capacity = parseInt((document.getElementById('tableCapacity') as HTMLInputElement).value);
                  const shape = (document.getElementById('tableShape') as HTMLSelectElement).value;
                  
                  handleCreateTable({ number, label, capacity, shape });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableLayout;
