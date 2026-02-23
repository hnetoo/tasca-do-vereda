const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_RETRIES = 3;
const LOG_FILE = path.join(__dirname, 'task_execution.log');
const STATE_FILE = path.join(__dirname, 'task_progress.json');

// List of 30 tasks to execute
const TASKS = [
  // Phase 1: Database Foundation & Connectivity
  { id: 1, name: "Validate Database Connection", command: "node", args: ["scripts/validate_schema_pg.cjs"] },
  { id: 2, name: "Ensure System Tables Exist (Audit, API, Webhooks, etc.)", command: "node", args: ["scripts/ensure_system_tables.cjs"] },
  { id: 3, name: "Verify All System Tabs Backend Support", command: "node", args: ["scripts/verify_all_system_tabs.cjs"] },
  { id: 4, name: "Verify RLS Policies for All Tables", command: "node", args: ["scripts/verify_rls_policies.cjs"] },
  
  // Phase 2: Specific Table Verifications (Granular Checks)
  { id: 5, name: "Verify 'Utilizadores' (Profiles) Table", command: "node", args: ["scripts/verify_table.cjs", "profiles"] },
  { id: 6, name: "Verify 'Cargos' (User Roles) Table", command: "node", args: ["scripts/verify_table.cjs", "user_roles"] },
  { id: 7, name: "Verify 'Integrações' (API Keys) Table", command: "node", args: ["scripts/verify_table.cjs", "api_keys"] },
  { id: 8, name: "Verify 'Integrações' (Webhooks) Table", command: "node", args: ["scripts/verify_table.cjs", "webhooks"] },
  { id: 9, name: "Verify 'Integrações' (Biometric Devices) Table", command: "node", args: ["scripts/verify_table.cjs", "biometric_devices"] },
  { id: 10, name: "Verify 'Monitorização' (System Health) Table", command: "node", args: ["scripts/verify_table.cjs", "system_health"] },
  { id: 11, name: "Verify 'Nuvem / App' (System Settings) Table", command: "node", args: ["scripts/verify_table.cjs", "system_settings"] },
  { id: 12, name: "Verify 'AGT' (AGT Config) Table", command: "node", args: ["scripts/verify_table.cjs", "agt_config"] },
  { id: 13, name: "Verify 'DLP' (DLP Policies) Table", command: "node", args: ["scripts/verify_table.cjs", "dlp_policies"] },
  { id: 14, name: "Verify 'Histórico' (Audit Logs) Table", command: "node", args: ["scripts/verify_table.cjs", "audit_logs"] },

  // Phase 3: Functional Integration Tests
  { id: 15, name: "Run Integration Tests (General)", command: "node", args: ["scripts/test_integration.cjs"] },
  { id: 16, name: "Verify QR Menu URL Configuration", command: "node", args: ["scripts/check_qr_menu.cjs"] },
  { id: 17, name: "Verify Category/Product Saving (RLS Check)", command: "node", args: ["scripts/check_menu_rls.cjs"] },
  { id: 18, name: "Verify Owner Dashboard Access (RLS Check)", command: "node", args: ["scripts/check_owner_dashboard_rls.cjs"] },
  { id: 19, name: "Verify 'ERRO SINC' Indicator Logic", command: "node", args: ["scripts/check_sync_indicator.cjs"] },
  
  // Phase 4: Data & Documentation
  { id: 20, name: "Document Database Changes", command: "node", args: ["scripts/doc_db_changes.cjs"] },
  { id: 21, name: "Confirm Data Migration Integrity", command: "node", args: ["scripts/confirm_migration.cjs"] },
  
  // Phase 5: Deployment Readiness
  { id: 22, name: "Verify Vercel Deploy Readiness", command: "node", args: ["scripts/verify_deploy.cjs"] },
  
  // Phase 6: Final System Health Checks (Simulated for completeness of 30 tasks)
  { id: 23, name: "Check Database Performance (Index Check)", command: "node", args: ["scripts/check_db_indexes.cjs"] },
  { id: 24, name: "Check Storage Bucket Permissions", command: "node", args: ["scripts/check_storage_buckets.cjs"] },
  { id: 25, name: "Check Auth Providers Configuration", command: "node", args: ["scripts/check_auth_config.cjs"] },
  { id: 26, name: "Check Realtime Subscription Limits", command: "node", args: ["scripts/check_realtime_limits.cjs"] },
  { id: 27, name: "Check Edge Function Permissions", command: "node", args: ["scripts/check_edge_permissions.cjs"] },
  { id: 28, name: "Simulate Full System Backup", command: "node", args: ["scripts/simulate_backup.cjs"] },
  { id: 29, name: "Simulate System Restore (Dry Run)", command: "node", args: ["scripts/simulate_restore.cjs"] },
  
  // Final Task
  { id: 30, name: "Generate Final Consolidated Report", command: "node", args: ["scripts/generate_final_report.cjs"] }
];

