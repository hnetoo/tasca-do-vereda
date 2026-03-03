'use client';

import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { createTableWithAmbiente } from '@/app/actions/tableLayout';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    number: 1,
    seats: 4,
    shape: 'RECTANGLE',
    ambiente: 'INTERIOR' as 'INTERIOR' | 'EXTERIOR' | 'BALCAO',
    posicao_x: 0,
    posicao_y: 0,
    color: '#3B82F6'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await createTableWithAmbiente(formData);
      
      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: '',
          number: formData.number + 1,
          seats: 4,
          shape: 'RECTANGLE',
          ambiente: 'INTERIOR',
          posicao_x: 0,
          posicao_y: 0,
          color: '#3B82F6'
        });
      } else {
        setError(result.error || 'Erro ao criar mesa');
      }
    } catch (error) {
      setError('Erro inesperado ao criar mesa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Criar Nova Mesa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
            title="Fechar modal"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tableName" className="block text-sm font-medium text-gray-200 mb-1">
              Nome da Mesa
            </label>
            <input
              type="text"
              id="tableName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="Ex: Mesa 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-200 mb-1">
                Número
              </label>
              <input
                type="number"
                id="tableNumber"
                value={formData.number}
                onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="tableSeats" className="block text-sm font-medium text-gray-200 mb-1">
                Lugares
              </label>
              <input
                type="number"
                id="tableSeats"
                value={formData.seats}
                onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="ambiente" className="block text-sm font-medium text-gray-200 mb-1">
              Ambiente
            </label>
            <select
              id="ambiente"
              value={formData.ambiente}
              onChange={(e) => handleInputChange('ambiente', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            >
              <option value="INTERIOR">Interior</option>
              <option value="EXTERIOR">Exterior</option>
              <option value="BALCAO">Balcão</option>
            </select>
          </div>

          <div>
            <label htmlFor="tableShape" className="block text-sm font-medium text-gray-200 mb-1">
              Forma
            </label>
            <select
              id="tableShape"
              value={formData.shape}
              onChange={(e) => handleInputChange('shape', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="RECTANGLE">Retangular</option>
              <option value="SQUARE">Quadrada</option>
              <option value="CIRCLE">Circular</option>
            </select>
          </div>

          <div>
            <label htmlFor="tableColor" className="block text-sm font-medium text-gray-200 mb-1">
              Cor
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                id="tableColor"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-12 h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
              />
              <input
                type="text"
                id="tableColorText"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tablePosX" className="block text-sm font-medium text-gray-200 mb-1">
                Posição X
              </label>
              <input
                type="number"
                id="tablePosX"
                value={formData.posicao_x}
                onChange={(e) => handleInputChange('posicao_x', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                step="10"
              />
            </div>

            <div>
              <label htmlFor="tablePosY" className="block text-sm font-medium text-gray-200 mb-1">
                Posição Y
              </label>
              <input
                type="number"
                id="tablePosY"
                value={formData.posicao_y}
                onChange={(e) => handleInputChange('posicao_y', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                step="10"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Criar Mesa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTableModal;
