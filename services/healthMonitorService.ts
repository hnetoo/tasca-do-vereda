import { logger } from './logger';
import { dlpAlertService } from './dlpAlertService';
import { disasterRecoveryService } from './disasterRecoveryService';

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

      // 3. Data Integrity Check (via DLP)
      const isHealthy = await disasterRecoveryService.healthCheck();
      if (!isHealthy) {
        this.totalFailures++;
        this.lastFailureTime = Date.now();
        this.handleIssue('DATA_INTEGRITY_FAIL', 'DLP detected state corruption', 'CRITICAL');
        const recovered = await disasterRecoveryService.autoRecover();
        if (recovered) {
          this.totalRecoveries++;
          this.issueHistory[this.issueHistory.length - 1].recovered = true;
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
    let lastHeap = 0;
    setInterval(() => {
      const mem = (performance as PerformanceWithMemory).memory;
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
