'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { MenuCategory } from '@/types';
import { saveCategoryAction } from '@/app/actions';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: MenuCategory | null;
}

export default function CategoryForm({ isOpen, onClose, category }: CategoryFormProps) {
  const [formData, setFormData] = useState<MenuCategory>(
    category || {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      icon: '',
      sortOrder: 0,
      isActive: true,
      isAvailableOnDigitalMenu: true,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- CLIQUE DETETADO FORM ---', formData);
    
    setIsSubmitting(true);
    try {
      const result = await saveCategoryAction(formData);
      
      if (result.success) {
        console.log('✅ SUCESSO FORM: Categoria salva');
        onClose();
      } else {
        console.error('❌ ERRO FORM:', result.error);
      }
    } catch (error) {
      console.error('❌ ERRO CATCH FORM:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof MenuCategory, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ex: Bebidas, Pratos, Sobremesas"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Descrição opcional da categoria"
              disabled={isSubmitting}
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ícone
            </label>
            <input
              type="text"
              value={formData.icon || ''}
              onChange={(e) => handleChange('icon', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ex: 🍕, 🍔, 🥤"
              disabled={isSubmitting}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ordem de Exibição
            </label>
            <input
              type="number"
              value={formData.sortOrder || 0}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0"
              disabled={isSubmitting}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-800 border-white/10 rounded focus:ring-emerald-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="text-sm text-white">Categoria Ativa</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailableOnDigitalMenu ?? true}
                onChange={(e) => handleChange('isAvailableOnDigitalMenu', e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-800 border-white/10 rounded focus:ring-emerald-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="text-sm text-white">Disponível no Menu Digital</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              disabled={isSubmitting || !formData.name.trim()}
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
