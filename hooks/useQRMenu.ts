import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  generateMenuUrl,
  generateQRCodeData,
  generateMenuSessionId,
  generateShareableMenuLink,
  generateMenuShortCode,
  downloadQRCodeImage,
  generateMenuAccessToken
} from '../services/qrMenuService';

export interface QRMenuState {
  baseUrl: string;
  menuUrl: string;
  sessionId: string;
  shortCode: string;
  accessToken: string;
  qrCodeData: string;
  isLoading: boolean;
  error: string | null;
}

export const useQRMenu = (initialBaseUrl: string = 'https://seu-dominio.com') => {
  const { settings } = useStore();
  const cloud = (settings.qrMenuCloudUrl || '').trim().replace(/\/$/, '');
  const effectiveBase = cloud || initialBaseUrl;
  const [state, setState] = useState<QRMenuState>({
    baseUrl: effectiveBase,
    menuUrl: generateMenuUrl(effectiveBase),
    sessionId: generateMenuSessionId(),
    shortCode: generateMenuShortCode(),
    accessToken: generateMenuAccessToken(),
    qrCodeData: '',
    isLoading: false,
    error: null
  });

  // Gerar QR code data
  useEffect(() => {
    const qrData = generateQRCodeData(state.menuUrl);
    setState(prev => ({ ...prev, qrCodeData: qrData }));
  }, [state.menuUrl]);

  // Atualizar URL base
  const setBaseUrl = useCallback((newBaseUrl: string) => {
    setState(prev => ({
      ...prev,
      baseUrl: newBaseUrl,
      menuUrl: generateMenuUrl(newBaseUrl),
      sessionId: generateMenuSessionId(),
      accessToken: generateMenuAccessToken()
    }));
  }, []);

  // Gerar novo código curto
  const generateNewShortCode = useCallback(() => {
    const newCode = generateMenuShortCode();
    setState(prev => ({ ...prev, shortCode: newCode }));
    return newCode;
  }, []);

  // Copiar URL para clipboard
  const copyUrlToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.menuUrl);
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao copiar URL' }));
      return false;
    }
  }, [state.menuUrl]);

  // Copiar código curto
  const copyShortCodeToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.shortCode);
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao copiar código' }));
      return false;
    }
  }, [state.shortCode]);

  // Gerar link compartilhável
  const getShareLink = useCallback((platform: 'whatsapp' | 'telegram' | 'sms' | 'facebook', restaurantName: string) => {
    return generateShareableMenuLink(restaurantName, state.menuUrl, platform);
  }, [state.menuUrl]);

  // Descarregar QR code
  const downloadQR = useCallback(async (element: HTMLDivElement) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await downloadQRCodeImage(element, 'menu-qr-code.png');
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao descarregar QR code' }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    setBaseUrl,
    generateNewShortCode,
    copyUrlToClipboard,
    copyShortCodeToClipboard,
    getShareLink,
    downloadQR,
    clearError
  };
};

// Hook para rastreamento de acessos ao menu
export const useMenuAccessTracking = () => {
  const [accessLogs, setAccessLogs] = useState<{
    type: 'PUBLIC_MENU' | 'TABLE_MENU';
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    tableId?: string;
  }[]>([]);

  const logAccess = useCallback((log: {
    type: 'PUBLIC_MENU' | 'TABLE_MENU';
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    tableId?: string;
  }) => {
    setAccessLogs(prev => [...prev, log]);
    // Aqui você pode enviar para o backend
  }, []);

  const getAccessStats = useCallback(() => {
    const total = accessLogs.length;
    const tableMenus = accessLogs.filter(log => log.type === 'TABLE_MENU').length;
    const publicMenus = accessLogs.filter(log => log.type === 'PUBLIC_MENU').length;

    return {
      total,
      tableMenus,
      publicMenus,
      tableAccessPercentage: total > 0 ? (tableMenus / total * 100).toFixed(1) : 0,
      publicAccessPercentage: total > 0 ? (publicMenus / total * 100).toFixed(1) : 0
    };
  }, [accessLogs]);

  const clearLogs = useCallback(() => {
    setAccessLogs([]);
  }, []);

  return {
    accessLogs,
    logAccess,
    getAccessStats,
    clearLogs
  };
};

// Hook para gerenciar múltiplas URLs de QR (para diferentes promoções)
export interface QRMenuVariant {
  id: string;
  name: string;
  baseUrl: string;
  shortCode: string;
  createdAt: Date;
  scans: number;
}

export const useQRMenuVariants = (initialVariants: QRMenuVariant[] = []) => {
  const [variants, setVariants] = useState<QRMenuVariant[]>(initialVariants);

  const addVariant = useCallback((name: string, baseUrl: string) => {
    const newVariant: QRMenuVariant = {
      id: `qr-${Date.now()}`,
      name,
      baseUrl,
      shortCode: generateMenuShortCode(),
      createdAt: new Date(),
      scans: 0
    };
    setVariants(prev => [...prev, newVariant]);
    return newVariant;
  }, []);

  const removeVariant = useCallback((id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  }, []);

  const updateVariant = useCallback((id: string, updates: Partial<QRMenuVariant>) => {
    setVariants(prev =>
      prev.map(v => v.id === id ? { ...v, ...updates } : v)
    );
  }, []);

  const incrementScans = useCallback((id: string) => {
    setVariants(prev =>
      prev.map(v => v.id === id ? { ...v, scans: v.scans + 1 } : v)
    );
  }, []);

  const getVariantStats = useCallback((id: string) => {
    const variant = variants.find(v => v.id === id);
    return variant ? {
      ...variant,
      scanPercentage: variants.length > 0 ? (variant.scans / variants.reduce((sum, v) => sum + v.scans, 0) * 100).toFixed(1) : 0
    } : null;
  }, [variants]);

  return {
    variants,
    addVariant,
    removeVariant,
    updateVariant,
    incrementScans,
    getVariantStats
  };
};
