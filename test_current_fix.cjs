// Test if current fix (removing net_total) works
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentFix() {
  try {
    console.log('🧪 TESTING CURRENT FIX (net_total removed)');
    console.log('==========================================');
    
    // Get staff data
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active')
      .limit(1);
    
    if (!staffData || staffData.length === 0) {
      console.log('❌ No staff data found');
      return;
    }
    
    const testStaff = staffData[0];
    console.log(`👥 Using staff: ${testStaff.name} (${testStaff.base_salary} AOA)`);
    
    // Test record without net_total (current fix)
    console.log('\n🧪 TESTING RECORD WITHOUT net_total:');
    const testRecord = {
      staff_id: testStaff.id,
      funcionario: testStaff.name,
      staff_name: testStaff.name,
      reference_month: '2026-03',
      month: '2026-03',
      year: 2026,
      base_salary: testStaff.base_salary,
      salario_base: testStaff.base_salary,
      overtime_hours: 0,
      overtime_rate: 0,
      overtime_pay: 0,
      deductions: 0,
      descontos: 0,
      bonuses: 0,
      subsidios: 0,
      net_salary: testStaff.base_salary,
      // NO net_total field - this is our fix
      status: 'pending',
      status_pagamento: 'pendente',
      payment_date: null,
      created_at: new Date().toISOString()
    };
    
    console.log('Test record fields:', Object.keys(testRecord));
    console.log('Test record:', JSON.stringify(testRecord, null, 2));
    
    // Clean up any existing test records
    await supabase
      .from('payroll')
      .delete()
      .eq('staff_id', testStaff.id);
    
    // Insert test record
    const { data, error } = await supabase
      .from('payroll')
      .insert(testRecord);
    
    if (error) {
      console.error('❌ INSERT FAILED:', error);
      
      if (error.message.includes('net_total')) {
        console.log('🔍 ERROR STILL RELATED TO net_total');
        console.log('💡 SUGGESTION: May need to drop the net_total column from database');
      } else if (error.message.includes('violates not-null constraint')) {
        console.log('🔍 NULL CONSTRAINT ERROR');
        const missingField = error.message.match(/column "([^"]+)"/);
        if (missingField) {
          console.log(`❌ Missing required field: ${missingField[1]}`);
        }
      } else {
        console.log('🔍 OTHER ERROR:', error.message);
      }
    } else {
      console.log('✅ INSERT SUCCESSFUL!');
      console.log('Inserted record ID:', data[0].id);
      console.log('✅ Current fix (removing net_total) WORKS!');
      
      // Clean up test record
      await supabase
        .from('payroll')
        .delete()
        .eq('id', data[0].id);
    }
    
    // Check existing data structure
    console.log('\n🔍 CHECKING EXISTING DATA STRUCTURE:');
    const { data: existingData } = await supabase
      .from('payroll')
      .select('*')
      .limit(2);
    
    if (existingData && existingData.length > 0) {
      console.log('Sample existing records:');
      existingData.forEach((record, index) => {
        console.log(`\n📄 RECORD ${index + 1}:`);
        Object.keys(record).forEach(key => {
          const value = record[key];
          const displayValue = value === null ? 'NULL' : value;
          console.log(`  ${key}: ${displayValue}`);
        });
      });
    }
    
    console.log('\n✅ TEST COMPLETE');
    console.log('🎯 CONCLUSION:');
    console.log('- If insert succeeded: Current fix works, no database changes needed');
    console.log('- If insert failed with net_total error: Need to drop net_total column');
    console.log('- If insert failed with other errors: Need further investigation');
    
  } catch (err) {
    console.error('❌ TEST ERROR:', err);
  }
}

testCurrentFix();
