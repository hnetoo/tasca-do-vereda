'use client';

// CONFIGURAÇÃO DEFINITIVA - NÃO REVERTER PARA MOCKS
// PRIORIDADE MÁXIMA AO BANCO DE DADOS - USAR APENAS DADOS DO SUPABASE
// OFFLINE-FIRST: Cache local com fallback para Supabase

import React, { useState, useRef, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { 
  sortableKeyboardCoordinates, 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Table, TableZone, TableStatus } from '@/types';
import { useOfflineTables } from '@/hooks/useOfflineTables';

interface DraggableTableProps {
  table: Table;
  isDragging?: boolean;
  isEditMode: boolean;
  onTableClick?: (table: Table) => void;
}

const DraggableTable: React.FC<DraggableTableProps> = ({ 
  table, 
  isDragging, 
  isEditMode,
  onTableClick 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const getTableColor = (status: TableStatus) => {
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

  const getShapeStyles = (shape: string) => {
    switch (shape) {
      case 'CIRCLE':
        return 'rounded-full';
      case 'SQUARE':
        return 'rounded-lg';
      case 'RECTANGLE':
      default:
        return 'rounded-lg';
    }
  };

  return (
    <div
      className={`
        absolute cursor-pointer transition-all duration-200
        ${getTableColor(table.status)}
        ${getShapeStyles(table.shape || 'RECTANGLE')}
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}
        ${isEditMode ? 'hover:scale-105 hover:shadow-xl' : ''}
        flex items-center justify-center text-white font-bold
        ${isSaving ? 'animate-pulse' : ''}
      `}
      style={{
        left: `${table.posicao_x || table.x || 0}px`,
        top: `${table.posicao_y || table.y || 0}px`,
        width: `${table.width || 80}px`,
        height: `${table.height || 80}px`,
        zIndex: isDragging ? 1000 : 1
      }}
      onClick={() => !isEditMode && onTableClick?.(table)}
    >
      <div className="text-center">
        <div className="text-xs">{table.name || `Mesa ${table.number}`}</div>
        <div className="text-xs opacity-75">{table.seats || 4} lugares</div>
        {isSaving && <div className="text-xs">...</div>}
      </div>
    </div>
  );
};

interface TableLayoutProps {
  tables: Table[];
  activeZone: TableZone;
  isEditMode: boolean;
  onTableClick?: (table: Table) => void;
  onTablesChange?: (tables: Table[]) => void;
}

const EnhancedTableLayout: React.FC<TableLayoutProps> = ({
  tables,
  activeZone,
  isEditMode,
  onTableClick,
  onTablesChange
}) => {
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // OFFLINE-FIRST: Usar hook de cache offline
  const { tables: offlineTables, loading, isOnline, refreshTables } = useOfflineTables();
  
  // Usar mesas do cache offline quando disponível
  const displayTables = offlineTables.length > 0 ? offlineTables : tables;
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const table = displayTables.find(t => t.id === active.id);
    setDraggedTable(table || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!delta.x && !delta.y) {
      setDraggedTable(null);
      return;
    }

    const table = displayTables.find(t => t.id === active.id);
    if (!table || !isEditMode) {
      setDraggedTable(null);
      return;
    }

    setIsSaving(true);
    
    try {
      // Calculate new position
      const newX = (table.posicao_x || table.x || 0) + delta.x;
      const newY = (table.posicao_y || table.y || 0) + delta.y;
      
      // Update in database via API route for better security
      const response = await fetch('/api/tables/update-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: table.id,
          x: newX,
          y: newY
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const updatedTables = displayTables.map(t => 
          t.id === table.id 
            ? { ...t, posicao_x: newX, posicao_y: newY }
            : t
        );
        
        // Atualizar cache offline também
        if (offlineTables.length > 0) {
          refreshTables();
        }
        
        onTablesChange?.(updatedTables);
        console.log('✅ Posição da mesa atualizada com sucesso:', { tableId: table.id, newX, newY });
      } else {
        console.error('❌ Falha ao atualizar posição da mesa:', result.error);
        // Mostrar erro no ecrã
        alert(`❌ Erro ao salvar posição da mesa: ${result.error || 'Erro desconhecido'}`);
        // NÃO reverter a mesa para o lugar antigo - manter na nova posição
      }
    } catch (error) {
      console.error('Error updating table position:', error);
    } finally {
      setIsSaving(false);
      setDraggedTable(null);
    }
  };

  // LOG DEPURAÇÃO - MOSTRAR DADOS DO CACHE
  console.log('🔍 Mesas do cache:', offlineTables);
  console.log('🔍 Total de mesas:', displayTables.length);
  console.log('🔍 Status online:', isOnline);
  console.log('🔍 Filtro ativo (ambiente):', activeZone);

  // REMOVER FILTRO - MOSTRAR TODAS AS MESAS
  const filteredTables = displayTables; // Sem filtro por agora - mostrar todas

  console.log('🔍 Mesas após filtro:', filteredTables.length);
  console.log('🔍 Mesas filtradas:', filteredTables.map(t => ({ id: t.id, name: t.name, ambiente: t.ambiente || t.zone || 'INTERIOR' })));

  // FORÇAR POSIÇÃO PADRÃO PARA TODAS AS MESAS
  const tablesWithPosition = filteredTables.map((table, index) => ({
    ...table,
    // Renderização de emergência: posição automática se não existir
    posicao_x: table.posicao_x || table.x || (index % 3) * 120, // 3 mesas por linha
    posicao_y: table.posicao_y || table.y || Math.floor(index / 3) * 120, // Próxima linha
    // Garantir que table_number seja usado se number não existir
    number: table.number || table.table_number || index + 1,
    // Nome padrão se não existir
    name: table.name || `Mesa ${table.table_number || table.number || index + 1}`
  }));

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="relative w-full h-full">
          {tablesWithPosition.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              isDragging={draggedTable?.id === table.id}
              isEditMode={isEditMode}
              onTableClick={onTableClick}
            />
          ))}
        </div>
        
        <DragOverlay>
          {draggedTable ? (
            <DraggableTable
              table={draggedTable}
              isDragging={true}
              isEditMode={isEditMode}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {isSaving && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">
          Salvando posição...
        </div>
      )}
    </div>
  );
};

export default EnhancedTableLayout;
