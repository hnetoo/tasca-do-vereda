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
import { Table, TableStatus, TableZone } from '@/types';
import EnhancedTableLayout from '@/components/EnhancedTableLayout';
import CreateTableModal from '@/components/CreateTableModal';
import { getTablesByAmbiente } from '@/app/actions/tableLayout';

const TableLayout = () => {
  const { 
    tables, addTable, updateTable, removeTable, updateTableStatus, 
    addNotification, activeOrders, saveStatus 
  } = useStore();
  const user = useSelector((state: any) => state.auth.user);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeZone, setActiveZone] = useState<TableZone>('INTERIOR');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbTables, setDbTables] = useState<Table[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  // Load tables from database when zone changes
  useEffect(() => {
    if (isAdmin) {
      loadTablesFromDB();
    }
  }, [activeZone, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTablesFromDB = async () => {
    setIsLoading(true);
    try {
      const result = await getTablesByAmbiente(activeZone);
      if (result.success && result.data) {
        setDbTables(result.data);
        // Update store with fetched tables
        result.data.forEach(table => {
          const exists = tables.find(t => t.id === table.id);
          if (!exists) {
            addTable(table);
          } else {
            // Update existing table with fresh data
            updateTable(table);
          }
        });
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      addNotification('Erro ao carregar mesas do banco de dados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = useMemo(() => {
    const allTables = [...tables, ...dbTables.filter(db => !tables.find(t => t.id === db.id))];
    
    if (!activeZone || !['INTERIOR', 'EXTERIOR', 'BALCAO'].includes(activeZone)) {
      return allTables;
    }
    
    return allTables.filter(table => {
      const tableZone = table.ambiente || table.zone;
      return tableZone === activeZone;
    });
  }, [tables, dbTables, activeZone]);

  const handleTableClick = (table: Table) => {
    if (!isEditMode) {
      setSelectedTableId(table.id);
      // Toggle status logic here
      const statuses: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'PAYMENT', 'DIRTY'];
      const currentIndex = statuses.indexOf(table.status as TableStatus);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      
      updateTableStatus(table.id, nextStatus);
      addNotification(`Mesa ${table.name} atualizada para ${nextStatus}`, 'success');
    }
  };

  const handleTablesChange = (updatedTables: Table[]) => {
    // Update store with new table positions
    updatedTables.forEach(table => {
      updateTable(table);
    });
  };

  const handleCreateSuccess = () => {
    addNotification('Mesa criada com sucesso', 'success');
    loadTablesFromDB(); // Reload tables from DB
  };

  const getZoneIcon = (zone: TableZone) => {
    switch (zone) {
      case 'INTERIOR': return <Home size={16} />;
      case 'EXTERIOR': return <Sun size={16} />;
      case 'BALCAO': return <Beer size={16} />;
      default: return <Home size={16} />;
    }
  };

  const getZoneColor = (zone: TableZone) => {
    switch (zone) {
      case 'INTERIOR': return 'bg-blue-500';
      case 'EXTERIOR': return 'bg-orange-500';
      case 'BALCAO': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500';
      case 'OCCUPIED': return 'bg-red-500';
      case 'RESERVED': return 'bg-yellow-500';
      case 'PAYMENT': return 'bg-blue-500';
      case 'DIRTY': return 'bg-gray-500';
      case 'MAINTENANCE': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-AO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-AO', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Apenas administradores podem acessar o layout de mesas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Layout de Mesas</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatTime(currentTime)}</span>
              </div>
              <div>{formatDate(currentTime)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isEditMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {isEditMode ? (
                <>
                  <MousePointer2 size={16} className="inline mr-2" />
                  Modo Visualização
                </>
              ) : (
                <>
                  <Move size={16} className="inline mr-2" />
                  Modo Edição
                </>
              )}
            </button>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
            >
              <Plus size={16} className="inline mr-2" />
              Nova Mesa
            </button>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="flex gap-2">
          {(['INTERIOR', 'EXTERIOR', 'BALCAO'] as TableZone[]).map(zone => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeZone === zone
                  ? `${getZoneColor(zone)} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {getZoneIcon(zone)}
              {zone === 'INTERIOR' ? 'Interior' : zone === 'EXTERIOR' ? 'Exterior' : 'Balcão'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Carregando mesas...</span>
        </div>
      )}

      {/* Table Layout */}
      <div className="bg-gray-900 rounded-lg p-4 min-h-[600px]">
        <EnhancedTableLayout
          tables={filteredTables}
          activeZone={activeZone}
          isEditMode={isEditMode}
          onTableClick={handleTableClick}
          onTablesChange={handleTablesChange}
        />
      </div>

      {/* Status Legend */}
      <div className="mt-6 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-400">Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-400">Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-400">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-400">Pagamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
          <span className="text-sm text-gray-400">Suja</span>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <Move size={20} />
            <span className="font-bold">MODO EDIÇÃO ATIVADO - Arraste as mesas para reposicionar</span>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default TableLayout;
