
import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { QRScanResult, QRScanData } from '../types';

const QRScanner = () => {
  const navigate = useNavigate();
  const { addNotification } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (result: QRScanResult) => {
    if (!result) return;
    
    // Suporte para versão antiga e nova da biblioteca (result pode ser string ou array)
    const rawValue = Array.isArray(result) ? (result[0] as QRScanData)?.rawValue : (result as QRScanData)?.rawValue || result;
    
    if (typeof rawValue !== 'string') return;

    setIsScanning(false);
    
    try {
      if (rawValue.includes('/#/menu/')) {
        const path = rawValue.split('/#/')[1];
        navigate(`/${path}`);
        addNotification('success', 'Menu encontrado!');
      } else if (rawValue.includes('/#/customer-display/')) {
        const path = rawValue.split('/#/')[1];
        navigate(`/${path}`);
      } else if (rawValue.includes('/menu/')) {
        const url = new URL(rawValue);
        navigate(url.pathname + url.search);
        addNotification('success', 'Menu encontrado!');
      } else if (rawValue.includes('/customer-display/')) {
        const url = new URL(rawValue);
        navigate(url.pathname + url.search);
      } else {
        // Se for texto simples ou outro código
        addNotification('info', `Código lido: ${rawValue}`);
        // Aqui poderia integrar com busca de pedidos, etc.
        setTimeout(() => setIsScanning(true), 2000);
      }
    } catch (e: unknown) {
      setError(`Formato inválido: ${e instanceof Error ? e.message : String(e)}`);
      setIsScanning(true);
    }
  };

  const handleError = (error: unknown) => {
    console.error(error);
    setError(`Erro ao acessar a câmera. Verifique as permissões: ${error instanceof Error ? error.message : String(error)}`);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col">
      <header className="p-6 flex items-center gap-4 bg-slate-900/50 border-b border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Leitor QR Code</h1>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-8">
        <div className="w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden border-2 border-primary/20 relative shadow-2xl">
          {isScanning ? (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              components={{
                finder: true
              }}
              styles={{
                container: { width: '100%', height: '100%' }
              }}
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white animate-pulse">
                Processando...
             </div>
          )}
          
          {/* Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 max-w-md w-full">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Aponte a câmera para um código QR
          </p>
          <p className="text-slate-600 text-xs">
            Mesas, Menus ou Pedidos
          </p>
        </div>

        {!isScanning && (
          <button 
            onClick={() => setIsScanning(true)}
            className="px-8 py-4 bg-primary text-black rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} /> Ler Novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
