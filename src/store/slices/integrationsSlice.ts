import { StateCreator } from 'zustand';
import { StoreState, APIKey, WebhookConfig, BiometricDevice, IntegrationLog, MobileSession, BiometricClockEvent } from '@/types';
import { BiometricIntegrationService } from '@/services/biometricService';
import { logger } from '@/services/logger';

export interface IntegrationsSlice {
  // API Keys
  apiKeys: APIKey[];
  generateApiKey: (name: string, scopes: string[]) => APIKey;
  revokeApiKey: (keyId: string) => void;
  
  // Webhooks
  webhooks: WebhookConfig[];
  registerWebhook: (config: WebhookConfig) => void;
  updateWebhook: (config: WebhookConfig) => void;
  removeWebhook: (webhookId: string) => void;
  triggerWebhook: (event: string, data: unknown) => Promise<void>;
  testWebhook: (webhookId: string) => Promise<boolean>;
  
  // Biometric Devices
  biometricDevices: BiometricDevice[];
  registerBiometricDevice: (device: BiometricDevice) => void;
  removeBiometricDevice: (deviceId: string) => void;
  updateBiometricDevice: (device: BiometricDevice) => void;
  syncBiometricDevice: (deviceId: string) => Promise<void>;
  testBiometricConnection: (deviceId: string) => Promise<boolean>;
  
  // Integration Logs
  integrationLogs: IntegrationLog[]; 
  
  // Mobile Sessions
  mobileSessions: MobileSession[];
  createMobileSession: (userId: string, deviceInfo: { deviceId: string; deviceName: string; ipAddress: string }) => MobileSession;
  validateMobileSession: (token: string) => MobileSession | null;
  revokeMobileSession: (sessionId: string) => void;
  
  // Integration API
  processBiometricWebhook: (payload: {
    externalBioId: string;
    type: string;
    clockTime: string | Date;
    temperature?: number;
    deviceId?: string;
  }) => Promise<void>;
}

export const createIntegrationsSlice: StateCreator<
  StoreState,
  [],
  [],
  IntegrationsSlice
