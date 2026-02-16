import { StateCreator } from 'zustand';
import { SystemSettings, Notification, StoreState } from '../../types';
import { databaseOperations } from '../../services/database/operations';
import { logger } from '../../services/logger';

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
  },
  notifications: [],
  isSidebarCollapsed: false,
  
  addNotification: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => get().removeNotification(id), 3000);
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      databaseOperations.saveSettings(updated).catch(e => logger.error('Failed to save settings', { error: (e as Error).message }, 'DATABASE'));
      return { settings: updated };
    });
  },
  
  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed 
  })),

  triggerSync: async () => {
    const { categories, menu, settings, addOfflineAction } = get();
    if (settings.supabaseConfig?.enabled && settings.supabaseConfig?.url && settings.supabaseConfig?.key) {
      logger.info('Sincronização manual acionada...', null, 'CLOUD');
      try {
        await supabaseService.syncMenu(categories, menu, settings);
        logger.info('Sincronização manual concluída com sucesso.', null, 'CLOUD');
      } catch (e: unknown) {
        logger.error('Falha na sincronização manual com Supabase, adicionando à fila offline.', { error: (e as Error).message }, 'CLOUD');
        addOfflineAction({ id: crypto.randomUUID(), type: 'SYNC_MENU', payload: { categories, menu, settings }, timestamp: Date.now() });
      }
    } else {
      logger.warn('Sincronização manual ignorada: Supabase não configurado ou desativado.', null, 'CLOUD');
    }
  }
});
