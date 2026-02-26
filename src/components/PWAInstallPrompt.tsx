'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, platform, install, dismiss } = usePWA();
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    try {
      await install();
    } catch (error) {
      console.error('Install failed:', error);
      // Show instructions for mobile devices
      if (platform === 'ios' || platform === 'android') {
        setShowInstructions(true);
      }
    }
  };

  const handleDismiss = () => {
    dismiss();
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const getInstructions = () => {
    if (platform === 'ios') {
      return {
        title: 'Instalar no iPhone/iPad',
        steps: [
          'Toque no ícone de compartilhar ',
          'Role para baixo e toque em "Adicionar à Tela de Início"',
          'Toque em "Adicionar" para confirmar'
        ]
      };
    }

    if (platform === 'android') {
      return {
        title: 'Instalar no Android',
        steps: [
          'Toque no ícone de menu (três pontos) ',
          'Toque em "Adicionar à Tela de Início" ou "Instalar app"',
          'Toque em "Adicionar" para confirmar'
        ]
      };
    }

    return {
      title: 'Instalar Aplicação',
      steps: ['Siga as instruções do seu navegador']
    };
  };

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className={`
        fixed bottom-4 left-4 right-4 z-50
        bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl
        transform transition-all duration-300 ease-out
        ${showInstructions ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        ${className}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Download size={20} className="text-black" />
            </div>
            <div>
              <p className="text-white font-medium">Instalar Tasca Do VEREDA</p>
              <p className="text-slate-400 text-sm">Acesso rápido e offline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-primary text-black font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {platform === 'ios' ? <Smartphone size={24} /> : <Monitor size={24} />}
                {getInstructions().title}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {getInstructions().steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-black font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                <strong>Dica:</strong> Uma vez instalado, você poderá acessar o aplicativo diretamente da sua tela inicial, mesmo offline!
              </p>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4 px-4 py-2 bg-primary text-black font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
