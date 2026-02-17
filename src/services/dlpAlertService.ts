import { logger } from './logger';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface DLPAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * DLP Alert Service
 * Manages proactive notifications for data integrity and persistence issues.
 */
class DLPAlertService {
  private alerts: DLPAlert[] = [];
  private listeners: ((alerts: DLPAlert[]) => void)[] = [];

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
      // In a real-world app, you might send an email, SMS, or Webhook here
      await this.sendExternalNotification(alert);
    } else if (severity === 'WARNING') {
      logger.warn(`DLP WARNING: ${message}`, metadata, 'DLP');
    }

    this.notifyListeners();
    return alert;
  }

  /**
   * Resolves an alert.
   */
  resolve(id: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.notifyListeners();
    }
  }

  /**
   * Gets all active (unresolved) alerts.
   */
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Subscribe to alert changes.
   */
  subscribe(listener: (alerts: DLPAlert[]) => void) {
    this.listeners.push(listener);
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
    console.log(`[DLP EXTERNAL ALERT] Sending ${alert.severity} notification: ${alert.message}`);
    
    // Example: Webhook integration (could be Slack, Discord, or a custom monitoring service)
    try {
      // const webhookUrl = process.env.VITE_DLP_WEBHOOK_URL;
      // if (webhookUrl) {
      //   await fetch(webhookUrl, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(alert)
      //   });
      // }
    } catch (e) {
      console.error("Failed to send external DLP notification", e);
    }
  }
}

export const dlpAlertService = new DLPAlertService();
