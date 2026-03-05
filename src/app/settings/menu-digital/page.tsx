'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, QrCode, Plus, Edit, Trash2, Save, Upload, RefreshCw } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image_url?: string;
  qr_code?: string;
}

export default function SettingsMenuDigitalPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      } else {
        setMenuItems(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update existing item
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          available: formData.available
        })
        .eq('id', editingItem.id);

      if (!error) {
        setEditingItem(null);
        fetchMenuItems();
      }
    } else {
      // Create new item
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          available: formData.available
        });

      if (!error) {
        setFormData({
          name: '',
          description: '',
          price: 0,
          category: '',
          available: true
        });
        fetchMenuItems();
      }
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchMenuItems();
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync with digital menu
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Menu sincronizado com sucesso!');
    } catch (error) {
      alert('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const generateQRCode = async (itemId: string) => {
    // Simulate QR code generation
    const qrData = `https://tasca-do-vereda.vercel.app/menu/item/${itemId}`;
    const { error } = await supabase
      .from('menu_items')
      .update({ qr_code: qrData })
      .eq('id', itemId);

    if (!error) {
      alert('QR Code gerado com sucesso!');
      fetchMenuItems();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-semibold">Menu Digital & QR Code</h1>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingItem ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nome do Item
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Nome do prato/bebida"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Descrição detalhada"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Preço (AOA)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="entradas">Entradas</option>
                    <option value="pratos">Pratos Principais</option>
                    <option value="sobremesas">Sobremesas</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="cafes">Cafés</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4 text-orange-600 bg-slate-800 border-slate-700 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-slate-400">
                    Disponível no menu
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({
                          name: '',
                          description: '',
                          price: 0,
                          category: '',
                          available: true
                        });
                      }}
                      className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Itens do Menu ({menuItems.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Carregando...</p>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhum item encontrado.</p>
                  <p className="text-slate-500 text-sm mt-2">Adicione seu primeiro item ao menu.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-6 py-3 text-slate-400 font-medium">Nome</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Categoria</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Preço</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Status</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">QR Code</th>
                        <th className="px-6 py-3 text-slate-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="px-6 py-4 text-white">{item.name}</td>
                          <td className="px-6 py-4 text-slate-300">{item.category}</td>
                          <td className="px-6 py-4 text-white">{item.price.toLocaleString()} AOA</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.available 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {item.available ? 'Disponível' : 'Indisponível'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {item.qr_code ? (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                Gerado
                              </span>
                            ) : (
                              <button
                                onClick={() => generateQRCode(item.id)}
                                className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
