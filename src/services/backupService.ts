import { StoreState, Dish, MenuCategory, Order, Expense, Revenue, User, Employee, AttendanceRecord, StockItem, Fornecedor, FinancialBackupData } from '../types';
export type { FinancialBackupData };
import { logger } from './logger';
import { integrationAPIService } from './integrationAPIService';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { calculateHash } from '@/utils/crypto';


export const AUTO_BACKUP_KEY = 'tasca_auto_backup_v1';
export const FINANCIAL_BACKUP_KEY = 'tasca_financial_backup_v1';

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

export class BackupService {
    
    async saveToLocalFile(content: string, filename: string): Promise<string> {
        try {
            if (isTauri()) {
                const path = await invoke<string>('save_backup_file', { content, filename });
                logger.info(`Backup saved locally to: ${path}`, {}, 'BACKUP');
                return path;
            } else {
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                return 'browser-download';
            }
        } catch (error: any) {
             logger.error('Failed to save local backup', { error: error.message }, 'BACKUP');
             throw error;
        }
    }

    async readLocalFile(filepath: string): Promise<string> {
        try {
            if (isTauri()) {
                return await invoke<string>('read_backup_file', { filepath });
            }
            throw new Error('Not supported in browser mode');
        } catch (error: any) {
            logger.error('Failed to read local backup', { error: error.message }, 'BACKUP');
            throw error;
        }
    }

    /**
     * Restore from a local backup file
     */
    async restoreFromLocalFile(filepath: string): Promise<{ success: boolean; data: any }> {
        try {
            logger.info(`Restoring from local file: ${filepath}`, {}, 'BACKUP');
            
            // 1. Read file content
            const content = await this.readLocalFile(filepath);
            
            // 2. Determine format (assume JSON for now, but could be inferred from extension)
            const format = filepath.toLowerCase().endsWith('.csv') ? 'csv' : 
                           filepath.toLowerCase().endsWith('.xml') ? 'xml' : 'json';
            
            // 3. Parse content
            const backupData = await this.parseBackup(content, format);
            
            if (!backupData) {
                throw new Error('Failed to parse backup data');
            }
            
            // 4. Return data for server action to import
            return { success: true, data: backupData };
            
        } catch (error: any) {
            logger.error('Failed to restore from local file', { error: error.message, filepath }, 'BACKUP');
            throw error;
        }
    }

    /**
     * Load auto backup categories
     */
    loadAutoBackup(): { categories: MenuCategory[] } {
        try {
            const raw = localStorage.getItem(AUTO_BACKUP_KEY);
            if (!raw) return { categories: [] };
            const data = JSON.parse(raw);
            return { categories: data.data || [] };
        } catch {
            return { categories: [] };
        }
    }

    /**
     * Load manual backup categories (fallback)
     */
    loadBackup(): { categories: MenuCategory[] } {
        try {
            const raw = localStorage.getItem(FINANCIAL_BACKUP_KEY);
            if (!raw) return { categories: [] };
            const data = JSON.parse(raw);
            return { categories: data.menu?.categories || [] };
        } catch {
            return { categories: [] };
        }
    }

    /**
     * Save only financial data
     */
    async saveFinancialBackup(data: FinancialBackupData): Promise<boolean> {
        try {
            const backupPackage = {
                metadata: {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    totals: this.calculateFinancialTotals(data),
                    checksum: await this.generateChecksum({ financial: data })
                },
                financial: data
            };
            
            localStorage.setItem(FINANCIAL_BACKUP_KEY, JSON.stringify(backupPackage));
            return true;
        } catch (error: any) {
            logger.error('Failed to save financial backup', { error: error.message }, 'BACKUP');
            return false;
        }
    }

