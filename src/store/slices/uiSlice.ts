import { StateCreator } from 'zustand';
import { SystemSettings, Notification, StoreState } from '../../types';
import { saveSettingsAction } from '@/app/actions';
import { logger } from '../../services/logger';
import { supabaseService } from '../../services/supabaseService';

export interface UISlice {
  settings: SystemSettings;
  notifications: Notification[];
  isSidebarCollapsed: boolean;
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  toggleSidebar: () => void;
  triggerSync: () => Promise<void>;
}

export const createUISlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  UISlice
> = (set, get) => ({
  settings: {
    id: "default-settings",
    restaurantName: "Tasca Do VEREDA",
    appLogoUrl: "", 
    currency: "Kz",
    taxRate: 14,
    phone: "+244 900 000 000",
    address: "Luanda, Angola",
    nif: "5000000000",
    commercialReg: "Conservatória de Luanda",
    agtCertificate: "000/AGT/2025",
    invoiceSeries: "2025",
    retencaoFonte: 6.5,
    regimeIVA: "Regime Geral",
    motivoIsencao: "",
    openDrawerCode: "",
    kdsEnabled: true,
    isSidebarCollapsed: false,
    apiToken: "TASCA-SECURE-API-9922-KEY",
    webhookEnabled: true,
    qrMenuUrl: "",
    qrMenuCloudUrl: "",
    qrMenuShortCode: "",
    qrMenuTitle: "",
    qrMenuLogo: "",
    email: "info@tascadovereda.com",
    logo: null,
    taxPercentage: 14,
    timezone: "Africa/Luanda",
    language: "pt-AO",
  },
  notifications: [],
  isSidebarCollapsed: false,
  
  addNotification: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state: StoreState) => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 3000);
  },
  
  removeNotification: (id) => set((state: StoreState) => ({
    notifications: state.notifications.filter((n: Notification) => n.id !== id)
  })),
  
  updateSettings: (newSettings) => {
    set((state: StoreState) => {
      const updated = { ...state.settings, ...newSettings };
      saveSettingsAction(updated).then(res => {
        if (!res.success) logger.error('Failed to save settings', { error: res.error }, 'DATABASE');
      }).catch(e => logger.error('Failed to save settings', { error: (e as Error).message }, 'DATABASE'));
      return { settings: updated };
    });
  },
  
  toggleSidebar: () => set((state: StoreState) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed 
  })),

  triggerSync: async () => {
    const { syncMenuWithCloud, settings } = get();
    if (settings.supabaseConfig?.enabled) {
      logger.info('Sincronização manual acionada...', undefined, 'CLOUD');
      try {
        await syncMenuWithCloud();
        logger.info('Sincronização manual concluída com sucesso.', undefined, 'CLOUD');
      } catch (e: unknown) {
        logger.error('Falha na sincronização manual com Supabase.', { error: (e as Error).message }, 'CLOUD');
        // offline action queueing handled inside syncMenuWithCloud or ignored for manual trigger
      }
    } else {
      logger.warn('Sincronização manual ignorada: Supabase não configurado ou desativado.', undefined, 'CLOUD');
    }
  }
});