> = (set, get) => {
  // Initialize service
  const biometricService = BiometricIntegrationService.getInstance();

  return {
    apiKeys: [],
    webhooks: [],
    biometricDevices: [],
    mobileSessions: [],
    integrationLogs: [],
    
    generateApiKey: (name, scopes) => {
      const key = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const secret = `secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const apiKey: APIKey = {
        id: Math.random().toString(36).substring(7),
        name,
        key,
        secret,
        createdAt: new Date(),
        status: 'ACTIVE',
        scopes
      };
      
      set((state) => ({ apiKeys: [...state.apiKeys, apiKey] }));
      return apiKey;
    },

    revokeApiKey: (keyId) => {
      set((state) => ({
        apiKeys: state.apiKeys.map(k => k.id === keyId ? { ...k, status: 'REVOKED' } : k)
      }));
    },

    registerWebhook: (config) => {
      set((state) => ({ webhooks: [...state.webhooks, config] }));
    },

    updateWebhook: (config) => {
      set((state) => ({
        webhooks: state.webhooks.map(w => w.id === config.id ? config : w)
      }));
    },

    removeWebhook: (webhookId) => {
      set((state) => ({
        webhooks: state.webhooks.filter(w => w.id !== webhookId)
      }));
    },

    triggerWebhook: async (event, data) => {
      const state = get();
      const relevantWebhooks = state.webhooks.filter(
        w => w.status === 'ACTIVE' && w.events.includes(event)
      );

      for (const webhook of relevantWebhooks) {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...webhook.headers
            },
            body: JSON.stringify({
              event,
              timestamp: new Date().toISOString(),
              data
            })
          });

          // Update webhook stats
          const updatedWebhook = {
             ...webhook,
             lastTriggered: new Date(),
             failureCount: response.ok ? 0 : (webhook.failureCount || 0) + 1
          };
          state.updateWebhook(updatedWebhook);

          state.addIntegrationLog({
            type: event,
            message: `Webhook ${webhook.name} triggered`,
            details: { 
                webhookId: webhook.id,
                status: response.status,
                success: response.ok 
            }
          });
        } catch (error) {
          const updatedWebhook = {
             ...webhook,
             failureCount: (webhook.failureCount || 0) + 1
          };
          state.updateWebhook(updatedWebhook);

          state.addIntegrationLog({
            type: event,
            message: `Webhook ${webhook.name} failed`,
            details: { 
                webhookId: webhook.id,
                error: (error as Error).message
            }
          });
        }
      }
    },

    testWebhook: async (webhookId) => {
      const state = get();
      const webhook = state.webhooks.find(w => w.id === webhookId);
      if (!webhook) return false;

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers
          },
          body: JSON.stringify({
            event: 'test.event',
            timestamp: new Date().toISOString(),
            data: { test: true }
          })
        });
        return response.ok;
      } catch {
        return false;
      }
    },

    registerBiometricDevice: (device) => {
      set((state) => ({ biometricDevices: [...state.biometricDevices, device] }));
      get().addIntegrationLog({
        type: 'biometric.device.registered',
        message: `Biometric device registered: ${device.name}`,
        details: { deviceId: device.id, ip: device.ipAddress }
      });
    },

    removeBiometricDevice: (deviceId) => {
      set((state) => ({
        biometricDevices: state.biometricDevices.filter(d => d.id !== deviceId)
      }));
      get().addIntegrationLog({
        type: 'biometric.device.removed',
        message: `Biometric device removed: ${deviceId}`,
        details: { deviceId }
      });
    },

    updateBiometricDevice: (device) => {
        set((state) => ({
            biometricDevices: state.biometricDevices.map(d => d.id === device.id ? device : d)
        }));
    },

    syncBiometricDevice: async (deviceId) => {
       // Placeholder for sync logic
       // In a real implementation, this would call the device API
       get().addIntegrationLog({
         type: 'biometric.sync.started',
         message: `Sync started for device ${deviceId}`,
         details: { deviceId }
       });
       
       // Simulate sync
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       get().addIntegrationLog({
         type: 'biometric.sync.completed',
         message: `Sync completed for device ${deviceId}`,
         details: { deviceId, recordsSynced: 0 }
       });
    },

    testBiometricConnection: async (deviceId) => {
       const device = get().biometricDevices.find(d => d.id === deviceId);
       if (!device) return false;
       
       // Simulate connection test
       return true; 
    },

    createMobileSession: (userId, deviceInfo) => {
      const token = `ms_${Math.random().toString(36).substring(2)}${Date.now()}`;
      const session: MobileSession = {
        id: Math.random().toString(36).substring(2, 10),
        userId,
        token,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        lastActive: new Date(),
        status: 'ACTIVE'
      };

      set((state) => ({ mobileSessions: [...state.mobileSessions, session] }));
      return session;
    },

    validateMobileSession: (token) => {
      const state = get();
      const session = state.mobileSessions.find(s => s.token === token && s.status === 'ACTIVE');
      
      if (!session) return null;
      
      if (new Date(session.expiresAt) < new Date()) {
        state.revokeMobileSession(session.id);
        return null;
      }

      // Update last active
      const updatedSession = { ...session, lastActive: new Date() };
      set((state) => ({
        mobileSessions: state.mobileSessions.map(s => s.id === session.id ? updatedSession : s)
      }));

      return updatedSession;
    },

    revokeMobileSession: (sessionId) => {
      set((state) => ({
        mobileSessions: state.mobileSessions.map(s => s.id === sessionId ? { ...s, status: 'REVOKED' } : s)
      }));
    },

    processBiometricWebhook: async (payload) => {
       const state = get();
       // Log the raw webhook
       state.addIntegrationLog({
         type: 'biometric.webhook.received',
         message: 'Biometric data received via webhook',
         details: payload
       });

       // Find linked employee
       // Implementation depends on employee mapping logic
    }
  };
};
