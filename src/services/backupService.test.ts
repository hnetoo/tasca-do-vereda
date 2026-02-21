import { BackupService, CURRENT_BACKUP_VERSION } from '../services/backupService';
import { logger } from '@/services/logger';
import { LocalStorage } from '@/services/localStorage';
import { BackupData } from '@/types';

// Mock dependencies
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/services/localStorage', () => ({
  LocalStorage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('BackupService', () => {
  let backupService: BackupService;

  beforeEach(() => {
    backupService = new BackupService();
    jest.clearAllMocks();
  });

  describe('migrateSchema', () => {
    it('should return the same data if backup version matches current version', () => {
      const mockBackup: BackupData = {
        version: CURRENT_BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        source: 'test',
        data: {
          categories: [],
          dishes: [],
          orders: [],
          finances: [],
          menu: [],
        },
      };
      const migratedData = (backupService as any).migrateSchema(mockBackup);
      expect(migratedData).toEqual(mockBackup);
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should migrate schema from 1.0 to 2.0, converting pratos to menu', () => {
      const oldBackup: any = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'test',
        data: {
          categories: [],
          pratos: [
            { id: 'p1', nome: 'Prato 1', preco: 10, descricao: 'Desc 1', categoria_id: 'c1', disponivel: true },
            { id: 'p2', name: 'Prato 2', price: 15, description: 'Desc 2', category_id: 'c2', available: false },
          ],
          orders: [],
          finances: [],
        },
      };

      const expectedMenu = [
        { id: 'p1', name: 'Prato 1', price: 10, description: 'Desc 1', category_id: 'c1', available: true },
        { id: 'p2', name: 'Prato 2', price: 15, description: 'Desc 2', category_id: 'c2', available: false },
      ];

      const migratedData = (backupService as any).migrateSchema(oldBackup);

      expect(migratedData.version).toBe(CURRENT_BACKUP_VERSION);
      expect(migratedData.data.menu).toEqual(expectedMenu);
      expect(migratedData.data.pratos).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        `Migrating backup from version 1.0 to ${CURRENT_BACKUP_VERSION}`,
        {},
        'BACKUP'
      );
    });

    it('should handle missing pratos during migration from 1.0 to 2.0', () => {
      const oldBackup: any = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'test',
        data: {
          categories: [],
          orders: [],
          finances: [],
        },
      };

      const migratedData = (backupService as any).migrateSchema(oldBackup);

      expect(migratedData.version).toBe(CURRENT_BACKUP_VERSION);
      expect(migratedData.data.menu).toEqual([]);
      expect(migratedData.data.pratos).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        `Migrating backup from version 1.0 to ${CURRENT_BACKUP_VERSION}`,
        {},
        'BACKUP'
      );
    });

    it('should not migrate if backup version is newer than current version (future proofing)', () => {
      const futureBackup: BackupData = {
        version: '99.0',
        timestamp: new Date().toISOString(),
        source: 'test',
        data: {
          categories: [],
          dishes: [],
          orders: [],
          finances: [],
          menu: [],
        },
      };
      const migratedData = (backupService as any).migrateSchema(futureBackup);
      expect(migratedData).toEqual(futureBackup);
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other BackupService methods here
});
