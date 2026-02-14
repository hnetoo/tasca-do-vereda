import { BiometricIntegrationService } from '../services/biometricService';
import { IntegrationAPIService, initializeIntegrationAPI } from '../services/integrationAPIService';
import { APIKey, WebhookConfig, BiometricDevice, IntegrationLog, MobileSession, BiometricClockEvent } from '../types';

/**
 * Integrations Store Module
 * 
 * Extends the main store with integration capabilities:
 * - API Key Management
 * - Webhook Configuration
 * - Biometric Device Integration
 * - Integration Logging
 * - Mobile Sessions
 */

interface IntegrationsState {
  // API Keys
  apiKeys: APIKey[];
  generateAPIKey: (name: string, scopes: string[]) => APIKey;
  revokeAPIKey: (keyId: string) => void;
  
  // Webhooks
  webhookConfigs: WebhookConfig[];
  addWebhook: (config: WebhookConfig) => void;
  updateWebhook: (config: WebhookConfig) => void;
  removeWebhook: (webhookId: string) => void;
  triggerWebhook: (event: string, data: unknown) => Promise<void>;
  testWebhook: (webhookId: string) => Promise<boolean>;
  
  // Biometric Devices
  biometricDevices: BiometricDevice[];
  registerBiometricDevice: (device: BiometricDevice) => void;
  unregisterBiometricDevice: (deviceId: string) => void;
  syncBiometricDevice: (deviceId: string) => Promise<void>;
  testBiometricConnection: (deviceId: string) => Promise<boolean>;
  
  // Integration Logs
  integrationLogs: IntegrationLog[];
  addIntegrationLog: (log: IntegrationLog) => void;
  clearOldLogs: (daysToKeep?: number) => void;
  
  // Mobile Sessions
  mobileSessions: MobileSession[];
  createMobileSession: (userId: string, deviceInfo: { deviceId: string; deviceName: string; ipAddress: string }) => MobileSession;
  validateMobileSession: (token: string) => MobileSession | null;
  revokeMobileSession: (sessionId: string) => void;
  
  // Integration API
  initializeAPI: (apiKey: string, apiSecret: string) => IntegrationAPIService;
  processBiometricWebhook: (payload: {
    externalBioId: string;
    type: string;
    clockTime: string | Date;
    temperature?: number;
    deviceId?: string;
  }) => Promise<void>;
}

