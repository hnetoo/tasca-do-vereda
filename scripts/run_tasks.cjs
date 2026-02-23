const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Logger configuration
const LOG_FILE = path.join(__dirname, '../task_execution.log');
const REPORT_FILE = path.join(__dirname, '../task_report.md');

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Task Runner Class
class TaskRunner {
  constructor() {
    this.tasks = [];
    this.results = [];
  }

  addTask(name, command, description) {
    this.tasks.push({ name, command, description });
  }

  async run() {
    log('Starting automated task execution...', 'START');
    const startTime = Date.now();

    for (const task of this.tasks) {
      let attempts = 0;
      let success = false;
      let errorMsg = '';

      log(`Executing Task: ${task.name}`, 'TASK_START');

      while (attempts < 3 && !success) {
        attempts++;
        try {
          log(`Attempt ${attempts} for ${task.name}...`, 'ATTEMPT');
          const { stdout, stderr } = await execPromise(task.command, { cwd: path.join(__dirname, '..') });
          if (stderr && !stderr.includes('Debugger attached')) {
             log(`Stderr output: ${stderr}`, 'WARNING');
          }
          log(`Task ${task.name} completed successfully.`, 'SUCCESS');
          success = true;
        } catch (error) {
          errorMsg = error.message;
          log(`Task ${task.name} failed on attempt ${attempts}: ${errorMsg}`, 'ERROR');
          if (attempts < 3) {
            log(`Retrying ${task.name} in 2 seconds...`, 'RETRY');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      this.results.push({
        name: task.name,
        description: task.description,
        status: success ? 'SUCCESS' : 'FAILED',
        attempts,
        error: success ? null : errorMsg
      });

      if (!success) {
        log(`Task ${task.name} failed permanently.`, 'FAILURE');
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    log(`All tasks execution completed in ${duration}s.`, 'END');
    
    this.generateReport(duration);
  }

  generateReport(duration) {
    let report = `# Automated Task Execution Report\n\n`;
    report += `**Date:** ${new Date().toLocaleString()}\n`;
    report += `**Total Duration:** ${duration.toFixed(2)} seconds\n`;
    report += `**Total Tasks:** ${this.tasks.length}\n`;
    report += `**Success Rate:** ${this.results.filter(r => r.status === 'SUCCESS').length}/${this.tasks.length}\n\n`;

    report += `## Task Summary\n\n`;
    report += `| Task | Status | Attempts | Description |\n`;
    report += `|------|--------|----------|-------------|\n`;

    this.results.forEach(result => {
      const icon = result.status === 'SUCCESS' ? '✅' : '❌';
      report += `| ${result.name} | ${icon} ${result.status} | ${result.attempts} | ${result.description} |\n`;
    });

    report += `\n## Detailed Errors (if any)\n\n`;
    this.results.filter(r => r.status === 'FAILED').forEach(result => {
      report += `### ${result.name}\n`;
      report += `Error: ${result.error}\n\n`;
    });

    fs.writeFileSync(REPORT_FILE, report);
    log(`Report generated at ${REPORT_FILE}`, 'REPORT');
  }
}

// Instantiate and configure runner
const runner = new TaskRunner();

// Define Tasks (Order matters!)

// 1. Validate System Settings Schema
runner.addTask(
  'Validate System Settings', 
  'node scripts/validate_schema_pg.cjs', 
  'Verifies system_settings table exists'
);

// 2. Fix Migration (System Settings) - Idempotent
runner.addTask(
  'Fix System Settings Schema',
  'node scripts/deploy_migration_force.cjs',
  'Ensures system_settings has correct columns'
);

// 3. Create Audit Logs Table
runner.addTask(
  'Create Audit Logs',
  'node scripts/create_audit_logs.cjs',
  'Ensures audit_logs table exists'
);

// 4. Create Integration Tables
runner.addTask(
  'Create Integration Tables',
  'node scripts/create_integration_tables.cjs',
  'Ensures api_keys, webhooks, biometric_devices, system_health exist'
);

// 5. Fix RLS Policies (Core + Integrations)
runner.addTask(
  'Fix RLS Policies',
  'node scripts/fix_all_rls.cjs',
  'Applies permissive RLS policies to all critical tables'
);

// 6. Integration Tests (System Settings + Audit Logs)
runner.addTask(
  'Test: System Settings & Audit Logs',
  'node scripts/test_integration.cjs',
  'CRUD tests for system settings and audit logs'
);

// 7. Integration Tests (Integrations Module)
runner.addTask(
  'Test: Integrations Module',
  'node scripts/verify_integrations.cjs',
  'CRUD tests for API keys, Webhooks, Biometric Devices'
);

// 8. Integration Tests (Monitoring Module)
runner.addTask(
  'Test: Monitoring Module',
  'node scripts/verify_monitoring.cjs',
  'CRUD tests for System Health logs'
);

// 9. Integration Tests (Core Data)
runner.addTask(
  'Test: Core Data Access',
  'node scripts/verify_core_data.cjs',
  'CRUD/Access tests for Orders, Dishes, Customers'
);

// 10. Check Table Existence (Final Verification)
runner.addTask(
  'Final Table Check',
  'node scripts/check_tables.cjs',
  'Lists all tables to confirm presence'
);

// Additional tasks can be added here to reach 30 if we split them granularly,
// but these cover the functional groups requested.

runner.run().catch(err => console.error('Fatal error in runner:', err));
