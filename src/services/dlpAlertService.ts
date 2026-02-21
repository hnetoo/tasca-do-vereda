import { logger } from './logger';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DLPAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * DLP Alert Service
 * Manages proactive notifications for data integrity and persistence issues.
 */
class DLPAlertService {
  private alerts: DLPAlert[] = [];
  private listeners: ((alerts: DLPAlert[]) => void)[] = [];
  private static instance: DLPAlertService;
  private auditLogger?: (log: any) => void;

  private constructor() {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dlp_alerts');
        if (stored) {
          this.alerts = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load DLP alerts', e);
      }
    }
  }

  public static getInstance(): DLPAlertService {
    if (!DLPAlertService.instance) {
      DLPAlertService.instance = new DLPAlertService();
    }
    return DLPAlertService.instance;
  }

  public setAuditLogger(logger: (log: any) => void) {
    this.auditLogger = logger;
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dlp_alerts', JSON.stringify(this.alerts));
    }
    this.notifyListeners();
  }

  /**
   * Triggers a new DLP alert.
   */
  async trigger(severity: AlertSeverity, message: string, metadata?: Record<string, unknown>) {
    const alert: DLPAlert = {
      id: Math.random().toString(36).substring(7),
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata
    };

    this.alerts.unshift(alert);
    
    // Log the alert
    if (severity === 'CRITICAL') {
      logger.error(`DLP CRITICAL ALERT: ${message}`, metadata, 'DLP');
      await this.sendExternalNotification(alert);
    } else if (severity === 'WARNING') {
      logger.warn(`DLP WARNING: ${message}`, metadata, 'DLP');
    } else {
      logger.info(`DLP INFO: ${message}`, metadata, 'DLP');
    }

    this.save();
    return alert;
  }

  /**
   * Resolves an alert.
   */
  resolve(id: string, userId?: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = userId;

      logger.info(`DLP Alert Resolved: ${alert.message}`, { alertId: id, userId }, 'DLP');
      
      if (this.auditLogger) {
        this.auditLogger({
            type: 'DLP_ALERT_RESOLVED',
            entityType: 'DLPAlert',
            entityId: id,
            details: { message: alert.message, resolvedBy: userId }
        });
      }

      this.save();
    }
  }

  /**
   * Resolves all alerts.
   */
  resolveAll(userId?: string) {
    const now = new Date().toISOString();
    let count = 0;

    this.alerts.forEach(a => {
        if (!a.resolved) {
            a.resolved = true;
            a.resolvedAt = now;
            a.resolvedBy = userId;
            count++;
        }
    });

    if (count > 0) {
        logger.info(`Resolved ${count} DLP Alerts`, { userId }, 'DLP');
        if (this.auditLogger) {
            this.auditLogger({
                type: 'DLP_ALERTS_RESOLVED_ALL',
                entityType: 'DLPAlert',
                entityId: 'ALL',
                details: { count, resolvedBy: userId }
            });
        }
        this.save();
    }
  }

  /**
   * Deletes an alert (permanently).
   */
  dismiss(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.save();
  }

  /**
   * Clears all resolved alerts.
   */
  clearResolved() {
    this.alerts = this.alerts.filter(a => !a.resolved);
    this.save();
  }

  /**
   * Gets all active (unresolved) alerts.
   */
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Gets all alerts.
   */
  getAllAlerts() {
    return this.alerts;
  }

  /**
   * Subscribe to alert changes.
   */
  subscribe(listener: (alerts: DLPAlert[]) => void) {
    this.listeners.push(listener);
    listener(this.alerts); // Initial emit
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.alerts));
  }

  /**
   * Simulates sending a notification to an external service (Webhook, Email, etc.)
   */
  private async sendExternalNotification(alert: DLPAlert) {
    // console.log(`[DLP EXTERNAL ALERT] Sending ${alert.severity} notification: ${alert.message}`);
    // In a real implementation, this would call an API
  }
}

export const dlpAlertService = DLPAlertService.getInstance();
