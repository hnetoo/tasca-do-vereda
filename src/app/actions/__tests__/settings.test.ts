import { getDatabaseConfigAction, saveDatabaseConfigAction } from '../settings';
import { DatabaseConfig } from '@/lib/config-manager';

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock config-manager
jest.mock('@/lib/config-manager', () => ({
  getStoredDatabaseConfig: jest.fn(),
  saveStoredDatabaseConfig: jest.fn(),
}));

const mockGetStoredDatabaseConfig = require('@/lib/config-manager').getStoredDatabaseConfig;
const mockSaveStoredDatabaseConfig = require('@/lib/config-manager').saveStoredDatabaseConfig;

describe('settings server actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDatabaseConfigAction', () => {
    it('should return success with config when getStoredDatabaseConfig is successful', async () => {
      const mockConfig: DatabaseConfig = { type: 'postgres', connectionString: 'test-conn-string' };
      mockGetStoredDatabaseConfig.mockResolvedValue(mockConfig);

      const result = await getDatabaseConfigAction();

      expect(result).toEqual({ success: true, data: mockConfig });
      expect(mockGetStoredDatabaseConfig).toHaveBeenCalledTimes(1);
    });

    it('should return failure with error when getStoredDatabaseConfig throws an error', async () => {
      const errorMessage = 'Failed to get config';
      mockGetStoredDatabaseConfig.mockRejectedValue(new Error(errorMessage));

      const result = await getDatabaseConfigAction();

      expect(result).toEqual({ success: false, error: errorMessage });
      expect(mockGetStoredDatabaseConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveDatabaseConfigAction', () => {
    it('should return success when saveStoredDatabaseConfig is successful', async () => {
      const mockConfig: DatabaseConfig = { type: 'local', connectionString: '' };
      mockSaveStoredDatabaseConfig.mockResolvedValue(undefined);

      const result = await saveDatabaseConfigAction(mockConfig);

      expect(result).toEqual({ success: true });
      expect(mockSaveStoredDatabaseConfig).toHaveBeenCalledTimes(1);
      expect(mockSaveStoredDatabaseConfig).toHaveBeenCalledWith(mockConfig);
    });

    it('should return failure with error when saveStoredDatabaseConfig throws an error', async () => {
      const mockConfig: DatabaseConfig = { type: 'local', connectionString: '' };
      const errorMessage = 'Failed to save config';
      mockSaveStoredDatabaseConfig.mockRejectedValue(new Error(errorMessage));

      const result = await saveDatabaseConfigAction(mockConfig);

      expect(result).toEqual({ success: false, error: errorMessage });
      expect(mockSaveStoredDatabaseConfig).toHaveBeenCalledTimes(1);
      expect(mockSaveStoredDatabaseConfig).toHaveBeenCalledWith(mockConfig);
    });
  });
});
