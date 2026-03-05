'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, TrendingUp, DollarSign } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ExternalFinanceRecord {
  id: string;
  type: 'previous_sales' | 'accumulated_profits' | 'other';
  amount: number;
  description?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: any;
}

const ExternalFinanceHistory = () => {
  const router = useRouter();
  const supabase = createClient();
  
  const [records, setRecords] = useState<ExternalFinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'previous_sales' as 'previous_sales' | 'accumulated_profits' | 'other',
    amount: 0,
    description: '',
    period_start: '',
    period_end: ''
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      console.log('🔄 [EXTERNAL FINANCE] Buscando registros...');
      const { data, error } = await supabase
        .from('external_finance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [EXTERNAL FINANCE] Erro ao buscar registros:', error);
        
        // Verificar se é erro de tabela não existente
        if (error.code === 'PGRST116' || error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.error('❌ [EXTERNAL FINANCE] Tabela external_finance não existe!');
          alert('❌ ERRO CRÍTICO: A tabela "external_finance" não existe no Supabase!\n\nExecute o SQL do arquivo "create_external_finance_table.sql" no painel do Supabase para criar a tabela.');
          return;
        }
        
        setRecords([]);
      } else {
        console.log('✅ [EXTERNAL FINANCE] Registros buscados com sucesso:', data?.length || 0);
        setRecords(data || []);
      }
    } catch (err) {
      console.error('❌ [EXTERNAL FINANCE] Erro inesperado:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      alert('Por favor, insira um valor válido maior que 0.');
      return;
    }

    setSaving(true);
    
    try {
      console.log('🔄 [EXTERNAL FINANCE] Salvando registro:', formData);
      
      const { error } = await supabase
        .from('external_finance')
        .insert({
          type: formData.type,
          amount: formData.amount,
          description: formData.description || null,
          period_start: formData.period_start || null,
          period_end: formData.period_end || null,
          metadata: { source: 'manual_import' }
        });

      if (error) {
        console.error('❌ [EXTERNAL FINANCE] Erro ao salvar registro:', error);
        
        // Verificar se é erro de tabela não existente
        if (error.code === 'PGRST116' || error.message?.includes('relation') && error.message?.includes('does not exist')) {
          alert('❌ ERRO CRÍTICO: A tabela "external_finance" não existe no Supabase!\n\nExecute o SQL do arquivo "create_external_finance_table.sql" no painel do Supabase para criar a tabela.');
          return;
        }
        
        // Verificar se é erro de coluna
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          alert(`❌ ERRO DE COLUNA: ${error.message}\n\nVerifique se todas as colunas existem na tabela external_finance.`);
          return;
        }
        
        alert(`Erro ao salvar registro: ${error.message}`);
        return;
      }

      console.log('✅ [EXTERNAL FINANCE] Registro salvo com sucesso');
      
      // Limpar formulário
      setFormData({
        type: 'previous_sales',
        amount: 0,
        description: '',
        period_start: '',
        period_end: ''
      });
      setShowForm(false);
      
      // Recarregar registros
      fetchRecords();
      
    } catch (error: any) {
      console.error('❌ [EXTERNAL FINANCE] Exceção ao salvar:', error);
      alert(`Erro inesperado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este registro?')) return;

    try {
      const { error } = await supabase
        .from('external_finance')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [EXTERNAL FINANCE] Erro ao deletar:', error);
        alert(`Erro ao remover registro: ${error.message}`);
        return;
      }

      console.log('✅ [EXTERNAL FINANCE] Registro removido com sucesso');
      fetchRecords();
      
    } catch (error: any) {
      console.error('❌ [EXTERNAL FINANCE] Exceção ao deletar:', error);
      alert(`Erro inesperado: ${error.message}`);
    }
  };

  const getTotalByType = (type: string) => {
    return records
      .filter(r => r.type === type)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'previous_sales': return 'Vendas Anteriores';
      case 'accumulated_profits': return 'Lucros Acumulados';
      case 'other': return 'Outros';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'previous_sales': return <TrendingUp className="w-4 h-4" />;
      case 'accumulated_profits': return <DollarSign className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando histórico financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Histórico Externo</h1>
            <p className="text-gray-400">Importe dados financeiros de sistemas anteriores</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Registro
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-200 text-sm font-medium">Vendas Anteriores</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(getTotalByType('previous_sales'))}</div>
          <div className="text-green-200 text-sm mt-1">
            {records.filter(r => r.type === 'previous_sales').length} registros
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-200 text-sm font-medium">Lucros Acumulados</span>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(getTotalByType('accumulated_profits'))}</div>
          <div className="text-blue-200 text-sm mt-1">
            {records.filter(r => r.type === 'accumulated_profits').length} registros
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-200 text-sm font-medium">Total Importado</span>
            <Plus className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(
              getTotalByType('previous_sales') + 
              getTotalByType('accumulated_profits') + 
              getTotalByType('other')
            )}
          </div>
          <div className="text-purple-200 text-sm mt-1">
            {records.length} registros totais
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10 mb-8">
          <h2 className="text-xl font-bold mb-4">Adicionar Registro Financeiro</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Registro</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full p-3 bg-gray-800 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="previous_sales">Vendas Anteriores</option>
                  <option value="accumulated_profits">Lucros Acumulados</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor (AOA)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 bg-gray-800 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 bg-gray-800 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                placeholder="Ex: Vendas acumuladas 2024"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Início do Período (opcional)</label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fim do Período (opcional)</label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Registro'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Registros */}
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold mb-4">Registros Importados</h2>
        
        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum registro encontrado.</p>
            <p className="text-gray-500 text-sm mt-2">Adicione registros para importar seu histórico financeiro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-gray-800/50 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      {getTypeIcon(record.type)}
                    </div>
                    <div>
                      <div className="font-medium">{getTypeLabel(record.type)}</div>
                      <div className="text-sm text-gray-400">
                        {record.description || 'Sem descrição'}
                      </div>
                      {record.period_start && record.period_end && (
                        <div className="text-xs text-gray-500">
                          Período: {new Date(record.period_start).toLocaleDateString('pt-AO')} - {new Date(record.period_end).toLocaleDateString('pt-AO')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(record.amount)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleDateString('pt-AO')}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalFinanceHistory;
