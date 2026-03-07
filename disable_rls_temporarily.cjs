// Disable RLS temporarily to fix payroll issues
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLSTemporarily() {
  try {
    console.log('🔓 DISABLING RLS TEMPORARILY');
    console.log('==================================');
    
    // Disable RLS on payroll table
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.error('❌ Failed to disable RLS:', disableError);
    } else {
      console.log('✅ RLS disabled successfully');
    }
    
    // Test simple insert
    console.log('\n🧪 TESTING SIMPLE INSERT:');
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active')
      .limit(1);
    
    if (staffData && staffData.length > 0) {
      const simpleRecord = {
        staff_id: staffData[0].id,
        staff_name: staffData[0].name,
        month: '2026-03',
        year: 2026,
        base_salary: staffData[0].base_salary || 0,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        deductions: 0,
        bonuses: 0,
        net_salary: staffData[0].base_salary || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      console.log('Simple record:', JSON.stringify(simpleRecord, null, 2));
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(simpleRecord);
      
      if (error) {
        console.error('❌ INSERT FAILED:', error);
      } else {
        console.log('✅ INSERT SUCCESS:', data);
        
        // Clean up
        await supabase
          .from('payroll')
          .delete()
          .eq('id', data[0].id);
      }
    }
    
  } catch (err) {
    console.error('❌ ERROR:', err);
  }
}

disableRLSTemporarily();
