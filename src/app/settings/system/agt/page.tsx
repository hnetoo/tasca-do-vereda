'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { FileText, Upload, Download, Shield, CheckCircle, AlertCircle, Calendar, Clock, Database, Key, FileCheck, Printer } from 'lucide-react';

export default function SettingsAGTPage() {
  const { addNotification } = useStore();
  const [agtConfig, setAgtConfig] = useState({
    nif: '123456789',
    agtCertificate: 'AGT-2024-001',
    taxRate: 14,
    retencaoFonte: 6.5,
    regimeIVA: 'Regime Geral',
    motivoIsencao: '',
    openDrawerCode: '<27>p0',
    safTEnabled: true,
    autoExport: true,
    lastExport: '2024-01-15T23:59:00'
  });

  const [exports, setExports] = useState([
    {
      id: '1',
      name: 'SAFT-PT-2024-01',
      date: '2024-01-31T23:59:00',
      type: 'saft',
      status: 'completed',
      size: 2.4,
      records: 1250
    },
    {
      id: '2',
      name: 'SAFT-PT-2023-12',
      date: '2023-12-31T23:59:00',
      type: 'saft',
      status: 'completed',
      size: 2.1,
      records: 1180
    }
  ]);

  const handleSaveConfig = () => {
    addNotification('success', 'Configurações AGT salvas com sucesso!');
  };

  const handleExportSAFT = (period: string) => {
    addNotification('info', `Gerando SAFT para ${period}...`);
    setTimeout(() => {
      const newExport = {
        id: Date.now().toString(),
        name: `SAFT-PT-${period}`,
        date: new Date().toISOString(),
        type: 'saft',
        status: 'completed',
        size: Math.random() * 2 + 1,
        records: Math.floor(Math.random() * 500 + 1000)
      };
      setExports(prev => [newExport, ...prev]);
      addNotification('success', 'SAFT gerado com sucesso!');
    }, 3000);
  };

  const handleDownloadExport = (exportId: string) => {
    const exportItem = exports.find(e => e.id === exportId);
    addNotification('info', `Baixando ${exportItem?.name}...`);
    setTimeout(() => {
      addNotification('success', 'Arquivo baixado com sucesso!');
    }, 2000);
  };

  const handleValidateCertificate = () => {
    addNotification('info', 'Validando certificado AGT...');
    setTimeout(() => {
      addNotification('success', 'Certificado válido e ativo!');
    }, 2000);
  };

  const handleTestPrinter = () => {
    addNotification('info', 'Testando impressora fiscal...');
    setTimeout(() => {
      addNotification('success', 'Impressora fiscal configurada com sucesso!');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'processing': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AGT - Autoridade Tributária</h1>
        <p className="text-slate-400">Configurações fiscais e geração de SAF-T</p>
      </div>

      <div className="space-y-6">
        {/* Company Info */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <Shield size={20} className="text-primary" />
            Informações da Empresa
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">NIF do Contribuinte</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white font-mono"
                value={agtConfig.nif}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, nif: e.target.value }))}
                placeholder="123456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Certificado AGT Nº</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white font-mono"
                value={agtConfig.agtCertificate}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, agtCertificate: e.target.value }))}
                placeholder="AGT-2024-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Taxa de Imposto (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white font-mono"
                value={agtConfig.taxRate}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Retenção na Fonte (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white font-mono"
                value={agtConfig.retencaoFonte}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, retencaoFonte: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Regime IVA</label>
              <select
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={agtConfig.regimeIVA}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, regimeIVA: e.target.value }))}
              >
                <option value="Regime Geral">Regime Geral</option>
                <option value="Regime Simplificado">Regime Simplificado</option>
                <option value="Regime de Exclusão">Regime de Exclusão</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Motivo Isenção (Se aplicável)</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white"
                value={agtConfig.motivoIsencao}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, motivoIsencao: e.target.value }))}
                placeholder="Motivo da isenção"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Código Abertura Gaveta</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-primary text-white font-mono"
                value={agtConfig.openDrawerCode}
                onChange={(e) => setAgtConfig(prev => ({ ...prev, openDrawerCode: e.target.value }))}
                placeholder="<27>p0 (Deixe em branco se não souber)"
              />
              <p className="text-xs text-slate-500 mt-2">Código ASCII/HEX enviado para a impressora para acionar a gaveta.</p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </div>

        {/* SAF-T Actions */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            SAF-T (Standard Audit File for Tax)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handleExportSAFT('Mensal')}
              className="p-4 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Calendar size={24} />
              <span className="text-sm font-medium">Exportar Mensal</span>
            </button>
            
            <button
              onClick={() => handleExportSAFT('Trimestral')}
              className="p-4 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Database size={24} />
              <span className="text-sm font-medium">Exportar Trimestral</span>
            </button>
            
            <button
              onClick={() => handleExportSAFT('Anual')}
              className="p-4 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <FileCheck size={24} />
              <span className="text-sm font-medium">Exportar Anual</span>
            </button>
            
            <button
              onClick={handleValidateCertificate}
              className="p-4 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors flex flex-col items-center gap-2"
            >
              <Key size={24} />
              <span className="text-sm font-medium">Validar Certificado</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">SAFT Automático</p>
                <p className="text-sm text-slate-400">Gerar SAF-T automaticamente</p>
              </div>
              <button
                onClick={() => setAgtConfig(prev => ({ ...prev, autoExport: !prev.autoExport }))}
                className={`w-14 h-8 rounded-full transition-colors ${
                  agtConfig.autoExport ? 'bg-primary' : 'bg-slate-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  agtConfig.autoExport ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-white">Última Exportação</p>
                <p className="text-sm text-slate-400">
                  {new Date(agtConfig.lastExport).toLocaleDateString()} às {new Date(agtConfig.lastExport).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleTestPrinter}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                Testar Impressora
              </button>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Database size={20} className="text-primary" />
              Histórico de Exportações
            </h3>
            <div className="text-sm text-slate-400">
              Total: {exports.length} exportações
            </div>
          </div>
          
          <div className="space-y-3">
            {exports.map((exportItem) => (
              <div key={exportItem.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="text-primary" size={20} />
                    <div>
                      <h4 className="font-medium text-white">{exportItem.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(exportItem.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(exportItem.date).toLocaleTimeString()}
                        </span>
                        <span>{exportItem.size} MB</span>
                        <span>{exportItem.records} registros</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(exportItem.status)}`}>
                      {exportItem.status === 'completed' ? 'Concluído' : 
                       exportItem.status === 'processing' ? 'Processando' : 'Falhou'}
                    </span>
                    <button
                      onClick={() => handleDownloadExport(exportItem.id)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Status */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            Status de Validação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-400" size={16} />
                <span className="font-medium text-white">Certificado AGT</span>
              </div>
              <p className="text-sm text-emerald-400">Válido e ativo</p>
              <p className="text-xs text-slate-400 mt-1">Expira: 31/12/2024</p>
            </div>
            
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-400" size={16} />
                <span className="font-medium text-white">Configuração Fiscal</span>
              </div>
              <p className="text-sm text-emerald-400">Conforme com normas AGT</p>
              <p className="text-xs text-slate-400 mt-1">Última verificação: 15/01/2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