    /**
     * Load only financial data
     */
    async loadFinancialBackup(): Promise<FinancialBackupData | null> {
        try {
            const raw = localStorage.getItem(FINANCIAL_BACKUP_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            return data.financial || null;
        } catch (error: any) {
            logger.error('Failed to load financial backup', { error: error.message }, 'BACKUP');
            return null;
        }
    }

    /**
     * Parse backup file content based on format
     */
    async parseBackup(content: string, format: 'json' | 'csv' | 'xml'): Promise<BackupData | null> {
        try {
            switch (format) {
                case 'json':
                    return this.parseJSON(content);
                case 'csv':
                    return this.parseCSV(content);
                case 'xml':
                    return this.parseXML(content);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error: any) {
            logger.error('Backup parse failed', { error: error.message, format }, 'BACKUP');
            throw error;
        }
    }

    private parseJSON(content: string): BackupData {
        const parsed = JSON.parse(content);
        // Basic validation
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON content');
        }
        
        // Migrate old schema if needed
        return this.migrateSchema(parsed);
    }

    private parseCSV(content: string): BackupData {
        // Simple CSV parser - assumes header row and comma separator
        // This is a generic parser, result structure depends on content
        // For full system backup, CSV is not ideal. Assuming this is for Menu/Inventory import.
        // We'll return a structure with 'items' or similar.
        
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV must have header and data');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => {
                obj[h] = values[i];
            });
            return obj;
        });

        // Heuristic to detect what data this is
        // If headers contain 'price', 'category_id', likely Dish
        // If 'nif', 'nome', likely Supplier/User
        
        const result: BackupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            source: 'tasca-do-vereda-system',
            data: {}
        };

        if (headers.includes('price') && headers.includes('name')) {
            result.data.menu = data as Dish[];
        } else if (headers.includes('icon') && headers.includes('name')) {
            result.data.categories = data as MenuCategory[];
        } else if (headers.includes('amount') && headers.includes('description')) {
            // Could be Expense or Revenue
            result.data.expenses = data as Expense[]; // Default assumption
        } else {
             result.data.generic = data;
        }

        return result;
    }

    private parseXML(content: string): BackupData {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Error parsing XML");
        }

        // Generic XML to JSON
        const result: BackupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            source: 'tasca-do-vereda-system',
            data: {}
        };

        // Implementation would depend on XML structure. 
        // Assuming <backup><menu><dish>...</dish></menu></backup> structure
        
        const menuNodes = xmlDoc.getElementsByTagName("dish");
        if (menuNodes.length > 0) {
            result.data.menu = Array.from(menuNodes).map(node => {
                const dish: any = {};
                Array.from(node.children).forEach(child => {
                    dish[child.nodeName] = child.textContent;
                });
                return dish;
            });
        }
        
        // ... similar for other types
        
        return result;
    }

    private migrateSchema(data: any): BackupData {
        // Mapping dynamic schema old -> new
        const migrated: BackupData = {
            version: '2.0', // Target version
            timestamp: data.timestamp || new Date().toISOString(),
            source: 'tasca-do-vereda-system',
            data: { ...data.data }
        };

        // Example migration: 'pratos' -> 'menu'
        if (data.data?.pratos && !data.data.menu) {
            migrated.data.menu = data.data.pratos.map((p: any) => ({
                id: p.id,
                name: p.nome || p.name,
                price: p.preco || p.price,
                description: p.descricao || p.description,
                category_id: p.categoria_id || p.category_id,
                // ... map other fields
                available: p.disponivel !== false
            }));
        }

        return migrated;
    }



    /**
     * Calculate totals for financial reconciliation
     */
    calculateFinancialTotals(data: FinancialBackupData) {
        const revenue = (data.orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0) + 
                       (data.revenues || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
        
        const expense = (data.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0) +
                       (data.payroll || []).reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
                       
        return {
            revenue,
            expense,
            ordersCount: (data.orders || []).length
        };
    }

    /**
     * Generate checksum for data integrity
     */
    async generateChecksum(data: any): Promise<string> {
        return await calculateHash(JSON.stringify(data));
    }

    /**
     * Save full backup to local storage (browser/app cache)
     */
    async saveFullBackup(
        categories: MenuCategory[],
        dishes: Dish[],
        financialData: FinancialBackupData,
        userId: string
    ): Promise<boolean> {
        try {
            const totals = this.calculateFinancialTotals(financialData);
            
            // Create backup package
            const backupPackage = {
                metadata: {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    userId,
                    totals,
                    checksum: '' // placeholder
                },
                financial: financialData,
                menu: {
                    categories,
                    dishes
                }
            };
            
            // Generate checksum of content (excluding metadata checksum itself)
            const contentHash = await this.generateChecksum({
                financial: financialData,
                menu: { categories, dishes }
            });
            
            backupPackage.metadata.checksum = contentHash;
            
            const key = 'tasca_financial_backup_v1';
            localStorage.setItem(key, JSON.stringify(backupPackage));
            
            logger.info('Full financial backup saved to local storage', { totals }, 'BACKUP');
            return true;
        } catch (error: any) {
            logger.error('Failed to save full backup', { error: error.message }, 'BACKUP');
            return false;
        }
    }

    /**
     * Load full backup from local storage
     */
    async loadFullBackup(): Promise<any | null> {
        try {
            const key = FINANCIAL_BACKUP_KEY;
            const raw = localStorage.getItem(key);
            
            if (!raw) return null;
            
            const backupPackage = JSON.parse(raw);
            
            // Verify checksum
            const currentHash = await this.generateChecksum({
                financial: backupPackage.financial,
                menu: backupPackage.menu
            });
            
            if (currentHash !== backupPackage.metadata.checksum) {
                logger.warn('Backup checksum mismatch! Data may be corrupted.', {}, 'BACKUP');
                return null;
            }
            
            // Re-verify totals
            const currentTotals = this.calculateFinancialTotals(backupPackage.financial);
            if (
                currentTotals.revenue !== backupPackage.metadata.totals.revenue ||
                currentTotals.expense !== backupPackage.metadata.totals.expense
            ) {
                 logger.warn('Backup totals mismatch! Reconciled totals differ from metadata.', {
                     stored: backupPackage.metadata.totals,
                     calculated: currentTotals
                 }, 'BACKUP');
                 // We return it but with warning logged
            }
            
            return backupPackage;
        } catch (error: any) {
            logger.error('Failed to load full backup', { error: error.message }, 'BACKUP');
            return null;
        }
    }

    /**
     * Auto backup for critical menu data (Categories/Dishes)
     */
    autoBackup(categories: MenuCategory[], dishes: Dish[]): void {
        try {
            if (!categories || categories.length === 0) return;

            const validCategories = categories.filter(c => c.id && c.name);
            const validDishes = dishes.filter(d => d.id && d.name);

            const backupData = {
                timestamp: new Date().toISOString(),
                data: validCategories,
                dishes: validDishes,
                count: validCategories.length
            };

            localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backupData));
        } catch (error: any) {
            console.error('Auto backup failed:', error);
        }
    }

    /**
     * Check integrity of current categories against backup
     */
    checkIntegrity(currentCategories: MenuCategory[], currentDishes: Dish[]): { status: 'OK' | 'EMPTY' | 'CORRUPTED', suggestedCategories?: MenuCategory[] } {
        try {
            const rawBackup = localStorage.getItem(AUTO_BACKUP_KEY);
            if (!rawBackup) {
                return { status: 'OK' };
            }

            const backup = JSON.parse(rawBackup);
            const backupCategories = backup.data || [];

            if (currentCategories.length === 0 && backupCategories.length > 0) {
                return { status: 'EMPTY', suggestedCategories: backupCategories };
            }

            // Simple heuristic: if we lost more than 80% of categories compared to backup
            if (backupCategories.length > 5 && currentCategories.length < (backupCategories.length * 0.2)) {
                return { status: 'CORRUPTED', suggestedCategories: backupCategories };
            }

            return { status: 'OK' };
        } catch (error) {
            return { status: 'OK' }; // Fail safe
        }
    }
}


export const backupService = new BackupService();
