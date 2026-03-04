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
import { getTablesByAmbiente } from '@/app/actions/tableLayout';

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

  // Load tables from database on component mount
  useEffect(() => {
    loadTablesFromDB();
  }, [activeZone]);

  const loadTablesFromDB = async () => {
    try {
      setIsLoading(true);
      const result = await getTablesByAmbiente(activeZone);
      if (result.success && result.data) {
        // Add tables to store if they don't exist
        result.data.forEach(table => {
          const existingTable = tables.find(t => t.id === table.id);
          if (!existingTable) {
            addTable({
              id: table.id,
              number: table.number,
              label: table.label,
              x: table.x,
              y: table.y,
              zone: table.zone,
              seats: table.seats,
              shape: table.shape,
              status: table.status,
              color: table.color
            });
          }
        });
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      addNotification('error', 'Erro ao carregar mesas');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter(table => table.zone === activeZone);
  }, [tables, activeZone]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickPosition({ x, y });
    setShowCreateModal(true);
  };

  const handleCreateTable = (number: number, zone: string) => {
    if (!clickPosition) return;

    const newTable = {
      id: `table-${Date.now()}`,
      number,
      label: `Mesa ${number}`,
      x: clickPosition.x,
      y: clickPosition.y,
      zone: zone as 'INTERIOR' | 'EXTERIOR' | 'BALCAO',
      seats: 4,
      shape: 'square' as const,
      status: 'available' as const,
      color: '#3B82F6'
    };

    addTable(newTable);
    setShowCreateModal(false);
    setClickPosition(null);
    addNotification('success', `Mesa ${number} criada com sucesso`);
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      removeTable(tableId);
      addNotification('success', `Mesa ${table.number} removida`);
    }
  };

  const handleUpdateTablePosition = (tableId: string, x: number, y: number) => {
    const table = { x, y };
    updateTable(tableId, table);
  };

  const handleUpdateTableStatus = (tableId: string, status: any) => {
    updateTableStatus(tableId, status);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/owner'}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold text-slate-50">Layout de Mesas</h1>
                  <p className="text-sm text-slate-400">Configuração Visual do Restaurante</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Zone Selector */}
              <select
                value={activeZone}
                onChange={(e) => setActiveZone(e.target.value as 'INTERIOR' | 'EXTERIOR' | 'BALCAO')}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Sair do Editor
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Modo Editor
                  </>
                )}
              </button>

              {/* New Table Button */}
              {isEditMode && (
                <button
                  onClick={() => {
                    setClickPosition({ x: 100, y: 100 });
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total de Mesas</p>
                <p className="text-2xl font-bold text-slate-50">{filteredTables.length}</p>
              </div>
              <LayoutGrid className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Disponíveis</p>
                <p className="text-2xl font-bold text-slate-50">
                  {filteredTables.filter(t => t.status === 'available').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ocupadas</p>
                <p className="text-2xl font-bold text-slate-50">
                  {filteredTables.filter(t => t.status === 'occupied').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Hora Atual</p>
                <p className="text-2xl font-bold text-slate-50">
                  {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Table Layout */}
        <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-50">
                {isEditMode ? 'Clique no mapa para adicionar mesas' : `Layout - ${activeZone}`}
              </h2>
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Carregando...
                </div>
              )}
            </div>
            
            <div 
              className="relative bg-slate-950 rounded-lg border-2 border-dashed border-slate-700 h-96 cursor-crosshair"
              onClick={handleMapClick}
            >
              {isEditMode && (
                <div className="absolute top-2 left-2 text-xs text-slate-500">
                  Clique para posicionar nova mesa
                </div>
              )}
              
              <EnhancedTableLayout
                tables={filteredTables}
                isEditMode={isEditMode}
                selectedTableId={selectedTableId}
                onTableSelect={setSelectedTableId}
                onTableMove={handleUpdateTablePosition}
                onTableStatusChange={handleUpdateTableStatus}
                onTableDelete={handleDeleteTable}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Criar Nova Mesa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Número da Mesa</label>
                <input
                  type="number"
                  min="1"
                  defaultValue={filteredTables.length + 1}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="tableNumber"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Zona</label>
                <select
                  defaultValue={activeZone}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="tableZone"
                >
                  <option value="INTERIOR">Interior</option>
                  <option value="EXTERIOR">Exterior</option>
                  <option value="BALCAO">Balcão</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setClickPosition(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const number = parseInt((document.getElementById('tableNumber') as HTMLInputElement).value);
                  const zone = (document.getElementById('tableZone') as HTMLSelectElement).value;
                  handleCreateTable(number, zone);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
