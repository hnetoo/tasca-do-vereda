/**
 * Editor Visual do Layout de Mesas
 * Permite arrastar, droppar, adicionar, editar e remover mesas
 */

import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Table } from '../types';
import { Plus, Trash2, Edit2, Save, X, Grid3x3, Circle, Square as SquareIcon, Users } from 'lucide-react';

interface TableLayoutEditorProps {
  onClose?: () => void;
}

const TableLayoutEditor: React.FC<TableLayoutEditorProps> = ({ onClose }) => {
  const { tables, addTable, updateTable, removeTable, settings, addNotification } = useStore();
  const [selectedZone, setSelectedZone] = useState<'INTERIOR' | 'EXTERIOR' | 'BALCAO'>('INTERIOR');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [draggedTable, setDraggedTable] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    seats: 4,
    zone: 'INTERIOR' as 'INTERIOR' | 'EXTERIOR' | 'BALCAO',
    shape: 'SQUARE' as 'SQUARE' | 'CIRCLE' | 'RECTANGLE',
    x: 100,
    y: 100
  });

  const zoneColors = {
    INTERIOR: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', label: '🏠 Interior' },
    EXTERIOR: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', label: '🌳 Exterior' },
    BALCAO: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', label: '🍽️ Balcão' }
  };

  const filteredTables = tables.filter(t => t.zone === selectedZone);

  const handleAddTable = () => {
    setFormData({
      name: `Mesa ${Math.max(0, ...tables.map(t => t.id)) + 1}`,
      seats: 4,
      zone: selectedZone,
      shape: 'SQUARE',
      x: 100,
      y: 100
    });
    setEditingTable(null);
    setShowFormModal(true);
  };

  const handleEditTable = (table: Table) => {
    setFormData({
      name: table.name,
      seats: table.seats,
      zone: table.zone,
      shape: table.shape,
      x: table.x || 100,
      y: table.y || 100
    });
    setEditingTable(table);
    setShowFormModal(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.seats < 1) {
      addNotification('error', 'Preencha todos os campos corretamente');
      return;
    }

    if (editingTable) {
      updateTable({
        ...editingTable,
        ...formData
      });
      addNotification('success', `Mesa ${formData.name} atualizada`);
    } else {
      const newTable: Table = {
        id: tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1,
        name: formData.name,
        seats: formData.seats,
        zone: formData.zone,
        shape: formData.shape,
        x: formData.x,
        y: formData.y,
        status: 'LIVRE',
        rotation: 0
      };
      addTable(newTable);
      addNotification('success', `Mesa ${formData.name} criada`);
    }

    setShowFormModal(false);
  };

  const handleDragStart = (table: Table) => {
    setDraggedTable(table.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTable !== null && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const table = tables.find(t => t.id === draggedTable);
      if (table) {
        updateTable({
          ...table,
          x: e.clientX - rect.left - 40,
          y: e.clientY - rect.top - 40
        });
      }
    }
    setDraggedTable(null);
  };

  const getTableShape = (shape: string) => {
    switch (shape) {
      case 'CIRCLE':
        return 'rounded-full';
      case 'RECTANGLE':
        return 'rounded-lg';
      default:
        return 'rounded-xl';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OCUPADO':
        return 'bg-red-500/30 border-red-500 text-red-300';
      case 'RESERVADO':
        return 'bg-yellow-500/30 border-yellow-500 text-yellow-300';
      case 'PAGAMENTO':
        return 'bg-purple-500/30 border-purple-500 text-purple-300';
      default:
        return 'bg-green-500/30 border-green-500 text-green-300';
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Seletor de Zona */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(zoneColors).map(([zone, style]) => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone as any)}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${
              selectedZone === zone
                ? `${style.bg} ${style.border} border-2`
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Canvas de Layout */}
      <div className="bg-slate-900 rounded-[2.5rem] border-2 border-white/10 overflow-hidden">
        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative border-b-2 border-white/5"
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }}
          ></div>

          {/* Mesas */}
          {filteredTables.map(table => (
            <div
              key={table.id}
              draggable
              onDragStart={() => handleDragStart(table)}
              style={{
                left: `${table.x}px`,
                top: `${table.y}px`
              }}
              className={`absolute w-20 h-20 ${getTableShape(table.shape)} border-2 cursor-move transition-all hover:scale-110 flex flex-col items-center justify-center gap-1 text-center group ${getStatusColor(table.status)}`}
            >
              <div className="font-black text-xs uppercase">{table.name}</div>
              <div className="text-[8px] font-bold flex items-center gap-1">
                <Users size={10} /> {table.seats}
              </div>

              {/* Ações em Hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex gap-2 bg-black/90 rounded-lg p-2 z-20 shadow-xl">
                <button
                  onClick={() => handleEditTable(table)}
                  className="p-1.5 bg-primary rounded hover:brightness-110 transition-all"
                  title="Editar"
                >
                  <Edit2 size={12} className="text-black" />
                </button>
                <button
                  onClick={() => {
                    removeTable(table.id);
                    addNotification('success', `Mesa ${table.name} removida`);
                  }}
                  className="p-1.5 bg-red-500 rounded hover:brightness-110 transition-all"
                  title="Remover"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            </div>
          ))}

          {filteredTables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Grid3x3 size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm font-bold uppercase">Nenhuma mesa nesta zona</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats e Ações */}
        <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">{filteredTables.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Mesas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-400">
                {filteredTables.filter(t => t.status === 'LIVRE').length}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Livres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-red-400">
                {filteredTables.filter(t => t.status === 'OCUPADO').length}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Ocupadas</div>
            </div>
          </div>

          <button
            onClick={handleAddTable}
            className="px-6 py-3 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-glow"
          >
            <Plus size={16} /> Nova Mesa
          </button>
        </div>
      </div>

      {/* Modal de Formulário */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="glass-panel rounded-[2rem] p-8 border border-white/10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white uppercase italic">
                {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Mesa</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mesa 1, Balcão, etc"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Capacidade (Lugares)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary"
                  value={formData.seats}
                  onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Forma</label>
                <select
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-primary"
                  value={formData.shape}
                  onChange={e => setFormData({ ...formData, shape: e.target.value as any })}
                >
                  <option value="SQUARE">⬜ Quadrada</option>
                  <option value="CIRCLE">⭕ Redonda</option>
                  <option value="RECTANGLE">▭ Retangular</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-black uppercase text-[10px] hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black rounded-xl font-black uppercase text-[10px] hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableLayoutEditor;
