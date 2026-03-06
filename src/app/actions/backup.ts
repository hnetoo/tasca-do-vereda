
import { executeQuery, databaseOperations } from '@/services/database/operations';
import { dbConfig } from '@/services/database/config';
import { logger } from '@/services/logger';
import { CURRENT_BACKUP_VERSION } from '@/services/backupService';
// BackupData is defined locally to avoid circular dependencies
import { MenuCategory, Dish, Order, Expense, Revenue, StockItem, Fornecedor, User, Employee, AttendanceRecord } from '@/types';

// We need to define BackupData here or import it from a shared place that is not backupService.ts to avoid circular deps or importing client code.
// Looking at backupService.ts, BackupData uses types from '@/types'.

// Import server client for executeQuery
import { createClient } from '@/lib/supabase/server';
// Let's copy the interface for now to be safe, or check if it's exported from types.
// The file backupService.ts exports it.

export interface BackupData {
    version: string;
    timestamp: string;
    checksum?: string;
    source: 'tasca-do-vereda-system';
    data: {
        menu?: Dish[];
        categories?: MenuCategory[];
        orders?: Order[];
        expenses?: Expense[];
        revenues?: Revenue[];
        users?: User[];
        employees?: Employee[];
        attendance?: AttendanceRecord[];
        stock?: StockItem[];
        suppliers?: Fornecedor[];
        settings?: any;
        [key: string]: any;
    };
}

export async function importBackupAction(backup: BackupData): Promise<{ success: boolean; report: any }> {
    logger.info('Starting backup import via Server Action...', { version: backup.version, currentVersion: CURRENT_BACKUP_VERSION }, 'BACKUP');
    
    const report = {
        totalRecords: 0,
        processed: 0,
        errors: [] as string[],
        startTime: Date.now(),
        endTime: 0
    };

    // Version validation
    if (backup.version && backup.version > CURRENT_BACKUP_VERSION) {
        const errorMessage = `Backup version (${backup.version}) is newer than current system version (${CURRENT_BACKUP_VERSION}). Import aborted to prevent data corruption.`;
        logger.error(errorMessage, {}, 'BACKUP');
        report.errors.push(errorMessage);
        report.endTime = Date.now();
        return { success: false, report };
    }

    try {
        // Get server client
        const supabase = await createClient();
        
        // Start Transaction
        await executeQuery(supabase, 'BEGIN TRANSACTION');

        // 1. Import Categories
        if (backup.data.categories && backup.data.categories.length > 0) {
            logger.info(`Importing ${backup.data.categories.length} categories...`, {}, 'BACKUP');
            for (const cat of backup.data.categories) {
                await databaseOperations.saveCategory(cat);
                report.processed++;
            }
            logger.info(`Finished importing ${backup.data.categories.length} categories.`, {}, 'BACKUP');
        }

        // 2. Import Menu (Dishes)
        if (backup.data.menu && backup.data.menu.length > 0) {
            logger.info(`Importing ${backup.data.menu.length} dishes...`, {}, 'BACKUP');
            let count = 0;
            for (const dish of backup.data.menu) {
                await databaseOperations.saveProduct(dish);
                report.processed++;
                count++;
                if (count % 1000 === 0) {
                    logger.info(`Checkpoint: Processed ${count} dishes`, {}, 'BACKUP');
                }
            }
            logger.info(`Finished importing ${backup.data.menu.length} dishes.`, {}, 'BACKUP');
        }

        // 3. Import Orders (and Order Items)
        if (backup.data.orders && backup.data.orders.length > 0) {
            logger.info(`Importing ${backup.data.orders.length} orders...`, {}, 'BACKUP');
            let count = 0;
            for (const order of backup.data.orders) {
                await databaseOperations.saveOrder(order);
                report.processed++;
                count++;
                if (count % 1000 === 0) {
                        logger.info(`Checkpoint: Processed ${count} orders`, {}, 'BACKUP');
                }
            }
            logger.info(`Finished importing ${backup.data.orders.length} orders.`, {}, 'BACKUP');
        }
        
        // 4. Import Financials (Revenues/Expenses)
        if (backup.data.expenses && backup.data.expenses.length > 0) {
                logger.info(`Importing ${backup.data.expenses.length} expenses...`, {}, 'BACKUP');
                for (const exp of backup.data.expenses) {
                    await databaseOperations.saveExpense(exp);
                    report.processed++;
                }
                logger.info(`Finished importing ${backup.data.expenses.length} expenses.`, {}, 'BACKUP');
        }
        
        if (backup.data.revenues && backup.data.revenues.length > 0) {
                logger.info(`Importing ${backup.data.revenues.length} revenues...`, {}, 'BACKUP');
                for (const rev of backup.data.revenues) {
                    await databaseOperations.saveRevenue(rev);
                    report.processed++;
                }
                logger.info(`Finished importing ${backup.data.revenues.length} revenues.`, {}, 'BACKUP');
        }

        // Commit Transaction
        await executeQuery(supabase, 'COMMIT');
        
        report.endTime = Date.now();
        logger.info('Backup import completed successfully', report, 'BACKUP');
        
        // Trigger Cloud Sync if enabled - we can't easily access client-side service here.
        // But we can return a flag to tell client to sync.
        
        return { success: true, report };

    } catch (error: any) {
        // Rollback Transaction - need to get client again for catch block
        try {
            const supabase = await createClient();
            await executeQuery(supabase, 'ROLLBACK');
        } catch (rollbackError: any) {
            logger.error('Failed to rollback transaction', { error: rollbackError.message }, 'BACKUP');
        }
        
        logger.error('Backup import failed, rolled back', { error: error.message }, 'BACKUP');
        report.errors.push(error.message);
        report.endTime = Date.now();
        return { success: false, report };
    }
}
