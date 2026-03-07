// Debug payroll error - null constraint violation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPayrollError() {
  try {
    console.log('🔍 DEBUG PAYROLL ERROR - NULL CONSTRAINT');
    console.log('====================================');
    
    // Check table structure
    console.log('\n📋 PAYROLL TABLE STRUCTURE:');
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, column_default')
      .eq('table_name', 'payroll')
      .order('ordinal_position');
    
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check existing data
    console.log('\n📊 EXISTING PAYROLL DATA:');
    const { data: payrollData } = await supabase
      .from('payroll')
      .select('*')
      .limit(5);
    
    if (payrollData && payrollData.length > 0) {
      console.log('Existing records:');
      payrollData.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}, Staff: ${record.staff_id}, Status: ${record.status}`);
      });
    } else {
      console.log('No existing records found');
    }
    
    // Check staff data
    console.log('\n👥 STAFF DATA:');
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary, status')
      .eq('status', 'active')
      .limit(5);
    
    if (staffData && staffData.length > 0) {
      console.log('Active staff members:');
      staffData.forEach((staff, index) => {
        console.log(`  ${index + 1}. ID: ${staff.id}, Name: ${staff.name}, Salary: ${staff.base_salary}`);
      });
    } else {
      console.log('No active staff found');
    }
    
    // Test insert with minimal data
    console.log('\n🧪 TEST MINIMAL INSERT:');
    const testStaff = staffData?.[0];
    if (testStaff) {
      const testRecord = {
        staff_id: testStaff.id,
        staff_name: testStaff.name,
        month: '2026-03',
        year: 2026,
        base_salary: testStaff.base_salary || 0,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        deductions: 0,
        bonuses: 0,
        net_salary: testStaff.base_salary || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      console.log('Test record:', JSON.stringify(testRecord, null, 2));
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(testRecord);
      
      if (error) {
        console.error('❌ INSERT ERROR:', error);
      } else {
        console.log('✅ INSERT SUCCESS:', data);
        
        // Clean up test record
        await supabase
          .from('payroll')
          .delete()
          .eq('id', data[0].id);
      }
    }
    
  } catch (err) {
    console.error('❌ DEBUG ERROR:', err);
  }
}

debugPayrollError();
