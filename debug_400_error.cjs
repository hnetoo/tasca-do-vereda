// Debug 400 error in detail
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug400Error() {
  try {
    console.log('🔍 DEBUGGING 400 ERROR IN DETAIL');
    console.log('===================================');
    
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
    
    // Test minimal record first
    console.log('\n🧪 TEST 1: MINIMAL RECORD');
    const minimalRecord = {
      staff_id: testStaff.id,
      created_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('payroll')
        .insert(minimalRecord);
      
      if (error) {
        console.error('❌ Minimal record failed:', error);
      } else {
        console.log('✅ Minimal record success');
        // Clean up
        await supabase.from('payroll').delete().eq('id', data[0].id);
      }
    } catch (err) {
      console.error('❌ Minimal record exception:', err);
    }
    
    // Test adding required fields one by one
    const requiredFields = [
      { name: 'funcionario', value: testStaff.name },
      { name: 'reference_month', value: '2026-03' },
      { name: 'month', value: '2026-03' },
      { name: 'year', value: 2026, type: 'number' },
      { name: 'base_salary', value: testStaff.base_salary, type: 'number' },
      { name: 'overtime_hours', value: 0, type: 'number' },
      { name: 'overtime_rate', value: 0, type: 'number' },
      { name: 'overtime_pay', value: 0, type: 'number' },
      { name: 'deductions', value: 0, type: 'number' },
      { name: 'bonuses', value: 0, type: 'number' },
      { name: 'net_salary', value: testStaff.base_salary, type: 'number' },
      { name: 'status', value: 'pending', type: 'string' }
    ];
    
    let workingRecord = { ...minimalRecord };
    
    for (const field of requiredFields) {
      console.log(`\n🧪 TESTING FIELD: ${field.name} (${field.type || 'string'})`);
      
      const testRecord = {
        ...workingRecord,
        [field.name]: field.value
      };
      
      // Clean up any existing test records
      await supabase.from('payroll').delete().eq('staff_id', testStaff.id);
      
      try {
        const { data, error } = await supabase
          .from('payroll')
          .insert(testRecord);
        
        if (error) {
          console.error(`❌ Field ${field.name} failed:`, error);
          
          // Analyze the error
          if (error.message.includes('violates not-null constraint')) {
            const missingField = error.message.match(/column "([^"]+)"/);
            if (missingField) {
              console.log(`  🔍 Missing required field: ${missingField[1]}`);
            }
          } else if (error.message.includes('violates check constraint')) {
            console.log(`  🔍 Check constraint violation for field: ${field.name}`);
          } else if (error.message.includes('invalid input syntax')) {
            console.log(`  🔍 Invalid input syntax for field: ${field.name} (type: ${typeof field.value})`);
          } else if (error.message.includes('duplicate key')) {
            console.log(`  🔍 Duplicate key for field: ${field.name}`);
          } else {
            console.log(`  🔍 Other error for field ${field.name}: ${error.message}`);
          }
        } else {
          console.log(`✅ Field ${field.name} success`);
          workingRecord = { ...testRecord };
          
          // Clean up
          await supabase.from('payroll').delete().eq('id', data[0].id);
        }
      } catch (err) {
        console.error(`❌ Field ${field.name} exception:`, err);
      }
    }
    
    // Test optional fields
    console.log('\n🧪 TESTING OPTIONAL FIELDS:');
    const optionalFields = [
      { name: 'payment_date', value: null },
      { name: 'staff_name', value: testStaff.name },
      { name: 'salario_base', value: testStaff.base_salary, type: 'number' },
      { name: 'descontos', value: 0, type: 'number' },
      { name: 'subsidios', value: 0, type: 'number' },
      { name: 'net_total', value: testStaff.base_salary, type: 'number' },
      { name: 'status_pagamento', value: 'pendente', type: 'string' }
    ];
    
    for (const field of optionalFields) {
      console.log(`\n🧪 TESTING OPTIONAL FIELD: ${field.name}`);
      
      const testRecord = {
        ...workingRecord,
        [field.name]: field.value
      };
      
      // Clean up
      await supabase.from('payroll').delete().eq('staff_id', testStaff.id);
      
      try {
        const { data, error } = await supabase
          .from('payroll')
          .insert(testRecord);
        
        if (error) {
          console.error(`❌ Optional field ${field.name} failed:`, error);
        } else {
          console.log(`✅ Optional field ${field.name} success`);
          workingRecord = { ...testRecord };
          
          // Clean up
          await supabase.from('payroll').delete().eq('id', data[0].id);
        }
      } catch (err) {
        console.error(`❌ Optional field ${field.name} exception:`, err);
      }
    }
    
    // Final comprehensive test
    console.log('\n🎯 FINAL COMPREHENSIVE TEST:');
    const finalRecord = {
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
      net_total: testStaff.base_salary,
      status: 'pending',
      status_pagamento: 'pendente',
      payment_date: null,
      created_at: new Date().toISOString()
    };
    
    console.log('Final record:', JSON.stringify(finalRecord, null, 2));
    
    // Clean up
    await supabase.from('payroll').delete().eq('staff_id', testStaff.id);
    
    try {
      const { data, error } = await supabase
        .from('payroll')
        .insert(finalRecord);
      
      if (error) {
        console.error('❌ Final test failed:', error);
        
        // Detailed error analysis
        console.log('\n🔍 DETAILED ERROR ANALYSIS:');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Error details:', error.details);
        console.log('Error hint:', error.hint);
        
        if (error.message.includes('null value')) {
          console.log('\n🔍 NULL VALUE ANALYSIS:');
          const nullFields = [];
          Object.keys(finalRecord).forEach(key => {
            if (finalRecord[key] === null || finalRecord[key] === undefined) {
              nullFields.push(key);
            }
          });
          console.log('Null fields:', nullFields);
        }
        
        if (error.message.includes('invalid input syntax')) {
          console.log('\n🔍 SYNTAX ERROR ANALYSIS:');
          console.log('Record data types:');
          Object.keys(finalRecord).forEach(key => {
            console.log(`  ${key}: ${typeof finalRecord[key]} = ${finalRecord[key]}`);
          });
        }
      } else {
        console.log('✅ Final test success!');
        console.log('Inserted record ID:', data[0].id);
        
        // Clean up
        await supabase.from('payroll').delete().eq('id', data[0].id);
      }
    } catch (err) {
      console.error('❌ Final test exception:', err);
    }
    
    console.log('\n✅ DEBUG COMPLETE');
    
  } catch (err) {
    console.error('❌ DEBUG ERROR:', err);
  }
}

debug400Error();
