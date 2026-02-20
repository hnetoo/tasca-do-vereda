
import { executeQuery, databaseOperations } from '@/services/database/operations';
import { dbConfig } from '@/services/database/config';
import { logger } from '@/services/logger';
// BackupData is defined locally to avoid circular dependencies
import { MenuCategory, Dish, Order, Expense, Revenue, StockItem, Fornecedor, User, Employee, AttendanceRecord } from '@/types';

// We need to define BackupData here or import it from a shared place that is not backupService.ts to avoid circular deps or importing client code.
// Looking at backupService.ts, BackupData uses types from '@/types'.
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
    logger.info('Starting backup import via Server Action...', { version: backup.version }, 'BACKUP');
    
    const report = {
        totalRecords: 0,
        processed: 0,
        errors: [] as string[],
        startTime: Date.now(),
        endTime: 0
    };

    try {
        // Start Transaction
        await executeQuery('BEGIN TRANSACTION');

        // 1. Import Categories
        if (backup.data.categories) {
            for (const cat of backup.data.categories) {
                await databaseOperations.saveCategory(cat);
                report.processed++;
            }
        }

        // 2. Import Menu (Dishes)
        if (backup.data.menu) {
            // Checkpoints every 1000 records
            let count = 0;
            for (const dish of backup.data.menu) {
                await databaseOperations.saveProduct(dish);
                report.processed++;
                count++;
                if (count % 1000 === 0) {
                    logger.info(`Checkpoint: Processed ${count} dishes`, {}, 'BACKUP');
                }
            }
        }

        // 3. Import Orders (and Order Items)
        if (backup.data.orders) {
            let count = 0;
            for (const order of backup.data.orders) {
                await databaseOperations.saveOrder(order);
                report.processed++;
                count++;
                if (count % 1000 === 0) {
                        logger.info(`Checkpoint: Processed ${count} orders`, {}, 'BACKUP');
                }
            }
        }
        
        // 4. Import Financials (Revenues/Expenses)
        if (backup.data.expenses) {
                for (const exp of backup.data.expenses) {
                    await databaseOperations.saveExpense(exp);
                    report.processed++;
                }
        }
        
        if (backup.data.revenues) {
                for (const rev of backup.data.revenues) {
                    await databaseOperations.saveRevenue(rev);
                    report.processed++;
                }
        }

        // Commit Transaction
        await executeQuery('COMMIT');
        
        report.endTime = Date.now();
        logger.info('Backup import completed successfully', report, 'BACKUP');
        
        // Trigger Cloud Sync if enabled - we can't easily access client-side service here.
        // But we can return a flag to tell the client to sync.
        
        return { success: true, report };

    } catch (error: any) {
        // Rollback Transaction
        await executeQuery('ROLLBACK');
        logger.error('Backup import failed, rolled back', { error: error.message }, 'BACKUP');
        report.errors.push(error.message);
        report.endTime = Date.now();
        return { success: false, report };
    }
}
