/**
 * Serviço de Integração Biométrica
 * Conecta com dispositivos biométricos externos e processa dados
 */

import { useStore } from '../store/useStore';
import { BiometricClockEvent, BiometricDevice, AttendanceRecord } from '../types';
import { logger } from './logger';

export class BiometricIntegrationService {
  private static instance: BiometricIntegrationService;
  private devices: Map<string, BiometricDevice> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.loadDevicesFromStorage();
  }

  static getInstance(): BiometricIntegrationService {
    if (!BiometricIntegrationService.instance) {
      BiometricIntegrationService.instance = new BiometricIntegrationService();
    }
    return BiometricIntegrationService.instance;
  }

  /**
   * Registrar um novo dispositivo biométrico
   */
  async registerDevice(device: BiometricDevice): Promise<boolean> {
    try {
      // Testar conexão com dispositivo
      const connected = await this.testConnection(device);
      if (!connected) {
        logger.error(`Falha ao conectar com dispositivo: ${device.name}`, { deviceId: device.id }, 'BIOMETRICS');
        return false;
      }

      this.devices.set(device.id, { ...device, status: 'CONNECTED' });
      this.saveDevicesToStorage();

      // Iniciar sincronização periódica
      this.startSync(device.id);

      return true;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro ao registrar dispositivo biométrico', { error: error.message }, 'BIOMETRICS');
      return false;
    }
  }

  /**
   * Desregistrar dispositivo
   */
  async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      const timer = this.syncTimers.get(deviceId);
      if (timer) {
        clearInterval(timer);
        this.syncTimers.delete(deviceId);
      }

      const removed = this.devices.delete(deviceId);
      if (removed) {
        this.saveDevicesToStorage();
      }
      return removed;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro ao desregistrar dispositivo biométrico', { error: error.message }, 'BIOMETRICS');
      return false;
    }
  }

  /**
   * Testar conexão com dispositivo
   */
  public async testConnection(device: BiometricDevice): Promise<boolean> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`http://${device.ipAddress}:${device.port}/health`, {
        headers: {
          'Authorization': `Bearer ${device.apiKey}`
        },
        signal: controller.signal
      });
      clearTimeout(id);
      return response.ok;
    } catch {
      clearTimeout(id);
      return false;
    }
  }

  /**
   * Iniciar sincronização periódica com dispositivo
   */
  private startSync(deviceId: string): void {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return;

      // Sincronizar imediatamente
      this.syncDevice(deviceId);

      // Depois, sincronizar periodicamente
      const timer = setInterval(() => {
        this.syncDevice(deviceId);
      }, device.syncInterval * 60 * 1000); // converter minutos para ms

      this.syncTimers.set(deviceId, timer);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(`Erro ao iniciar sincronização com ${deviceId}`, { error: error.message }, 'BIOMETRICS');
    }
  }

  /**
   * Sincronizar dados com dispositivo
   */
  public async syncDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device || device.status !== 'CONNECTED') return;

    try {
      const response = await fetch(
        `http://${device.ipAddress}:${device.port}/api/clock-events?since=${device.lastSync || new Date(0).toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${device.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const events: BiometricClockEvent[] = await response.json();

      // Processar cada evento
      for (const event of events) {
        await this.processBiometricEvent(event);
      }

      // Atualizar timestamp de sincronização
      device.lastSync = new Date();
      this.saveDevicesToStorage();

    } catch (e: unknown) {
      const error = e as Error;
      logger.error(`Erro ao sincronizar com ${device.name}`, { error: error.message }, 'BIOMETRICS');
      device.status = 'DISCONNECTED';
    }
  }

  /**
   * Processar evento biométrico (clock in/out)
   * Automaticamente atualiza attendance e finanças
   */
  private async processBiometricEvent(event: BiometricClockEvent): Promise<void> {
    const store = useStore.getState();

    try {
      // 1. Encontrar o funcionário pelo ID biométrico externo
      const employee = store.employees.find(e => e.externalBioId === event.externalBioId);

      if (!employee) {
        logger.warn(`Funcionário não encontrado com bioID: ${event.externalBioId}`, { bioId: event.externalBioId }, 'BIOMETRICS');
        return;
      }

      // 2. Criar/atualizar registro de presença
      const attendanceRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: employee.id,
        date: new Date(event.clockTime).toISOString().split('T')[0],
        source: 'EXTERNO',
        isLate: false,
        lateMinutes: 0,
        overtimeHours: 0,
        isAbsence: false,
        totalHours: 0,
        clockIn: event.type === 'CLOCK_IN' ? event.clockTime.toISOString() : undefined,
        clockOut: event.type === 'CLOCK_OUT' ? event.clockTime.toISOString() : undefined
      };

      // Verificar se há registro de clock in no mesmo dia
      const existingAttendance = store.attendance.find(
        a => a.employeeId === employee.id && a.date === attendanceRecord.date
      );

      if (existingAttendance) {
        // Atualizar com novo horário
        const updatedAttendance = {
          ...existingAttendance,
          clockOut: event.type === 'CLOCK_OUT' ? event.clockTime.toISOString() : existingAttendance.clockOut,
          clockIn: event.type === 'CLOCK_IN' ? event.clockTime.toISOString() : existingAttendance.clockIn
        };

        // Calcular horas e atrasos
        this.calculateAttendanceMetrics(updatedAttendance);

        // Adicionar à store
        store.attendance = store.attendance.map(a =>
          a.id === existingAttendance.id ? updatedAttendance : a
        );
      } else if (event.type === 'CLOCK_IN') {
        store.attendance = [...store.attendance, attendanceRecord];
      }

      // 3. Marcar evento como processado
      event.processed = true;
      event.processedAt = new Date();
      event.linkedAttendanceId = attendanceRecord.id;

      // 4. Log de integração
      store.addIntegrationLog({
        type: 'BIOMETRIC_SYNC',
        message: `Evento biométrico processado: ${employee.name} - ${event.type}`,
        details: {
          integrationName: 'BiometricDevice',
          eventType: `attendance.${event.type.toLowerCase()}`,
          status: 'SUCCESS',
          request: event,
          response: attendanceRecord,
          duration: 0
        }
      });

      logger.info(`Evento biométrico processado: ${employee.name} - ${event.type}`, { employee: employee.name, type: event.type }, 'BIOMETRICS');

    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro ao processar evento biométrico', { error: error.message }, 'BIOMETRICS');

      // Log de erro
      const store = useStore.getState();
      store.addIntegrationLog({
        type: 'BIOMETRIC_ERROR',
        message: `Erro ao processar evento biométrico: ${(error as Error).message}`,
        details: {
          integrationName: 'BiometricDevice',
          eventType: 'attendance.error',
          status: 'FAILED',
          request: event,
          response: null,
          error: (error as Error).message,
          duration: 0
        }
      });
    }
  }

  /**
   * Calcular métricas de presença
   */
  private calculateAttendanceMetrics(attendance: AttendanceRecord): void {
    if (!attendance.clockIn || !attendance.clockOut) return;

    const clockIn = new Date(attendance.clockIn);
    const clockOut = new Date(attendance.clockOut);

    // Calcular total de horas
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    attendance.totalHours = totalMinutes / 60;

    // Detectar atrasos (se entrou depois das 8:00 AM)
    const lateHour = 8;
    if (clockIn.getHours() > lateHour || 
        (clockIn.getHours() === lateHour && clockIn.getMinutes() > 0)) {
      attendance.isLate = true;
      attendance.lateMinutes = (clockIn.getHours() - lateHour) * 60 + clockIn.getMinutes();
    }

    // Detectar horas extras (se trabalhou mais de 8 horas)
    if (attendance.totalHours > 8) {
      attendance.overtimeHours = attendance.totalHours - 8;
    }
  }

  /**
   * Webhook para receber eventos em tempo real
   * Chamado quando dispositivo envia dados via webhook
   */
  async handleWebhookEvent(event: BiometricClockEvent): Promise<void> {
    event.processed = false;
    await this.processBiometricEvent(event);
  }

  /**
   * Obter lista de dispositivos
   */
  getDevices(): BiometricDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Atualizar status de dispositivo
   */
  updateDeviceStatus(deviceId: string, status: 'CONNECTED' | 'DISCONNECTED'): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      this.saveDevicesToStorage();
    }
  }

  // Storage helpers
  private saveDevicesToStorage(): void {
    const devicesArray = Array.from(this.devices.values());
    localStorage.setItem('biometric_devices', JSON.stringify(devicesArray));
  }

  private loadDevicesFromStorage(): void {
    try {
      const stored = localStorage.getItem('biometric_devices');
      if (stored) {
        const devices: BiometricDevice[] = JSON.parse(stored);
        devices.forEach(d => this.devices.set(d.id, d));
      }
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('Erro ao carregar dispositivos biométricos', { error: error.message }, 'BIOMETRICS');
    }
  }
}

export const biometricService = BiometricIntegrationService.getInstance();
