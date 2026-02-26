'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ChefHat, Plus, Trash2, Edit } from 'lucide-react';
import { generateUUID } from '@/utils/uuid';

export default function SettingsTablesPage() {
  const { settings, tables, addTable, updateTable, removeTable, addNotification } = useStore();
  const [editingTable, setEditingTable] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', capacity: 4, status: 'available' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      const updatedTable = { ...editingTable, ...formData };
      updateTable(updatedTable);
      addNotification('success', 'Mesa atualizada com sucesso!');
    } else {
      const newTable = {
        id: generateUUID(),
        name: formData.name,
        capacity: formData.capacity,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        label: formData.name,
        is_active: true,
        color: null,
        group_id: null,
        height: null,
        width: null,
        x_position: null,
        y_position: null,
        x: null,
        y: null,
        zone: null,
        shape: null,
        min_capacity: null,
        max_capacity: null,
        qr_code_url: null,
        reservation_enabled: false,
        number: null,
        rotation: null,
        seats: null,
        user_id: null,
        activeOrderIds: []
      } as any;
      addTable(newTable);
      addNotification('success', 'Mesa adicionada com sucesso!');
    }
    setFormData({ name: '', capacity: 4, status: 'available' });
    setEditingTable(null);
  };

  const handleEdit = (table: any) => {
    setEditingTable(table);
    setFormData({ name: table.name, capacity: table.capacity, status: table.status });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta mesa?')) {
      removeTable(id);
      addNotification('success', 'Mesa removida com sucesso!');
    }
  };

  const handleCancel = () => {
    setEditingTable(null);
    setFormData({ name: '', capacity: 4, status: 'available' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mesas</h1>
        <p className="text-slate-400">Gestão de mesas e layout</p>
      </div>

      <div className="space-y-8">
        {/* Formulário */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
              <ChefHat size={22} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
              {editingTable ? 'Editar Mesa' : 'Adicionar Nova Mesa'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Mesa</label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mesa 1, Balcão, etc."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Capacidade</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="available" className="bg-slate-900">Disponível</option>
                  <option value="occupied" className="bg-slate-900">Ocupada</option>
                  <option value="maintenance" className="bg-slate-900">Manutenção</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-glow"
              >
                {editingTable ? 'Atualizar Mesa' : 'Adicionar Mesa'}
              </button>
              {editingTable && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Mesas */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500">
                <ChefHat size={22} />
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Mesas Configuradas</h3>
            </div>
            <div className="text-sm text-slate-400">
              Total: {tables?.length || 0} mesas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(tables || []).map((table: any) => (
              <div
                key={table.id}
                className={`p-6 rounded-2xl border transition-all duration-200 ${
                  table.status === 'available'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : table.status === 'occupied'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-white">{table.name}</h4>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      table.status === 'available'
                        ? 'bg-emerald-500'
                        : table.status === 'occupied'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-400">
                    Capacidade: <span className="text-white font-bold">{table.capacity} pessoas</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Status: <span className="text-white font-bold capitalize">
                      {table.status === 'available' ? 'Disponível' : table.status === 'occupied' ? 'Ocupada' : 'Manutenção'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(table)}
                    className="flex-1 p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="flex-1 p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!tables || tables.length === 0) && (
            <div className="text-center py-12">
              <ChefHat className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Nenhuma mesa configurada</h4>
              <p className="text-slate-400">
                Adicione sua primeira mesa para começar a configurar o layout do restaurante.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
