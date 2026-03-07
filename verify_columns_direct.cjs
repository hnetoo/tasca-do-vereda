// Verify payroll columns by testing field insertion
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumnsDirect() {
  try {
    console.log('🔍 VERIFYING PAYROLL COLUMNS BY TESTING');
    console.log('======================================');
    
    // Get a staff member for testing
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active')
      .limit(1);
    
    if (!staffData || staffData.length === 0) {
      console.log('❌ No active staff found for testing');
      return;
    }
    
    const testStaff = staffData[0];
    console.log(`👥 Using staff member: ${testStaff.name} (${testStaff.base_salary} AOA)`);
    
    // Test different field combinations to identify required columns
    console.log('\n🧪 TESTING FIELD COMBINATIONS:');
    
    // Base required fields we know exist
    const baseFields = {
      staff_id: testStaff.id,
      created_at: new Date().toISOString()
    };
    
    // Test individual fields to identify what's required
    const fieldsToTest = [
      { name: 'funcionario', value: testStaff.name },
      { name: 'reference_month', value: '2026-03' },
      { name: 'month', value: '2026-03' },
      { name: 'year', value: 2026 },
      { name: 'base_salary', value: testStaff.base_salary || 0 },
      { name: 'overtime_hours', value: 0 },
      { name: 'overtime_rate', value: 0 },
      { name: 'overtime_pay', value: 0 },
      { name: 'deductions', value: 0 },
      { name: 'bonuses', value: 0 },
      { name: 'net_salary', value: testStaff.base_salary || 0 },
      { name: 'status', value: 'pending' },
      { name: 'payment_date', value: null }
    ];
    
    const requiredFields = [];
    const optionalFields = [];
    const existingFields = [];
    
    for (const field of fieldsToTest) {
      console.log(`\n🔍 Testing field: ${field.name}`);
      
      const testRecord = {
        ...baseFields,
        [field.name]: field.value
      };
      
      // Clean up any existing test records
      await supabase
        .from('payroll')
        .delete()
        .eq('staff_id', testStaff.id);
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(testRecord);
      
      if (error) {
        if (error.message.includes('null value') && error.message.includes('violates not-null constraint')) {
          console.log(`❌ REQUIRED: ${field.name}`);
          requiredFields.push(field.name);
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`❌ DOES NOT EXIST: ${field.name}`);
        } else {
          console.log(`❌ ERROR: ${field.name} - ${error.message}`);
        }
      } else {
        console.log(`✅ EXISTS: ${field.name}`);
        existingFields.push(field.name);
        
        // Clean up
        await supabase
          .from('payroll')
          .delete()
          .eq('id', data[0].id);
      }
    }
    
    // Test combinations of required fields
    console.log('\n🔧 TESTING FIELD COMBINATIONS:');
    
    // Create minimal record with only confirmed required fields
    const minimalRecord = {
      staff_id: testStaff.id,
      created_at: new Date().toISOString()
    };
    
    // Add required fields one by one
    for (const field of requiredFields) {
      const fieldValue = fieldsToTest.find(f => f.name === field)?.value;
      minimalRecord[field] = fieldValue;
      
      console.log(`\n🧪 Testing minimal record + ${field}:`);
      
      // Clean up
      await supabase
        .from('payroll')
        .delete()
        .eq('staff_id', testStaff.id);
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(minimalRecord);
      
      if (error) {
        console.log(`❌ Still missing fields after adding ${field}`);
      } else {
        console.log(`✅ Success with ${field} added`);
        
        // Clean up
        await supabase
          .from('payroll')
          .delete()
          .eq('id', data[0].id);
      }
    }
    
    // Final comprehensive test
    console.log('\n🎯 FINAL COMPREHENSIVE TEST:');
    
    const finalRecord = {
      staff_id: testStaff.id,
      funcionario: testStaff.name,
      reference_month: '2026-03',
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
      payment_date: null,
      created_at: new Date().toISOString()
    };
    
    console.log('Final record fields:', Object.keys(finalRecord));
    
    const { data: finalData, error: finalError } = await supabase
      .from('payroll')
      .insert(finalRecord);
    
    if (finalError) {
      console.error('❌ FINAL TEST FAILED:', finalError);
    } else {
      console.log('✅ FINAL TEST SUCCESSFUL!');
      console.log('✅ All required fields identified and working');
      
      // Clean up
      await supabase
        .from('payroll')
        .delete()
        .eq('id', finalData[0].id);
    }
    
    // Summary
    console.log('\n📊 COLUMN ANALYSIS SUMMARY:');
    console.log(`  🔴 REQUIRED FIELDS (${requiredFields.length}):`, requiredFields);
    console.log(`  ✅ EXISTING FIELDS (${existingFields.length}):`, existingFields);
    console.log(`  🟡 OPTIONAL FIELDS:`, fieldsToTest.filter(f => existingFields.includes(f.name)).map(f => f.name));
    
    // Generate corrected interface
    console.log('\n🔧 RECOMMENDED PAYROLL RECORD INTERFACE:');
    console.log('interface PayrollRecord {');
    console.log('  id: string;');
    console.log('  staff_id: string;');
    
    if (requiredFields.includes('funcionario')) {
      console.log('  funcionario: string;');
    }
    
    if (existingFields.includes('month')) {
      console.log('  month: string;');
    }
    
    if (existingFields.includes('year')) {
      console.log('  year: number;');
    }
    
    if (existingFields.includes('base_salary')) {
      console.log('  base_salary: number;');
    }
    
    if (existingFields.includes('overtime_hours')) {
      console.log('  overtime_hours: number;');
    }
    
    if (existingFields.includes('overtime_rate')) {
      console.log('  overtime_rate: number;');
    }
    
    if (existingFields.includes('overtime_pay')) {
      console.log('  overtime_pay: number;');
    }
    
    if (existingFields.includes('deductions')) {
      console.log('  deductions: number;');
    }
    
    if (existingFields.includes('bonuses')) {
      console.log('  bonuses: number;');
    }
    
    if (existingFields.includes('net_salary')) {
      console.log('  net_salary: number;');
    }
    
    if (existingFields.includes('status')) {
      console.log("  status: 'pending' | 'processed' | 'paid';");
    }
    
    if (existingFields.includes('payment_date')) {
      console.log('  payment_date?: string;');
    }
    
    console.log('  created_at: string;');
    console.log('}');
    
  } catch (err) {
    console.error('❌ ERROR VERIFYING COLUMNS:', err);
  }
}

verifyColumnsDirect();
