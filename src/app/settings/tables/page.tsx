'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Table, 
  Users, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import FormMesa from '@/components/forms/FormMesa';
import { getTablesByAmbiente } from '@/app/actions/tableLayout';
import { ensureTables } from '@/app/actions/ensureTables';

interface TableData {
  id: string;
  name: string;
  number: number;
  seats: number;
  shape: string;
  ambiente: 'INTERIOR' | 'EXTERIOR' | 'BALCAO';
  posicao_x: number;
  posicao_y: number;
  color: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsTablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | undefined>();
  const [selectedAmbiente, setSelectedAmbiente] = useState<'ALL' | 'INTERIOR' | 'EXTERIOR' | 'BALCAO'>('ALL');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const loadTables = async () => {
    setLoading(true);
    try {
      // Primeiro garantir que as tabelas existam
      await ensureTables();
      
      const result = await getTablesByAmbiente(selectedAmbiente);
      if (result.success) {
        setTables(result.data || []);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, [selectedAmbiente]);

  const handleCreateTable = () => {
    setEditingTable(undefined);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditTable = (table: TableData) => {
    setEditingTable(table);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadTables();
  };

  const getTablesByAmbienteFiltered = () => {
    if (selectedAmbiente === 'ALL') return tables;
    return tables.filter(table => table.ambiente === selectedAmbiente);
  };

  const getAmbienteStats = () => {
    const stats = {
      INTERIOR: tables.filter(t => t.ambiente === 'INTERIOR').length,
      EXTERIOR: tables.filter(t => t.ambiente === 'EXTERIOR').length,
      BALCAO: tables.filter(t => t.ambiente === 'BALCAO').length,
      total: tables.length
    };
    return stats;
  };

  const stats = getAmbienteStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="flex items-center gap-3">
                <Table className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gestão de Mesas</h1>
                  <p className="text-sm text-gray-500">Configurações do Restaurante</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateTable}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Mesa
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Mesas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Table className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interior</p>
                <p className="text-2xl font-bold text-gray-900">{stats.INTERIOR}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exterior</p>
                <p className="text-2xl font-bold text-gray-900">{stats.EXTERIOR}</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Balcão</p>
                <p className="text-2xl font-bold text-gray-900">{stats.BALCAO}</p>
              </div>
              <MapPin className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['ALL', 'INTERIOR', 'EXTERIOR', 'BALCAO'] as const).map((ambiente) => (
                <button
                  key={ambiente}
                  onClick={() => setSelectedAmbiente(ambiente)}
                  className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                    selectedAmbiente === ambiente
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {ambiente === 'ALL' ? 'Todas' : 
                   ambiente === 'INTERIOR' ? 'Interior' :
                   ambiente === 'EXTERIOR' ? 'Exterior' : 'Balcão'}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {ambiente === 'ALL' ? stats.total :
                     ambiente === 'INTERIOR' ? stats.INTERIOR :
                     ambiente === 'EXTERIOR' ? stats.EXTERIOR : stats.BALCAO}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tables List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedAmbiente === 'ALL' ? 'Todas as Mesas' : `Mesas - ${
                  selectedAmbiente === 'INTERIOR' ? 'Interior' :
                  selectedAmbiente === 'EXTERIOR' ? 'Exterior' : 'Balcão'
                }`}
              </h3>
              <button
                onClick={loadTables}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando mesas...</p>
              </div>
            ) : getTablesByAmbienteFiltered().length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma mesa encontrada</p>
                <button
                  onClick={handleCreateTable}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Criar primeira mesa
                </button>
              </div>
            ) : (
              getTablesByAmbienteFiltered().map((table) => (
                <div key={table.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: table.color }}
                      ></div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{table.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">#{table.number}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {table.seats} lugares
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {table.ambiente === 'INTERIOR' ? 'Interior' :
                             table.ambiente === 'EXTERIOR' ? 'Exterior' : 'Balcão'}
                          </span>
                          <span className="flex items-center gap-1">
                            Forma: {table.shape === 'RECTANGLE' ? 'Retangular' :
                                   table.shape === 'SQUARE' ? 'Quadrada' : 'Circular'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        table.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                        table.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {table.status === 'AVAILABLE' ? 'Disponível' :
                         table.status === 'OCCUPIED' ? 'Ocupada' :
                         table.status === 'RESERVED' ? 'Reservada' : 'Limpeza'}
                      </span>
                      
                      <button
                        onClick={() => handleEditTable(table)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Editar mesa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Excluir mesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <FormMesa
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        tableData={editingTable}
        mode={formMode}
      />
    </div>
  );
}
