'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ShieldCheck, Rocket } from 'lucide-react';

export default function SettingsFiscalPage() {
  const { settings, updateSettings, addNotification } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(localSettings);
    addNotification('success', 'Configurações fiscais salvas com sucesso!');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Definições Fiscais</h1>
        <p className="text-slate-400">Configurações fiscais e tributárias</p>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Fiscalidade Angola</h3>
          </div>
          
          <p className="text-sm text-slate-400 mb-8 font-medium">
            Os dados abaixo são integrados nos ficheiros SAF-T (AO) para submissão à AGT.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">NIF do Contribuinte</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" 
                  value={localSettings.nif || ''} 
                  onChange={e => setLocalSettings({...localSettings, nif: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Certificado AGT Nº</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" 
                  value={localSettings.agtCertificate || ''} 
                  onChange={e => setLocalSettings({...localSettings, agtCertificate: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Taxa de Imposto (%)</label>
                <input 
                  type="number" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" 
                  value={localSettings.taxRate || 0} 
                  onChange={e => setLocalSettings({...localSettings, taxRate: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Retenção na Fonte (%)</label>
                <input 
                  type="number" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" 
                  value={localSettings.retencaoFonte || 0} 
                  onChange={e => setLocalSettings({...localSettings, retencaoFonte: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime IVA</label>
                <select 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold appearance-none" 
                  value={localSettings.regimeIVA || 'Regime Geral'} 
                  onChange={e => setLocalSettings({...localSettings, regimeIVA: e.target.value})}
                >
                  <option value="Regime Geral" className="bg-slate-900">Regime Geral</option>
                  <option value="Regime Simplificado" className="bg-slate-900">Regime Simplificado</option>
                  <option value="Regime de Exclusão" className="bg-slate-900">Regime de Exclusão</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo Isenção (Se aplicável)</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-bold" 
                  value={localSettings.motivoIsencao || ''} 
                  onChange={e => setLocalSettings({...localSettings, motivoIsencao: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Código Abertura Gaveta (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: <27>p0 (Deixe em branco se não souber)" 
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-primary outline-none font-mono font-bold" 
                  value={localSettings.openDrawerCode || ''} 
                  onChange={e => setLocalSettings({...localSettings, openDrawerCode: e.target.value})} 
                />
                <p className="text-[10px] text-slate-500 mt-2">Código ASCII/HEX enviado para a impressora para acionar a gaveta.</p>
              </div>
            </div>

            <button type="submit" className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase tracking-[0.2em] shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-3">
              <Rocket size={22}/> Salvar Mudanças
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
