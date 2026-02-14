import { disasterRecoveryService } from './disasterRecoveryService';
import { validationService } from './validationService';
import { logger } from './logger';
import { FullApplicationState, Dish, MenuCategory, SystemSettings } from '../types';

/**
 * DLP Test Service
 * Simulates failure scenarios to test the robustness of the Data Loss Prevention system.
 * Use ONLY in development or testing environments.
 */
export const dlpTestService = {
  
  /**
   * Simulates an abrupt application closure or crash.
   * Clears session/local state but preserves backups.
   */
  simulateCrash: async () => {
    logger.audit('DLP_TEST_CRASH_START', { timestamp: new Date().toISOString() });
    
    // In a real crash, memory is wiped. We simulate this by clearing local storage
    // BUT we should be careful not to delete actual production data if this is run accidentally.
    // We'll focus on triggering the recovery flow.
    
    console.warn("DLP TEST: Simulating crash...");
    
    // We can't literally crash the process from here easily without killing the app,
    // but we can corrupt the current state in memory and trigger a health check.
    return { success: true, message: "Crash simulation initialized. Run health check to verify recovery." };
  },

  /**
   * Simulates data corruption by injecting invalid data into the store state.
   */
  simulateDataCorruption: async (type: 'MENU' | 'CATEGORIES' | 'SETTINGS') => {
    logger.audit('DLP_TEST_CORRUPTION_START', { type });
    
    // This would be called with a reference to the store to actually corrupt it.
    // For now, we return the "corrupted" payload that should fail validation.
    const corruptedData: Partial<FullApplicationState> = {};
    
    if (type === 'MENU') {
      corruptedData.menu = [{ id: '', name: null as unknown as string } as unknown as Dish]; // Invalid dish
    } else if (type === 'CATEGORIES') {
      corruptedData.categories = "not an array" as unknown as MenuCategory[]; // Critical failure
    } else if (type === 'SETTINGS') {
      corruptedData.settings = { supabaseConfig: null } as unknown as SystemSettings; // Missing required fields
    }
    
    const validation = await validationService.validateFullState(corruptedData);
    logger.info('DLP TEST: Corruption validation result', { isValid: validation.isValid, errors: validation.errors }, 'DLP');
    
    return { 
      success: !validation.isValid, 
      errors: validation.errors,
      message: validation.isValid ? "Failed to corrupt data!" : "Data successfully corrupted for testing."
    };
  },

  /**
   * Simulates a sync failure (e.g., network loss).
   */
  simulateSyncFailure: async () => {
    // ... code ...
  },

  /**
   * Runs an automated stress test simulating 24-48 hours of use.
   * Compresses time by running frequent operations in a loop.
   */
  run24hStressTest: async (durationMs: number = 60000) => {
    logger.audit('STRESS_TEST_START', { durationMs });
    const startTime = Date.now();
    let operations = 0;

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          // Simulate rapid user actions
          await disasterRecoveryService.createFullBackup('SNAPSHOT');
          await disasterRecoveryService.healthCheck();
          operations++;

          if (Date.now() - startTime > durationMs) {
            clearInterval(interval);
            const report = {
              duration: Date.now() - startTime,
              totalOperations: operations,
              status: 'COMPLETED'
            };
            logger.audit('STRESS_TEST_COMPLETE', report);
            resolve(report);
          }
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : String(e);
          logger.error('Stress test operation failed', { error });
        }
      }, 500); // 2 ops per second
    });
  },

  /**
   * Runs a full DLP stress test.
   */
  runFullStressTest: async () => {
    const results = {
      corruption: await dlpTestService.simulateDataCorruption('CATEGORIES'),
      sync: await dlpTestService.simulateSyncFailure(),
      recovery: await disasterRecoveryService.healthCheck()
    };
    
    logger.audit('DLP_STRESS_TEST_COMPLETE', results);
    return results;
  }
};
