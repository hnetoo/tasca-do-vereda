import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(connectionString);

async function runFixes() {
  console.log('🚀 Starting database fixes...');
  
  try {
    // Read and execute fix_orders_final_clean.sql (final clean version)
    console.log('📋 Executing fix_orders_final_clean.sql...');
    const ordersSchema = fs.readFileSync(path.join(process.cwd(), 'fix_orders_final_clean.sql'), 'utf8');
    await sql.unsafe(ordersSchema);
    console.log('✅ fix_orders_final_clean.sql executed successfully');
    
    // Read and execute fix_dashboard_summary.sql
    console.log('📋 Executing fix_dashboard_summary.sql...');
    const dashboardSummary = fs.readFileSync(path.join(process.cwd(), 'fix_dashboard_summary.sql'), 'utf8');
    await sql.unsafe(dashboardSummary);
    console.log('✅ fix_dashboard_summary.sql executed successfully');
    
    // Read and execute fix_frontend_category_sync.sql
    console.log('📋 Executing fix_frontend_category_sync.sql...');
    const categorySync = fs.readFileSync(path.join(process.cwd(), 'fix_frontend_category_sync.sql'), 'utf8');
    await sql.unsafe(categorySync);
    console.log('✅ fix_frontend_category_sync.sql executed successfully');
    
    // Read and execute debug_category_validation.sql
    console.log('📋 Executing debug_category_validation.sql...');
    const categoryDebug = fs.readFileSync(path.join(process.cwd(), 'debug_category_validation.sql'), 'utf8');
    await sql.unsafe(categoryDebug);
    console.log('✅ debug_category_validation.sql executed successfully');
    
    console.log('🎉 All database fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing fixes:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the fixes
runFixes().catch(console.error);
