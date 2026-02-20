

import { disasterRecoveryService } from '@/services/disasterRecoveryService';
import { dlpAlertService } from '@/services/dlpAlertService';
import { logger } from '@/services/logger';
import { SystemIssue } from '@/services/healthMonitorService';

interface PerformSelfCheckResult {
  isHealthy: boolean;
  recovered: boolean;
  issue?: SystemIssue;
}

export async function performSelfCheckAction(
  totalFailures: number,
  totalRecoveries: number,
  issueHistory: SystemIssue[]
): Promise<PerformSelfCheckResult> {
  let currentTotalFailures = totalFailures;
  let currentTotalRecoveries = totalRecoveries;
  let currentIssueHistory = [...issueHistory];
  let issue: SystemIssue | undefined;
  let recovered = false;

  try {
    // 1. Check for Deadlocks / Event Loop lag - This part is client-side specific (performance.now, setTimeout)
    // and cannot be directly moved to a server action. We will assume this check is handled client-side
    // or will be refactored to be triggered by the client.

    // 2. Memory Check - This is also client-side specific (performance.memory)
    // and cannot be directly moved to a server action.

    // 3. Data Integrity Check (via DLP)
    const isHealthy = await disasterRecoveryService.healthCheck();
    if (!isHealthy) {
      currentTotalFailures++;
      const newIssue: SystemIssue = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: 'DATA_INTEGRITY_FAIL',
        message: 'DLP detected state corruption',
        severity: 'CRITICAL',
        recovered: false
      };
      currentIssueHistory.push(newIssue);
      issue = newIssue;

      const autoRecovered = await disasterRecoveryService.autoRecover();
      if (autoRecovered) {
        currentTotalRecoveries++;
        if (currentIssueHistory.length > 0) {
          currentIssueHistory[currentIssueHistory.length - 1].recovered = true;
        }
        recovered = true;
      }
      
      logger.error(`[HEALTH] DATA_INTEGRITY_FAIL: DLP detected state corruption`, undefined, 'HEALTH');
      dlpAlertService.trigger('CRITICAL', `Health Monitor: DLP detected state corruption`, { type: 'DATA_INTEGRITY_FAIL' });
    }

    return {
      isHealthy,
      recovered,
      issue
    };

  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    const newIssue: SystemIssue = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type: 'SYSTEM_ERROR',
      message: errorMsg,
      severity: 'CRITICAL',
      recovered: false
    };
    currentIssueHistory.push(newIssue);
    issue = newIssue;

    logger.error(`[HEALTH] SYSTEM_ERROR: ${errorMsg}`, undefined, 'HEALTH');
    dlpAlertService.trigger('CRITICAL', `Health Monitor: ${errorMsg}`, { type: 'SYSTEM_ERROR' });

    return {
      isHealthy: false,
      recovered: false,
      issue
    };
  }
}
