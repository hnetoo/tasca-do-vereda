import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  ShieldCheck, Upload, Download, FileText, CheckCircle, 
  AlertTriangle, RefreshCw, Calendar 
} from 'lucide-react';

export const AgtManager = () => {
  const { addNotification } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [certStatus, setCertStatus] = useState<'valid' | 'expired' | 'missing'>('missing');
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload/validation
      setTimeout(() => {
        setCertStatus('valid');
        addNotification('success', 'Certificado AGT carregado e validado com sucesso.');
      }, 1500);
    }
  };

  const handleSaftExport = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setLastExport(new Date().toISOString());
      addNotification('success', 'Ficheiro SAF-T (AO) gerado com sucesso.');
      
      // Trigger fake download
      const element = document.createElement("a");
      const file = new Blob(["<SAF-T>...Content...</SAF-T>"], {type: 'text/xml'});
      element.href = URL.createObjectURL(file);
      element.download = `SAFT_AO_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(element);
      element.click();
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
            <ShieldCheck size={48} className="text-primary" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Conformidade AGT</h3>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-lg mb-8">
            Gestão de Certificados Digitais e Comunicação de Ficheiros SAF-T (AO)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Certificate Status */}
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Certificado Digital</h4>
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all
                    ${certStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}
                `}>
                    {certStatus === 'valid' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                </div>
                <p className={`text-sm font-bold mb-4 ${certStatus === 'valid' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {certStatus === 'valid' ? 'Certificado Válido' : 'Certificado em Falta / Expirado'}
                </p>
                
                <label className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-2">
                    <input type="file" accept=".p12,.pfx" className="hidden" onChange={handleCertUpload} />
                    <Upload size={14} /> Carregar Certificado (.pfx)
                </label>
            </div>

            {/* SAF-T Export */}
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Exportação SAF-T</h4>
                <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                    <FileText size={32} />
                </div>
                <div className="text-center mb-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Última Exportação</p>
                    <p className="text-xs text-white font-mono">
                        {lastExport ? new Date(lastExport).toLocaleString() : 'Nunca'}
                    </p>
                </div>
                
                <button 
                    onClick={handleSaftExport}
                    disabled={isExporting}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    {isExporting ? 'Gerando XML...' : 'Gerar SAF-T Mensal'}
                </button>
            </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-slate-700/50 rounded-xl text-white"><Calendar size={22} /></div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Série de Faturação</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ano Fiscal</label>
                <input type="number" value={new Date().getFullYear()} disabled className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-mono font-bold opacity-50 cursor-not-allowed" />
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Série Ativa</label>
                <input type="text" value="A" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-mono font-bold focus:border-primary outline-none" />
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Próximo Nº</label>
                <input type="number" value="1045" readOnly className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-mono font-bold opacity-50" />
            </div>
         </div>
      </div>
    </div>
  );
};
