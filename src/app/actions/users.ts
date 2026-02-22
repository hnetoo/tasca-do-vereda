'use server';

import { adminOperations } from '@/services/database/adminOperations';
import { Employee } from '@/types';
import { logger } from '@/services/logger';

export async function getEmployeesAction(): Promise<{ success: boolean; data?: Employee[]; error?: string }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.getEmployees();
    if (!result.success) {
      logger.error('Failed to fetch employees via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception fetching employees via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function saveEmployeeAction(employee: Employee): Promise<{ success: boolean; error?: string }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.saveEmployee(employee);
    if (!result.success) {
      logger.error('Failed to save employee via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception saving employee via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}

export async function deleteEmployeeAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Uses admin operations to bypass RLS/Auth issues
    const result = await adminOperations.deleteEmployee(id);
    if (!result.success) {
      logger.error('Failed to delete employee via server action', { error: result.error }, 'SERVER_ACTION');
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error('Exception deleting employee via server action', { error: errorMessage }, 'SERVER_ACTION');
    return { success: false, error: errorMessage };
  }
}
