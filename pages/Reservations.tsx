
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Clock, Users, Plus, Search, X, Check, Trash2, Edit2, Table as TableIcon } from 'lucide-react';
import { Reservation } from '../types';

const Reservations = () => {
  const { reservations, tables, addReservation, updateReservation, removeReservation } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [form, setForm] = useState<{
    customerName: string;
    date: string;
    time: string;
    people: number;
    tableId: string;
  }>({
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    people: 2,
    tableId: ''
  });

  // Filter Logic
  const filteredReservations = reservations.filter(res => 
    res.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (res?: Reservation) => {
    if (res) {
      setEditingReservation(res);
      const dateObj = new Date(res.date);
      setForm({
        customerName: res.customerName,
        date: dateObj.toISOString().split('T')[0],
        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        people: res.people,
        tableId: res.tableId ? res.tableId.toString() : ''
      });
    } else {
      setEditingReservation(null);
      const now = new Date();
      setForm({
        customerName: '',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        people: 2,
        tableId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${form.date}T${form.time}`);

    if (editingReservation) {
      updateReservation({
        ...editingReservation,
        customerName: form.customerName,
        date: dateTime,
        people: Number(form.people),
        tableId: form.tableId ? Number(form.tableId) : undefined
      });
    } else {
      addReservation({
        id: `res-${Date.now()}`,
        customerName: form.customerName,
        date: dateTime,
        people: Number(form.people),
        tableId: form.tableId ? Number(form.tableId) : undefined,
        status: 'PENDENTE'
      });
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = (res: Reservation, newStatus: 'CONFIRMADA' | 'CANCELADA') => {
    updateReservation({ ...res, status: newStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta reserva?')) {
      removeReservation(id);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-900 text-gray-100">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-primary" /> Gestão de Reservas
            </h2>
            <p className="text-gray-400 text-sm mt-1">Agende e organize a ocupação das mesas</p>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text"
                    placeholder="Buscar reserva..."
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-primary text-sm w-64"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => handleOpenModal()}
                className="bg-primary text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow hover:bg-cyan-400 transition-colors font-bold"
            >
                <Plus size={20} />
                Nova Reserva
            </button>
        </div>
      </header>

      {/* Reservations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.length === 0 ? (
            <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhuma reserva encontrada.</p>
            </div>
        ) : (
            filteredReservations.map(res => (
              <div key={res.id} className="bg-gray-800/50 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-6">
                    <div className="w-16 text-center">
                        <span className="block text-lg font-bold text-white leading-none">{new Date(res.date).getDate()}</span>
                        <span className="text-xs text-gray-400 uppercase">{new Date(res.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="w-px h-10 bg-gray-700"></div>
                    <div>
                        <h4 className="text-lg font-bold text-white">{res.customerName}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(res.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="flex items-center gap-1"><Users size={14} /> {res.people} pax</span>
                            {res.tableId && <span className="flex items-center gap-1 text-primary"><TableIcon size={14} /> Mesa {res.tableId}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${res.status === 'CONFIRMADA' ? 'bg-green-900/30 text-green-400 border border-green-900' : ''}
                        ${res.status === 'PENDENTE' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' : ''}
                        ${res.status === 'CANCELADA' ? 'bg-red-900/30 text-red-400 border border-red-900' : ''}
                    `}>
                        {res.status}
                    </span>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {res.status === 'PENDENTE' && (
                            <button 
                                onClick={() => handleStatusChange(res, 'CONFIRMADA')}
                                className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-500" title="Confirmar Chegada"
                            >
                                <Check size={16} />
                            </button>
                        )}
                        <button onClick={() => handleOpenModal(res)} className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white">
                            <Edit2 size={16} />
                        </button>
                        {res.status !== 'CANCELADA' && (
                            <button onClick={() => handleStatusChange(res, 'CANCELADA')} className="p-2 rounded-lg bg-gray-700 text-red-400 hover:bg-red-900/30">
                                <X size={16} />
                            </button>
                        )}
                        <button onClick={() => handleDelete(res.id)} className="p-2 rounded-lg hover:bg-red-600 hover:text-white text-gray-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{editingReservation ? 'Editar Reserva' : 'Nova Reserva'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Cliente</label>
                        <input 
                            required
                            type="text"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-primary outline-none"
                            value={form.customerName}
                            onChange={e => setForm({...form, customerName: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data</label>
                            <input 
                                required
                                type="date"
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-primary outline-none"
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hora</label>
                            <input 
                                required
                                type="time"
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-primary outline-none"
                                value={form.time}
                                onChange={e => setForm({...form, time: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Pessoas</label>
                            <input 
                                required
                                type="number"
                                min="1"
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-primary outline-none"
                                value={form.people}
                                onChange={e => setForm({...form, people: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mesa (Opcional)</label>
                            <select 
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-primary outline-none"
                                value={form.tableId}
                                onChange={e => setForm({...form, tableId: e.target.value})}
                            >
                                <option value="">-- Selecionar --</option>
                                {tables.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.seats} lug)</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-xl mt-4 hover:bg-cyan-400 transition-colors shadow-glow">
                        Salvar Reserva
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
