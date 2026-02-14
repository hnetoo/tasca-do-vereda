import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  QrCode, Copy, Download, Share2
} from 'lucide-react';
import { generateMenuUrl, generateMenuShortCode } from '../services/qrMenuService';

interface QRCodeDisplayProps {
  compact?: boolean;
  showStats?: boolean;
  onShare?: (platform: string) => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  compact = false,
  showStats = true
}) => {
  const { settings, qrCodeConfig, getMenuAccessStats, addNotification } = useStore();
  const [showFullUrl, setShowFullUrl] = useState(false);

  const baseUrl = (settings.qrMenuCloudUrl && settings.qrMenuCloudUrl.trim()) 
    ? settings.qrMenuCloudUrl.trim().replace(/\/$/, '') 
    : (qrCodeConfig?.baseUrl || settings.restaurantUrl || 'https://seu-dominio.com');
  const menuUrl = generateMenuUrl(baseUrl);
  const shortCode = generateMenuShortCode();
  const stats = getMenuAccessStats();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    addNotification('success', 'URL copiada!');
  };

  const handleCopyShortCode = () => {
    navigator.clipboard.writeText(shortCode);
    addNotification('success', 'Código copiado!');
  };

  if (compact) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            <span className="font-bold text-sm">Menu Online</span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary transition-all"
          >
            <Copy size={12} className="inline mr-1" /> Copiar
          </button>
        </div>
        <div className="text-xs font-mono text-slate-400 truncate">
          {menuUrl}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/20">
            <QrCode size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-black text-lg">QR Code do Menu</h3>
            <p className="text-xs text-slate-400">Partilhe seu menu online</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Preview */}
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl mb-4 shadow-lg">
            <div className="w-40 h-40 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50">
              <div className="text-center">
                <QrCode size={50} className="text-primary/50 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-bold">QR Code</p>
              </div>
            </div>
          </div>
          <button className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">
            <Download size={16} /> Descarregar
          </button>
        </div>

        {/* Info & Actions */}
        <div className="space-y-4">
          {/* URL Info */}
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase block mb-2">
              URL do Menu
            </label>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div
                  className="font-mono text-xs text-slate-300 cursor-pointer hover:text-white truncate flex-1"
                  onClick={() => setShowFullUrl(!showFullUrl)}
                >
                  {showFullUrl ? menuUrl : menuUrl.substring(0, 30) + '...'}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="ml-2 p-2 rounded hover:bg-white/5 transition-all"
                  title="Copiar URL"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Short Code */}
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase block mb-2">
              Código Curto
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-primary/20 border border-primary/50 font-mono font-bold text-primary text-center">
                {shortCode}
              </div>
              <button
                onClick={handleCopyShortCode}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title="Copiar código"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-bold border border-green-600/30 flex items-center justify-center gap-1 transition-all">
              <Share2 size={14} /> WhatsApp
            </button>
            <button className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-bold border border-blue-600/30 flex items-center justify-center gap-1 transition-all">
              <Share2 size={14} /> Telegram
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">{stats.total}</div>
              <div className="text-xs text-slate-400 mt-1">Total de Acessos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-blue-400">{stats.todayAccesses}</div>
              <div className="text-xs text-slate-400 mt-1">Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">{stats.tableMenus}</div>
              <div className="text-xs text-slate-400 mt-1">Por Tabela</div>
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex gap-2 text-sm text-slate-300">
          <span className="text-primary font-bold">💡</span>
          <div>
            <p className="font-bold mb-1">Como usar:</p>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>✓ Imprima o QR code e coloque nas mesas</li>
              <li>✓ Partilhe o código curto em publicidades</li>
              <li>✓ Use os botões para partilhar nas redes sociais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
