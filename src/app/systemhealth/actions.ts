import { healthMonitorService, SystemHealthReport, SystemIssue } from '@/services/healthMonitorService';
import { disasterRecoveryService, StateSnapshot } from '@/services/disasterRecoveryService';
import { agtService } from '@/services/agtService';
import { Order, SystemSettings, Dish } from '@/types'; // Assumindo que ActiveOrder, SystemSettings e Menu são tipos globais ou de um arquivo de tipos

export async function getHealthReportAction(): Promise<SystemHealthReport> {
  return healthMonitorService.getHealthReport();
}

export async function getMetricsHistoryAction(): Promise<SystemHealthReport[]> {
  return healthMonitorService.getMetricsHistory();
}

export async function getIssueHistoryAction(): Promise<SystemIssue[]> {
  return healthMonitorService.getIssueHistory();
}

export async function listSnapshotsAction(): Promise<StateSnapshot[]> {
  return disasterRecoveryService.listSnapshots();
}

export async function createSnapshotAction(label: string): Promise<void> {
  await disasterRecoveryService.createSnapshot(label);
}

export async function restoreToPointInTimeAction(id: string): Promise<boolean> {
  return disasterRecoveryService.restoreToPointInTime(id);
}

export async function generateNewKeyPairAction(): Promise<{ publicKey: string; privateKey: string }> {
  return agtService.generateNewKeyPair();
}

export async function simulateSaftExportAndValidateChainingAction(
  activeOrders: Order[],
  privateKey: string,
  settings: SystemSettings,
  menu: Dish[]
): Promise<{ auditLog: string[]; isValid: boolean; errors: string[] }> {
  const result = await agtService.simulateSaftExportAndValidateChaining(activeOrders, privateKey, settings, menu);
  return {
    auditLog: result.auditLog,
    isValid: result.isValid,
    errors: result.errors
  };
}
