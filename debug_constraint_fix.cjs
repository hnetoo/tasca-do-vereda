// Debug and fix constraint violation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraintIssue() {
  try {
    console.log('🔍 INVESTIGATING CONSTRAINT ISSUE');
    console.log('====================================');
    
    // Check current table structure
    console.log('\n📋 CURRENT TABLE STRUCTURE:');
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, column_default')
      .eq('table_name', 'payroll')
      .order('ordinal_position');
    
    const problematicColumns = [];
    columns?.forEach(col => {
      if (col.is_nullable === 'NO' && col.column_name !== 'id') {
        problematicColumns.push(col.column_name);
      }
      console.log(`  - ${col.column_name}: ${col.data_type} (NULL: ${col.is_nullable === 'NO'})`);
    });
    
    console.log(`\n❌ PROBLEMATIC COLUMNS (${problematicColumns.length}):`);
    problematicColumns.forEach(col => console.log(`    - ${col}`));
    
    // Check if we have existing data causing issues
    console.log('\n📊 CHECKING EXISTING DATA:');
    const { data: existingData } = await supabase
      .from('payroll')
      .select('*')
      .limit(3);
    
    if (existingData && existingData.length > 0) {
      console.log('Existing records with NULL values:');
      existingData.forEach((record, index) => {
        const nullFields = [];
        Object.keys(record).forEach(key => {
          if (record[key] === null || record[key] === undefined) {
            nullFields.push(key);
          }
        });
        if (nullFields.length > 0) {
          console.log(`  Record ${index + 1}: NULL fields - ${nullFields.join(', ')}`);
        }
      });
    }
    
    // Test safe insert with only required non-NULL fields
    console.log('\n🧪 TESTING SAFE INSERT:');
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active')
      .limit(1);
    
    if (staffData && staffData.length > 0) {
      const safeRecord = {
        staff_id: staffData[0].id,
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
      
      console.log('Safe record to insert:', JSON.stringify(safeRecord, null, 2));
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(safeRecord);
      
      if (error) {
        console.error('❌ SAFE INSERT FAILED:', error);
      } else {
        console.log('✅ SAFE INSERT SUCCESS:', data);
        
        // Clean up
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

fixConstraintIssue();
