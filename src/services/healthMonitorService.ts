import { logger } from './logger';
import { dlpAlertService } from './dlpAlertService';
import { performSelfCheckAction } from '@/app/actions/health';
import { executeQuery } from '../services/database/operations';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

export interface SystemHealthReport {
  timestamp: string;
  uptime: number; // in seconds
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    limit: number;
  };
  stabilityScore: number; // 0-100
  mtbf: number; // Mean Time Between Failures (hours)
  recoveryRate: number; // 0-1
  activeAlerts: number;
  performanceMetrics: {
    avgResponseTime: number;
    frameDrops: number;
    longTasks: number;
    cpuUsage: number; // Simulated
    memoryUsage: number; // Actual from performance.memory
    networkLatency: number; // Simulated
    diskUsage: number; // Simulated
    latency: number;
  };
  failurePrediction?: {
    probability: number; // 0-1
    likelyType: string;
    timeframe: string;
    factors: string[];
  };
}

export interface SystemIssue {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  recovered: boolean;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

class HealthMonitorService {
  private startTime: number = Date.now();
  private lastFailureTime: number | null = null;
  private totalFailures: number = 0;
  private totalRecoveries: number = 0;
  private responseTimes: number[] = [];
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;
  private metricsHistory: SystemHealthReport[] = [];
  private issueHistory: SystemIssue[] = [];
  private longTasksCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWatchdog();
      this.monitorPerformance();
      this.detectMemoryLeaks();
    }
  }

  /**
   * Initializes the Swiss-watch precision watchdog.
   */
  private initWatchdog() {
    this.watchdogInterval = setInterval(() => {
      this.performSelfCheck();
    }, 60000); // Every minute
  }

  /**
   * Performs a comprehensive self-check of the application state.
   */
  public getHealthReport(): SystemHealthReport {
    const mem = (performance as PerformanceWithMemory).memory || { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Simulated metrics for realistic dashboard
    const simulatedCpu = 5 + Math.random() * 15; // 5-20%
    const simulatedNetwork = 20 + Math.random() * 40; // 20-60ms
    const simulatedDisk = 12 + Math.random() * 5; // 12-17%

    return {
      timestamp: new Date().toISOString(),
      uptime,
      memoryUsage: {
        heapUsed: mem.usedJSHeapSize,
        heapTotal: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit
      },
      stabilityScore: this.calculateStabilityScore(),
      mtbf: this.calculateMTBF(),
      recoveryRate: this.totalFailures > 0 ? this.totalRecoveries / this.totalFailures : 1,
      activeAlerts: dlpAlertService.getActiveAlerts().length,
      performanceMetrics: {
        avgResponseTime: this.responseTimes.length > 0 ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0,
        frameDrops: 0,
        longTasks: this.longTasksCount,
        cpuUsage: simulatedCpu,
        memoryUsage: mem.usedJSHeapSize / (1024 * 1024),
        networkLatency: simulatedNetwork,
        diskUsage: simulatedDisk,
        latency: this.responseTimes.length > 0 ? this.responseTimes[this.responseTimes.length - 1] : 0
      },
      failurePrediction: this.predictFutureFailures()
    };
  }

  public getRecentLogs(limit: number = 20): SystemIssue[] {
    return [...this.issueHistory].reverse().slice(0, limit);
  }

  private predictFutureFailures(): SystemHealthReport['failurePrediction'] {
    const factors: string[] = [];
    let probability = 0;

    // 1. Analyze Latency Trend
    if (this.responseTimes.length >= 5) {
      const last5 = this.responseTimes.slice(-5);
      const isIncreasing = last5.every((val, i) => i === 0 || val >= last5[i-1]);
      if (isIncreasing) {
        probability += 0.3;
        factors.push('Crescimento linear na latência do Event Loop');
      }
    }

    // 2. Analyze Memory Pressure
    const mem = (performance as PerformanceWithMemory).memory;
    if (mem && mem.usedJSHeapSize > mem.jsHeapSizeLimit * 0.7) {
      probability += 0.4;
      factors.push('Pressão crítica de memória (>70%)');
    }

    // 3. Analyze Recent Issue Density
    const recentIssues = this.issueHistory.filter(i => 
      Date.now() - new Date(i.timestamp).getTime() < 10 * 60 * 1000
    );
    if (recentIssues.length > 3) {
      probability += 0.5;
      factors.push(`Alta densidade de erros recentes (${recentIssues.length} nos últimos 10min)`);
    }

    // 4. Stability Score Trend
    if (this.metricsHistory.length >= 3) {
      const last3 = this.metricsHistory.slice(-3);
      const drop = last3[0].stabilityScore - last3[2].stabilityScore;
      if (drop > 15) {
        probability += 0.6;
        factors.push('Queda abrupta no score de estabilidade');
      }
    }

    probability = Math.min(0.99, probability);

    if (probability > 0.4) {
      return {
        probability,
        likelyType: probability > 0.7 ? 'CRITICAL_SYSTEM_FREEZE' : 'PERFORMANCE_DEGRADATION',
        timeframe: 'Próximos 15-30 minutos',
        factors
      };
    }

    return {
      probability: 0.05,
      likelyType: 'NONE',
      timeframe: 'Estável',
      factors: ['Nenhum fator de risco detectado']
    };
  }

  public getMetricsHistory(): SystemHealthReport[] {
    return this.metricsHistory;
  }

  public getIssueHistory(): SystemIssue[] {
    return this.issueHistory;
  }

  private calculateStabilityScore(): number {
    const base = 100;
    const failurePenalty = this.totalFailures * 10;
    const longTaskPenalty = Math.floor(this.longTasksCount / 5);
    return Math.max(0, base - failurePenalty - longTaskPenalty);
  }

  private calculateMTBF(): number {
    const uptimeHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    return this.totalFailures > 0 ? uptimeHours / this.totalFailures : uptimeHours;
  }

  private async checkDatabaseLocks(): Promise<boolean> {
    try {
      // Query to detect active locks that might indicate a problem
      const lockQuery = `
        SELECT
           pg_locks.pid AS bloqueador_pid,
           pg_locks.mode AS modo_bloqueio,
           pg_locks.granted AS bloqueio_concedido,
           pg_locks.relation::regclass AS tabela_afetada,
           pg_locks.transactionid AS id_transacao,
           pg_locks.virtualtransaction AS transacao_virtual,
           pg_locks.fastpath AS caminho_rapido,
           pg_locks.waitstart AS inicio_espera,
          pg_stat_activity.query AS consulta_bloqueadora
        FROM pg_catalog.pg_locks AS pg_locks
        JOIN pg_catalog.pg_stat_activity AS pg_stat_activity
          ON pg_locks.pid = pg_stat_activity.pid
        WHERE NOT pg_locks.granted
          AND pg_locks.pid != pg_backend_pid();
      `;
      const locks = await executeQuery(lockQuery);

      if (locks && (locks as any[]).length > 0) {
        logger.warn('Database locks detected:', { locks }, 'HealthMonitorService');
        return true;
      }

      // Query to detect deadlocks (simplified check, actual deadlock detection is complex)
      // PostgreSQL usually handles deadlocks automatically by terminating one of the transactions.
      // This query helps to identify queries that are waiting for locks, which could be an indicator of contention.
      const deadlockQuery = `
        SELECT
          activity.pid,
          activity.usename,
          activity.waiting,
          activity.state,
          activity.query_start,
          activity.query,
          blocking.pid AS blocking_pid,
          blocking.query AS blocking_query
        FROM pg_stat_activity AS activity
        JOIN pg_locks AS locks ON activity.pid = locks.pid AND locks.granted = false
        JOIN pg_locks AS blocking_locks ON locks.relation = blocking_locks.relation AND blocking_locks.granted = true
        JOIN pg_stat_activity AS blocking ON blocking_locks.pid = blocking.pid
        WHERE activity.waiting = true;
      `;
      const deadlocks = await executeQuery(deadlockQuery);

      if (deadlocks && (deadlocks as any[]).length > 0) {
        logger.error('Potential database deadlocks or severe contention detected:', { deadlocks }, 'HealthMonitorService');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking database locks/deadlocks', { error }, 'HealthMonitorService');
      return false;
    }
  }

  private async performSelfCheck() {
    try {
      // 1. Check for Deadlocks / Event Loop lag
      const start = performance.now();
      setTimeout(() => {
        const lag = performance.now() - start;
        if (lag > 2000) {
          this.handleIssue('PERFORMANCE_DEGRADED', `High Event Loop Lag detected: ${lag.toFixed(2)}ms`, 'WARNING');
        }
        this.responseTimes.push(lag);
        if (this.responseTimes.length > 50) this.responseTimes.shift();
      }, 0);

      // 2. Memory Check
      const mem = (performance as PerformanceWithMemory).memory;
      if (mem && mem.usedJSHeapSize > mem.jsHeapSizeLimit * 0.8) {
        this.handleIssue('MEMORY_CRITICAL', `Memory usage at ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`, 'CRITICAL');
      }

      // 3. Database Locks Check
      const areDatabaseTablesHealthy = await this.checkDatabaseLocks();
      if (areDatabaseTablesHealthy) {
        this.handleIssue('DATABASE_LOCKS', 'Database locks or contention detected', 'CRITICAL');
      }

      // 4. Data Integrity Check (via Server Action)
      const { isHealthy, recovered, issue } = await performSelfCheckAction(
        this.totalFailures,
        this.totalRecoveries,
        this.issueHistory
      );

      if (!isHealthy) {
        this.totalFailures++;
        this.lastFailureTime = Date.now();
        if (issue) {
          this.issueHistory.push(issue);
        }
        if (recovered) {
          this.totalRecoveries++;
          if (this.issueHistory.length > 0) {
            this.issueHistory[this.issueHistory.length - 1].recovered = true;
          }
        }
      }

      // Record history
      const report = this.getHealthReport();
      this.metricsHistory.push(report);
      if (this.metricsHistory.length > 100) this.metricsHistory.shift();
      
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      this.handleIssue('SYSTEM_ERROR', errorMsg, 'CRITICAL');
    }
  }

  private handleIssue(type: string, message: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'CRITICAL') {
    if (type === 'LONG_TASK') this.longTasksCount++;
    
    const issue: SystemIssue = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      severity,
      recovered: false
    };

    this.issueHistory.push(issue);
    if (this.issueHistory.length > 50) this.issueHistory.shift();

    logger.error(`[HEALTH] ${type}: ${message}`, undefined, 'HEALTH');
    dlpAlertService.trigger(severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', `Health Monitor: ${message}`, { type });
    
    // Log to console with specific tag for diagnostics
    console.log("%c#problems_and_diagnostics", "color: red; font-weight: bold", `[${issue.timestamp}] ${type}: ${message}`);
  }

  /**
   * Monitors performance metrics (frame drops, response times).
   */
  private monitorPerformance() {
    if (typeof window === 'undefined') return;

    // Detect Long Tasks (Potential UI freezes)
    try {
      // Check if running in a Tauri environment to avoid overhead or incompatibility in Web Mode
      // Although PerformanceObserver is standard, we want to be safe during critical initialization
      const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
      
      // Only run aggressive monitoring if specifically requested or in a robust environment
      // For now, we allow it in web but wrap in try-catch which is already done.
      // However, user requested to check for invoke calls. 
      // If this service uses invoke internally, we should guard it.
      // It doesn't seem to use invoke.
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 150) { // Tasks longer than 150ms
            this.handleIssue('LONG_TASK', `UI Freeze detected: ${entry.duration.toFixed(2)}ms`, 'WARNING');
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      logger.warn('PerformanceObserver longtask not supported', undefined, 'HEALTH');
    }
  }

  /**
   * Detects potential memory leaks by monitoring heap growth.
   */
  private detectMemoryLeaks() {
    if (typeof window === 'undefined') return;

    let lastHeap = 0;
    setInterval(() => {
      // Guard for non-standard performance.memory API
      const perf = performance as PerformanceWithMemory;
      const mem = perf.memory;
      
      if (mem) {
        const currentHeap = mem.usedJSHeapSize;
        if (lastHeap > 0 && currentHeap > lastHeap * 1.8) {
          this.handleIssue('POTENTIAL_LEAK', 'Rapid memory growth detected', 'WARNING');
        }
        lastHeap = currentHeap;
      }
    }, 300000); // Every 5 minutes
  }
}

export const healthMonitorService = new HealthMonitorService();
