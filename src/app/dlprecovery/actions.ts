import { 
    BackupMetadata, 
    DLPComplianceReport, 
    disasterRecoveryService 
} from '@/services/disasterRecoveryService';

export async function listBackupsAction(): Promise<BackupMetadata[]> {
    return disasterRecoveryService.listBackups();
}

export async function generateComplianceReportAction(): Promise<DLPComplianceReport | null> {
    return disasterRecoveryService.generateComplianceReport();
}

export async function restoreSystemAction(id: string): Promise<boolean> {
    return disasterRecoveryService.restoreSystem(id);
}

export async function createFullBackupAction(type: 'AUTO' | 'MANUAL' | 'SNAPSHOT'): Promise<BackupMetadata | null> {
    return disasterRecoveryService.createFullBackup(type);
}
