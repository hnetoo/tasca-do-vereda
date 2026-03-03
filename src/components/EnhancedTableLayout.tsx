'use client';

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
import { updateTablePosition } from '@/app/actions/tableLayout';

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
    const table = tables.find(t => t.id === active.id);
    setDraggedTable(table || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!delta.x && !delta.y) {
      setDraggedTable(null);
      return;
    }

    const table = tables.find(t => t.id === active.id);
    if (!table || !isEditMode) {
      setDraggedTable(null);
      return;
    }

    setIsSaving(true);
    
    try {
      // Calculate new position
      const newX = (table.posicao_x || table.x || 0) + delta.x;
      const newY = (table.posicao_y || table.y || 0) + delta.y;
      
      // Update in database via server action
      const result = await updateTablePosition(table.id, newX, newY);
      
      if (result.success) {
        // Update local state
        const updatedTables = tables.map(t => 
          t.id === table.id 
            ? { ...t, posicao_x: newX, posicao_y: newY }
            : t
        );
        onTablesChange?.(updatedTables);
      } else {
        console.error('Failed to update table position:', result.error);
      }
    } catch (error) {
      console.error('Error updating table position:', error);
    } finally {
      setIsSaving(false);
      setDraggedTable(null);
    }
  };

  const filteredTables = tables.filter(table => {
    if (!activeZone) return true;
    return table.ambiente === activeZone || table.zone === activeZone;
  });

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
          {filteredTables.map((table) => (
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
