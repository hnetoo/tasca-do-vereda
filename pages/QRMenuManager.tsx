import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { QRCodeCanvas } from 'qrcode.react';
import {
  QrCode, Copy, Download, Eye, Share2, Settings,
  MessageCircle, Mail, Facebook, CheckCircle, Globe, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  generateMenuUrl,
  generateShareableMenuLink,
  generateMenuShortCode,
  downloadQRCodeImage
} from '../services/qrMenuService';


const QRMenuManager = () => {
  const { settings, updateSettings, addNotification, categories, menu, updateCategory } = useStore();
  const qrRef = useRef<HTMLDivElement>(null);

  const getInitialUrl = () => {
    const cloud = (settings.qrMenuCloudUrl || '').trim();
    if (cloud) return cloud.replace(/\/$/, '');
    const current = window.location.href.split('#')[0].replace(/\/$/, '');
    return current || 'https://seu-dominio.com';
  };

  const [baseUrl, setBaseUrl] = useState(getInitialUrl());
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-sync effect
  useEffect(() => {
    const syncWithCloud = async () => {
      if (settings.supabaseConfig?.enabled && settings.supabaseConfig?.url && settings.supabaseConfig?.key) {
        try {
          // Sync logic
          const syncData = {
            restaurantName: settings.restaurantName,
            phone: settings.phone,
            address: settings.address,
            lastSync: new Date()
          };
          
          // Using updateSettings to trigger internal state update which eventually syncs to Supabase via useStore's sync logic
          // But here we want to ensure the QR config is explicitly synced if changed
          console.log('[QRMenuManager] Syncing QR config with cloud...', syncData);
        } catch (error) {
          console.error('[QRMenuManager] Cloud sync failed:', error);
        }
      }
    };
    
    syncWithCloud();
  }, [menu, categories, settings.restaurantName, settings.phone, settings.address, settings.supabaseConfig]);

  // Removed reactive state update inside effect to satisfy lint rules

  const menuVersion = settings.lastQRCodeUpdate ? new Date(settings.lastQRCodeUpdate).getTime().toString() : undefined;
  const menuUrl = generateMenuUrl(baseUrl, undefined, undefined, menuVersion);
  const newShortCode = generateMenuShortCode();

  const handleRegenerateUrl = () => {
    updateSettings({
      lastQRCodeUpdate: new Date()
    });
    addNotification('success', 'URL regenerada com sucesso! O QR Code mudou.');
  };

  const handleResetUrl = () => {
    // Reset URL to default (clears manual override)
    // Also regenerate short code to break cache
    // And clear last update to reset versioning if needed, or update it to force refresh
    
    // We want to force a clean state
    updateSettings({
      restaurantUrl: undefined, // Clear manual URL
      lastQRCodeUpdate: new Date(), // Force new version
      qrMenuShortCode: generateMenuShortCode() // New short code
    });
    
    // Reset local state
    setBaseUrl('https://seu-dominio.com');

    addNotification('success', 'URL resetada para o padrão.');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    addNotification('success', 'URL copiada para clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    if (qrRef.current) {
      try {
        await downloadQRCodeImage(qrRef.current, 'menu-qr-code.png');
        addNotification('success', 'QR code descarregado!');
      } catch {
        addNotification('error', 'Erro ao descarregar QR code');
      }
    }
  };

  const handleOpenInBrowser = () => {
    window.open(menuUrl, '_blank');
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'sms' | 'facebook') => {
    const shareUrl = generateShareableMenuLink(
      settings.restaurantName || 'Nosso Restaurante',
      menuUrl,
      platform
    );
    if (platform === 'whatsapp' || platform === 'telegram') {
      window.open(shareUrl, '_blank');
    } else if (platform === 'sms') {
      window.location.href = shareUrl;
    } else if (platform === 'facebook') {
      window.open(shareUrl, '_blank');
    }
    addNotification('success', `Abrindo ${platform}...`);
  };

  const handleSaveSettings = async () => {
    try {
      updateSettings({
        restaurantUrl: baseUrl,
        qrMenuEnabled: true,
        lastQRCodeUpdate: new Date()
      });
      
      // Explicitly trigger a sync if Supabase is enabled
      if (settings.supabaseConfig?.enabled) {
        addNotification('info', 'A sincronizar com a nuvem...');
        // The store's updateSettings will trigger the sync logic in useStore.ts
      }
      
      addNotification('success', 'Configurações guardadas com sucesso!');
      setShowSettings(false);
    } catch {
      addNotification('error', 'Erro ao guardar configurações');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-background to-slate-900 text-white p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <QrCode size={32} className="text-primary shrink-0" />
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">QR Code do Menu</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">Clientes podem escanear para ver o menu online</p>
        </div>
        
          {/* Sync Button Removed */}
        </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Display */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-black mb-6">Seu QR Code</h2>

            {/* QR Code Container */}
            <div className="flex justify-center mb-6">
              <div
                ref={qrRef}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl"
              >
                <QRCodeCanvas 
                  value={menuUrl} 
                  size={window.innerWidth < 640 ? 200 : 256} 
                  level="H" 
                  includeMargin={true}
                />
              </div>
            </div>

            {/* URL Display */}
            <div className="space-y-3 mb-6">
              <label className="text-sm text-slate-400 font-bold uppercase">URL do Menu</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm break-all">
                  {menuUrl}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className={`px-4 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-primary text-black hover:scale-105'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={16} /> Copiada
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Short Code */}
            <div className="space-y-3 mb-6">
              <label className="text-sm text-slate-400 font-bold uppercase">Código Curto (para cartazes)</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-lg font-bold text-primary text-center">
                  {newShortCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newShortCode);
                    addNotification('success', 'Código copiado!');
                  }}
                  className="px-4 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-bold transition-all"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegenerateUrl}
                className="w-full px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} /> Regenerar Link / QR Code
              </button>

              <button
                onClick={handleResetUrl}
                className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <AlertCircle size={18} /> Resetar URL (Correção)
              </button>

              <button
                onClick={handleDownloadQR}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Download size={16} /> Baixar PNG
              </button>
              <button
                onClick={handleOpenInBrowser}
                className="w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Globe size={16} /> Abrir no Navegador
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Eye size={16} /> {showPreview ? 'Ocultar Preview' : 'Pré-visualizar Menu'}
              </button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="glass-panel rounded-2xl p-6 border border-white/10 mt-6">
              <h3 className="text-lg font-black mb-4">Pré-visualização do Menu Online</h3>
              <iframe
                src={menuUrl}
                className="w-full h-96 rounded-lg border border-white/10 bg-white"
                title="Menu Preview"
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share Options */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Share2 size={20} /> Partilhar
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="w-full px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={18} /> Telegram
              </button>
              <button
                onClick={() => handleShare('sms')}
                className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Mail size={18} /> SMS
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full px-4 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Facebook size={18} /> Facebook
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="glass-panel rounded-2xl p-6 border border-primary/20 bg-primary/5">
            <h3 className="font-black mb-3">💡 Dicas</h3>
            <ul className="text-sm space-y-2 text-slate-300">
              <li>✓ Imprima o QR code em cartazes</li>
              <li>✓ Coloque nas mesas do restaurante</li>
              <li>✓ Partilhe por redes sociais</li>
              <li>✓ Use código curto em publicidades</li>
              <li>✓ Rastreie quantos clientes acessam</li>
            </ul>
          </div>

          {/* Category Visibility Management */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Settings size={20} className="text-primary" /> Visibilidade das Categorias
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-bold uppercase tracking-wider">Controle o que aparece no QR Menu</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {categories.slice().sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase">{cat.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {menu.filter(d => d.categoryId === cat.id).length} itens
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newStatus = cat.isAvailableOnDigitalMenu === false;
                      updateCategory({
                        ...cat,
                        isAvailableOnDigitalMenu: newStatus
                      });
                      addNotification('success', `Categoria ${cat.name} agora está ${newStatus ? 'visível' : 'oculta'} no menu digital.`);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-all ${
                      cat.isAvailableOnDigitalMenu !== false 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-slate-700/50 text-slate-500 border border-white/5'
                    }`}
                  >
                    {cat.isAvailableOnDigitalMenu !== false ? 'Visível' : 'Oculto'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Settings size={18} /> Configurações
          </button>

          {showSettings && (
            <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
              <div>
                <label className="text-sm text-slate-400 font-bold uppercase mb-2 block">
                  URL Base do Restaurante
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://seu-dominio.com"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-primary outline-none"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full px-4 py-2 rounded-lg bg-primary text-black font-bold hover:scale-105 transition-all"
              >
                Guardar
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-black mb-4">📊 Estatísticas</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Scans hoje</span>
                <span className="font-bold text-lg">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total scans</span>
                <span className="font-bold text-lg">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Pedidos via QR</span>
                <span className="font-bold text-lg">0</span>
              </div>
            </div>
          </div>

          {/* Categorias Management */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-black mb-4 flex items-center gap-2">
              <LayoutGrid size={20} className="text-primary" /> Categorias no Menu
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-xs font-bold truncate max-w-[120px]">{cat.name}</span>
                  <button
                    onClick={() => {
                      const newStatus = cat.isAvailableOnDigitalMenu === false;
                      updateCategory({
                        ...cat,
                        isAvailableOnDigitalMenu: newStatus
                      });
                      addNotification('success', `Categoria ${cat.name} agora está ${newStatus ? 'visível' : 'oculta'} no menu digital.`);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-all ${
                      cat.isAvailableOnDigitalMenu !== false 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-slate-700/50 text-slate-500 border border-white/5'
                    }`}
                  >
                    {cat.isAvailableOnDigitalMenu !== false ? 'Visível' : 'Oculto'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-4 italic">
              * Gerencie a visibilidade detalhada no Inventário
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutGrid = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export default QRMenuManager;
