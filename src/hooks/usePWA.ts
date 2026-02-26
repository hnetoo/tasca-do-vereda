'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPrompt {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: string;
  install: () => Promise<void>;
  dismiss: () => void;
}

export function usePWA(): PWAInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check for iOS standalone mode
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = (window as any).navigator.standalone === true || 
                         (window as any).matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && isStandalone) {
        setIsInstalled(true);
        setPlatform('ios');
        return;
      }

      // Check for Android standalone mode
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid && isStandalone) {
        setIsInstalled(true);
        setPlatform('android');
        return;
      }

      // Check for PWA display modes
      const displayMode = (window as any).matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                         (window as any).matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' :
                         (window as any).matchMedia('(display-mode: browser)').matches ? 'browser' : 'unknown';

      if (displayMode === 'standalone' || displayMode === 'minimal-ui') {
        setIsInstalled(true);
        setPlatform('pwa');
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      // Fallback for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // Show instructions for iOS
        alert('Para instalar este app:\n\n1. Toque no ícone de compartilhar \n2. Toque em "Adicionar à Tela de Início"');
        return;
      }

      // Fallback for Android
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid) {
        // Try to open the install prompt manually
        window.open('/manifest.json', '_blank');
        return;
      }

      throw new Error('Install prompt not available');
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during install:', error);
      throw error;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    platform,
    install,
    dismiss
  };
}

// Hook for PWA updates
export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!registration) return;

    try {
      setIsUpdating(true);
      
      // Tell the new service worker to skip waiting
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to apply the update
      window.location.reload();
    } catch (error) {
      console.error('Error applying update:', error);
      setIsUpdating(false);
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
    dismissUpdate
  };
}

// Hook for PWA capabilities
export function usePWACapabilities() {
  const [capabilities, setCapabilities] = useState({
    serviceWorker: false,
    pushNotifications: false,
    backgroundSync: false,
    storageQuota: 0,
    storageUsed: 0
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const caps = {
        serviceWorker: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorker.prototype,
        storageQuota: 0,
        storageUsed: 0
      };

      // Check storage quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          caps.storageQuota = estimate.quota || 0;
          caps.storageUsed = estimate.usage || 0;
        } catch (error) {
          console.warn('Could not get storage estimate:', error);
        }
      }

      setCapabilities(caps);
    };

    checkCapabilities();
  }, []);

  return capabilities;
}