export function setupIntegrationsModule() {
  const biometricService = BiometricIntegrationService.getInstance();
  
  const integrationsState: IntegrationsState = {
    apiKeys: [],
    generateAPIKey: (name, scopes) => {
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
      
      integrationsState.apiKeys.push(apiKey);
      localStorage.setItem('api_keys', JSON.stringify(integrationsState.apiKeys));
      
      return apiKey;
    },

    revokeAPIKey: (keyId) => {
      const key = integrationsState.apiKeys.find(k => k.id === keyId);
      if (key) {
        key.status = 'REVOKED';
        localStorage.setItem('api_keys', JSON.stringify(integrationsState.apiKeys));
      }
    },

    webhookConfigs: [],
    addWebhook: (config) => {
      integrationsState.webhookConfigs.push(config);
      localStorage.setItem('webhook_configs', JSON.stringify(integrationsState.webhookConfigs));
    },

    updateWebhook: (config) => {
      const index = integrationsState.webhookConfigs.findIndex(w => w.id === config.id);
      if (index !== -1) {
        integrationsState.webhookConfigs[index] = config;
        localStorage.setItem('webhook_configs', JSON.stringify(integrationsState.webhookConfigs));
      }
    },

    removeWebhook: (webhookId) => {
      integrationsState.webhookConfigs = integrationsState.webhookConfigs.filter(w => w.id !== webhookId);
      localStorage.setItem('webhook_configs', JSON.stringify(integrationsState.webhookConfigs));
    },

    triggerWebhook: async (event, data) => {
      const relevantWebhooks = integrationsState.webhookConfigs.filter(
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

          webhook.lastTriggered = new Date();
          webhook.failureCount = response.ok ? 0 : webhook.failureCount + 1;

          integrationsState.addIntegrationLog({
            id: Math.random().toString(36).substring(7),
            integrationName: `Webhook: ${webhook.name}`,
            eventType: event,
            status: response.ok ? 'SUCCESS' : 'FAILED',
            request: { event, data },
            response: await response.json().catch(() => ({})),
            timestamp: new Date(),
            duration: 0
          });
        } catch (error) {
          webhook.failureCount++;
          integrationsState.addIntegrationLog({
            id: Math.random().toString(36).substring(7),
            integrationName: `Webhook: ${webhook.name}`,
            eventType: event,
            status: 'FAILED',
            request: { event, data },
            response: {},
            error: (error as Error).message,
            timestamp: new Date(),
            duration: 0
          });
        }
      }
    },

    testWebhook: async (webhookId) => {
      const webhook = integrationsState.webhookConfigs.find(w => w.id === webhookId);
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

    biometricDevices: [],
    registerBiometricDevice: (device) => {
      integrationsState.biometricDevices.push(device);
      biometricService.registerDevice(device);
      localStorage.setItem('biometric_devices', JSON.stringify(integrationsState.biometricDevices));
    },

    unregisterBiometricDevice: (deviceId) => {
      integrationsState.biometricDevices = integrationsState.biometricDevices.filter(d => d.id !== deviceId);
      biometricService.unregisterDevice(deviceId);
      localStorage.setItem('biometric_devices', JSON.stringify(integrationsState.biometricDevices));
    },

    syncBiometricDevice: async (deviceId) => {
      await biometricService.syncDevice(deviceId);
      const device = integrationsState.biometricDevices.find(d => d.id === deviceId);
      if (device) {
        device.lastSync = new Date();
        localStorage.setItem('biometric_devices', JSON.stringify(integrationsState.biometricDevices));
      }
    },

    testBiometricConnection: async (deviceId) => {
      const device = integrationsState.biometricDevices.find(d => d.id === deviceId);
      if (!device) return false;
      return await biometricService.testConnection(device);
    },

    integrationLogs: [],
    addIntegrationLog: (log) => {
      integrationsState.integrationLogs.push(log);
      // Keep only last 1000 logs in memory
      if (integrationsState.integrationLogs.length > 1000) {
        integrationsState.integrationLogs = integrationsState.integrationLogs.slice(-1000);
      }
      localStorage.setItem('integration_logs', JSON.stringify(integrationsState.integrationLogs.slice(-100)));
    },

    clearOldLogs: (daysToKeep = 30) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      integrationsState.integrationLogs = integrationsState.integrationLogs.filter(
        log => new Date(log.timestamp) > cutoffDate
      );
    },

    mobileSessions: [],
    createMobileSession: (userId, deviceInfo) => {
      const token = `mobile_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiration

      const session: MobileSession = {
        id: Math.random().toString(36).substring(7),
        userId,
        token,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        createdAt: new Date(),
        expiresAt,
        lastActivity: new Date(),
        status: 'ACTIVE'
      };

      integrationsState.mobileSessions.push(session);
      localStorage.setItem('mobile_sessions', JSON.stringify(integrationsState.mobileSessions));

      return session;
    },

    validateMobileSession: (token) => {
      const session = integrationsState.mobileSessions.find(s => s.token === token);
      
      if (!session) return null;
      if (new Date() > session.expiresAt) {
        session.status = 'EXPIRED';
        return null;
      }
      if (session.status !== 'ACTIVE') return null;

      session.lastActivity = new Date();
      return session;
    },

    revokeMobileSession: (sessionId) => {
      const session = integrationsState.mobileSessions.find(s => s.id === sessionId);
      if (session) {
        session.status = 'REVOKED';
        localStorage.setItem('mobile_sessions', JSON.stringify(integrationsState.mobileSessions));
      }
    },

    initializeAPI: (apiKey, apiSecret) => {
      return initializeIntegrationAPI(apiKey, apiSecret);
    },

    processBiometricWebhook: async (payload) => {
      try {
        const { externalBioId, type, clockTime, temperature, deviceId } = payload;
        
        const biometricEvent: BiometricClockEvent = {
          id: Math.random().toString(36).substring(7),
          deviceId: deviceId || 'unknown',
          externalBioId,
          clockTime: new Date(clockTime),
          type,
          temperature,
          processed: false
        };

        await biometricService.handleWebhookEvent(biometricEvent);

        integrationsState.addIntegrationLog({
          id: Math.random().toString(36).substring(7),
          integrationName: 'BiometricDevice',
          eventType: 'attendance.clockin',
          status: 'SUCCESS',
          request: payload,
          response: { processed: true },
          timestamp: new Date(),
          duration: 0
        });

        // Trigger webhook for other systems
        await integrationsState.triggerWebhook(`attendance.${type.toLowerCase()}`, {
          externalBioId,
          clockTime,
          temperature
        });
      } catch (error) {
        integrationsState.addIntegrationLog({
          id: Math.random().toString(36).substring(7),
          integrationName: 'BiometricDevice',
          eventType: 'attendance.event',
          status: 'FAILED',
          request: payload,
          response: {},
          error: (error as Error).message,
          timestamp: new Date(),
          duration: 0
        });
      }
    }
  };

  // Load persisted data
  const savedApiKeys = localStorage.getItem('api_keys');
  if (savedApiKeys) {
    try {
      integrationsState.apiKeys = JSON.parse(savedApiKeys);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    }
  }

  const savedWebhooks = localStorage.getItem('webhook_configs');
  if (savedWebhooks) {
    try {
      integrationsState.webhookConfigs = JSON.parse(savedWebhooks);
    } catch (e) {
      console.error('Failed to load webhooks:', e);
    }
  }

  const savedDevices = localStorage.getItem('biometric_devices');
  if (savedDevices) {
    try {
      integrationsState.biometricDevices = JSON.parse(savedDevices);
    } catch (e) {
      console.error('Failed to load biometric devices:', e);
    }
  }

  const savedSessions = localStorage.getItem('mobile_sessions');
  if (savedSessions) {
    try {
      integrationsState.mobileSessions = JSON.parse(savedSessions);
    } catch (e) {
      console.error('Failed to load mobile sessions:', e);
    }
  }

  return integrationsState;
}

// Export the integrations module as a hook
export function useIntegrations() {
  return setupIntegrationsModule();
}
