import { MenuCategory, AuditLog } from "../types";
import { logger } from "./logger";
import { backupService } from "./backupService";
import { exportToPDF } from "./exportService";

export interface RecoveredItem {
    category: MenuCategory;
    source: 'AUDIT_LOG' | 'LOCAL_BACKUP' | 'CLOUD_BACKUP';
    timestamp: string;
}

export const recoveryService = {
    /**
     * Scans all available historical sources to find deleted categories
     */
    scanForDeletedCategories: async (auditLogs: AuditLog[] = []): Promise<RecoveredItem[]> => {
        try {
            const foundItems: Map<string, RecoveredItem> = new Map();

        // 1. Scan Audit Logs
        auditLogs.forEach(log => {
            if (log.action === 'CATEGORY_DELETED' && log.metadata?.category) {
                const cat = log.metadata.category;
                foundItems.set(cat.id, {
                    category: cat,
                    source: 'AUDIT_LOG',
                    timestamp: (log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp) || new Date().toISOString()
                });
            }
        });

        // 2. Scan Local Backups
        const localAuto = backupService.loadAutoBackup();
        const localManual = backupService.loadBackup();
        
        [...(localAuto.categories || []), ...(localManual.categories || [])].forEach(cat => {
            if (!foundItems.has(cat.id)) {
                foundItems.set(cat.id, {
                    category: cat,
                    source: 'LOCAL_BACKUP',
                    timestamp: 'Desconhecido (Backup Local)'
                });
            }
        });

        // 3. Cloud Backups removed


        logger.info('Scan de categorias eliminadas concluído', { foundCount: foundItems.size }, 'RECOVERY');

        return Array.from(foundItems.values());
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('Erro ao fazer scan de categorias eliminadas', { error: error.message }, 'RECOVERY');
        return [];
    }
    },

    /**
     * Validates if a recovered category is safe to restore
     */
    validateIntegrity: (category: MenuCategory, currentCategories: MenuCategory[]): boolean => {
        if (!category.id || !category.name) return false;
        
        // Check for name collision
        const nameConflict = currentCategories.some(c => 
            c.name.toLowerCase() === category.name.toLowerCase() && c.id !== category.id
        );
        
        if (nameConflict) return false;

        return true;
    },

    /**
     * Generates a PDF report of recovered items
     */
    generateRecoveryReport: async (recoveredItems: RecoveredItem[]) => {
        try {
            if (recoveredItems.length === 0) return;

        await exportToPDF({
            fileName: `relatorio_recuperacao_${new Date().getTime()}`,
            title: 'Relatório de Recuperação de Categorias',
            columns: [
                { header: 'ID', dataKey: 'id' },
                { header: 'Nome', dataKey: 'name' },
                { header: 'Origem', dataKey: 'source' },
                { header: 'Data/Hora', dataKey: 'timestamp' }
            ],
            data: recoveredItems.map(item => ({
                id: item.category.id,
                name: item.category.name,
                source: item.source,
                timestamp: item.timestamp
            }))
        });
        logger.info('Relatório de recuperação gerado com sucesso', { itemCount: recoveredItems.length }, 'RECOVERY');
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('Erro ao gerar relatório de recuperação', { error: error.message }, 'RECOVERY');
    }
    }
};
