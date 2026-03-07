// Verify and fix all payroll table columns
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAllColumns() {
  try {
    console.log('🔍 VERIFYING ALL PAYROLL TABLE COLUMNS');
    console.log('==========================================');
    
    // Get all columns from information_schema
    console.log('\n📋 GETTING TABLE STRUCTURE:');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_name', 'payroll')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error getting columns:', columnsError);
      return;
    }
    
    console.log(`Found ${columns?.length || 0} columns:`);
    
    // Group columns by type
    const requiredColumns = [];
    const optionalColumns = [];
    const numericColumns = [];
    const textColumns = [];
    const dateColumns = [];
    const uuidColumns = [];
    
    columns?.forEach((col, index) => {
      const status = col.is_nullable === 'NO' ? 'REQUIRED' : 'OPTIONAL';
      const type = col.data_type.toLowerCase();
      
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} (${status})`);
      
      if (col.is_nullable === 'NO') {
        requiredColumns.push(col.column_name);
      } else {
        optionalColumns.push(col.column_name);
      }
      
      if (type.includes('numeric') || type.includes('decimal') || type.includes('money')) {
        numericColumns.push(col.column_name);
      } else if (type.includes('character') || type.includes('text')) {
        textColumns.push(col.column_name);
      } else if (type.includes('timestamp') || type.includes('date')) {
        dateColumns.push(col.column_name);
      } else if (type.includes('uuid')) {
        uuidColumns.push(col.column_name);
      }
    });
    
    console.log('\n📊 COLUMN ANALYSIS:');
    console.log(`  🔴 REQUIRED COLUMNS (${requiredColumns.length}):`, requiredColumns);
    console.log(`  🟡 OPTIONAL COLUMNS (${optionalColumns.length}):`, optionalColumns);
    console.log(`  🔢 NUMERIC COLUMNS (${numericColumns.length}):`, numericColumns);
    console.log(`  🔤 TEXT COLUMNS (${textColumns.length}):`, textColumns);
    console.log(`  📅 DATE COLUMNS (${dateColumns.length}):`, dateColumns);
    console.log(`  🆔 UUID COLUMNS (${uuidColumns.length}):`, uuidColumns);
    
    // Check existing data
    console.log('\n📋 CHECKING EXISTING DATA:');
    const { data: existingData, error: dataError } = await supabase
      .from('payroll')
      .select('*')
      .limit(3);
    
    if (dataError) {
      console.error('❌ Error getting existing data:', dataError);
    } else {
      console.log(`Found ${existingData?.length || 0} existing records`);
      
      if (existingData && existingData.length > 0) {
        console.log('\n🔍 SAMPLE RECORD:');
        const sample = existingData[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const status = value === null || value === undefined ? '❌ NULL' : '✅ VALUE';
          console.log(`  ${key}: ${value} (${status})`);
        });
      }
    }
    
    // Test insert with all required fields
    console.log('\n🧪 TESTING INSERT WITH ALL REQUIRED FIELDS:');
    
    // Get a staff member for testing
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active')
      .limit(1);
    
    if (staffData && staffData.length > 0) {
      const testStaff = staffData[0];
      
      // Create comprehensive test record
      const testRecord = {
        // UUID fields
        staff_id: testStaff.id,
        
        // Required text fields (based on analysis)
        funcionario: testStaff.name, // Portuguese field for staff name
        reference_month: '2026-03', // Required month reference
        
        // Optional text fields
        month: '2026-03',
        status: 'pending',
        
        // Numeric fields
        base_salary: testStaff.base_salary || 0,
        overtime_hours: 0,
        overtime_rate: 0,
        overtime_pay: 0,
        deductions: 0,
        bonuses: 0,
        net_salary: testStaff.base_salary || 0,
        
        // Date fields
        created_at: new Date().toISOString(),
        payment_date: null,
        
        // Year field
        year: 2026
      };
      
      console.log('Test record fields:', Object.keys(testRecord));
      console.log('Test record values:', JSON.stringify(testRecord, null, 2));
      
      // Clean up any existing test record
      await supabase
        .from('payroll')
        .delete()
        .eq('staff_id', testStaff.id);
      
      // Insert test record
      const { data: insertResult, error: insertError } = await supabase
        .from('payroll')
        .insert(testRecord);
      
      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        
        // Try to identify missing required fields
        if (insertError.message.includes('null value') && insertError.message.includes('violates not-null constraint')) {
          console.log('\n🔧 ANALYZING CONSTRAINT ERROR:');
          const missingField = insertError.message.match(/column "([^"]+)"/);
          if (missingField) {
            console.log(`❌ Missing required field: ${missingField[1]}`);
            
            // Check if this field is in our test record
            if (!testRecord.hasOwnProperty(missingField[1])) {
              console.log(`🔧 Field '${missingField[1]}' not found in test record`);
            } else {
              console.log(`🔧 Field '${missingField[1]}' found in test record with value: ${testRecord[missingField[1]]}`);
            }
          }
        }
      } else {
        console.log('✅ INSERT SUCCESSFUL!');
        console.log('Inserted record:', insertResult);
        
        // Clean up test record
        await supabase
          .from('payroll')
          .delete()
          .eq('id', insertResult[0].id);
      }
    }
    
    console.log('\n📋 COLUMN REQUIREMENTS SUMMARY:');
    console.log('Based on analysis, the payroll table requires:');
    console.log('  🔴 REQUIRED FIELDS:');
    requiredColumns.forEach(col => {
      console.log(`    - ${col}`);
    });
    console.log('  🟡 OPTIONAL FIELDS:');
    optionalColumns.forEach(col => {
      console.log(`    - ${col}`);
    });
    
  } catch (err) {
    console.error('❌ ERROR VERIFYING COLUMNS:', err);
  }
}

verifyAllColumns();
