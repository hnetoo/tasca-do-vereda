import { SecurityAlert } from '../types';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

const MAX_LOGS = 1000;
const STORAGE_KEY = 'tasca_vereda_logs';

class LoggerService {
  private logs: LogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load logs', e);
      this.logs = [];
    }
  }

  private saveLogs() {
    if (typeof localStorage === 'undefined') return;
    try {
      // Keep only last MAX_LOGS
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }

  private addLog(level: LogLevel, message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 15), // Generate a simple unique ID
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data, this.getCircularReplacer())) : undefined,
      context
    };

    this.logs.push(entry);
    this.saveLogs();

    // Auto-sync logs to Supabase if it's a critical error, security alert, or audit event
    if (level === 'error' || context === 'SECURITY' || context === 'AUTH' || context === 'AUDIT') {
      import('./supabaseService').then(({ supabaseService }) => {
        if (supabaseService.isConnected()) {
          supabaseService.syncAuditLogs([entry]).catch(err => {
            console.warn('Failed to sync log to cloud:', err);
          });
        }
      });
    }

    // Also log to console
    const prefix = `[${level.toUpperCase()}] ${context ? `[${context}] ` : ''}`;
    if (level === 'error') {
      console.error(prefix + message, data);
    } else if (level === 'warn') {
      console.warn(prefix + message, data);
    } else {
      console.log(prefix + message, data);
    }
  }

  private getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: unknown) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    };
  }

  info(message: string, data?: unknown, context?: string) {
    this.addLog('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.addLog('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string) {
    this.addLog('error', message, data, context);
  }

  audit(operation: string, details: unknown, status: 'SUCCESS' | 'FAILURE' | 'PENDING' = 'SUCCESS') {
    const context = 'AUDIT';
    const message = `Audit: ${operation} - ${status}`;
    this.addLog('info', message, details, context);
  }

  security(message: string, details?: unknown) {
    this.addLog('warn', `SECURITY: ${message}`, details, 'SECURITY');
  }

  auth(message: string, details?: unknown) {
    this.addLog('info', `AUTH: ${message}`, details, 'AUTH');
  }

  debug(message: string, data?: unknown, context?: string) {
    const isDev = typeof process !== 'undefined' && process.env && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');
    const isViteDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    
    if (isDev || isViteDev) {
      this.addLog('debug', message, data, context);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  getRecentErrors(limit = 10) {
    return this.logs
      .filter(l => l.level === 'error')
      .slice(-limit)
      .reverse();
  }

  getSecurityAlerts(limit = 50): SecurityAlert[] {
    return this.logs
      .filter(l => l.context === 'SECURITY' || l.message.includes('SECURITY ALERT'))
      .slice(-limit)
      .reverse()
      .map(logEntry => ({
        id: logEntry.id,
        type: (logEntry.level === 'error' ? 'CRITICAL' : logEntry.level === 'warn' ? 'WARNING' : 'INFO'),
        message: logEntry.message,
        timestamp: new Date(logEntry.timestamp),
        resolved: false, // Default to false as LogEntry doesn't track resolution status
        details: (logEntry.data as Record<string, unknown>) || {},
      }));
  }

  getFirebaseReadAudit(limit = 100) {
    return this.logs
      .filter(l => l.context === 'FIREBASE' && l.message.includes('Read Audit'))
      .slice(-limit)
      .reverse();
  }

  exportLogs() {
    try {
      const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasca-vereda-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Failed to export logs', e);
      return false;
    }
  }
}

export const logger = new LoggerService();