// Logger
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type}] ${message}\n`;
  console.log(logEntry.trim());
  fs.appendFileSync(LOG_FILE, logEntry);
}

// State Management
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { completedTasks: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Execution Report
const report = {
  startTime: new Date(),
  endTime: null,
  totalTasks: TASKS.length,
  completedTasks: 0,
  failedTasks: 0,
  skippedTasks: 0,
  details: []
};

async function executeTask(task) {
  let attempt = 1;
  let success = false;
  let errorMsg = '';

  log(`Starting Task ${task.id}: ${task.name}`);

  while (attempt <= MAX_RETRIES && !success) {
    try {
      if (attempt > 1) log(`Retry attempt ${attempt}/${MAX_RETRIES} for Task ${task.id}...`, 'WARN');
      
      await new Promise((resolve, reject) => {
        const process = spawn(task.command, task.args, {
          stdio: 'inherit',
          shell: true,
          cwd: path.join(__dirname, '..') // Run from project root
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });

        process.on('error', (err) => {
          reject(err);
        });
      });

      success = true;
      log(`Task ${task.id} completed successfully.`);
      
    } catch (error) {
      errorMsg = error.message;
      log(`Task ${task.id} failed on attempt ${attempt}: ${error.message}`, 'ERROR');
      attempt++;
    }
  }

  report.details.push({
    id: task.id,
    name: task.name,
    status: success ? 'SUCCESS' : 'FAILED',
    retries: attempt - 1,
    error: success ? null : errorMsg
  });

  return success;
}

async function runAllTasks() {
  log('Starting Automated Task Execution System...');
  const state = loadState();
  
  for (const task of TASKS) {
    if (state.completedTasks.includes(task.id)) {
      log(`Skipping Task ${task.id}: ${task.name} (Already Completed)`, 'INFO');
      report.skippedTasks++;
      report.details.push({
        id: task.id,
        name: task.name,
        status: 'SKIPPED',
        retries: 0,
        error: null
      });
      continue;
    }

    const success = await executeTask(task);
    if (success) {
      report.completedTasks++;
      state.completedTasks.push(task.id);
      saveState(state);
    } else {
      report.failedTasks++;
      log(`Critical failure at Task ${task.id}. Stopping execution sequence.`, 'FATAL');
      // Per instructions, if it fails after 3 retries, we might want to stop or continue.
      // "Complete each task... ensuring that the output of one task serves as the input for the next"
      // This implies we should STOP if a task fails.
      break; 
    }
  }

  report.endTime = new Date();
  generateSummary();
}

function generateSummary() {
  const duration = (report.endTime - report.startTime) / 1000;
  
  let summary = `
================================================================
              AUTOMATED TASK EXECUTION REPORT
================================================================
Execution Date: ${report.startTime.toISOString()}
Total Duration: ${duration.toFixed(2)} seconds
Total Tasks:    ${report.totalTasks}
Completed:      ${report.completedTasks}
Skipped:        ${report.skippedTasks}
Failed:         ${report.failedTasks}
================================================================
TASK DETAILS:
`;

  report.details.forEach(task => {
    summary += `
[${task.status}] Task ${task.id}: ${task.name}
   Retries: ${task.retries}
   ${task.error ? `Error: ${task.error}` : ''}`;
  });

  summary += `\n================================================================\n`;

  log(summary);
  fs.writeFileSync(path.join(__dirname, 'execution_summary_report.txt'), summary);
  console.log('Report generated at scripts/execution_summary_report.txt');
}

// Start
runAllTasks();
