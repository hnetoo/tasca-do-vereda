// Check existing payroll data to understand real structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingData() {
  try {
    console.log('🔍 CHECKING EXISTING PAYROLL DATA');
    console.log('===================================');
    
    // Get existing records
    const { data: existingData, error: dataError } = await supabase
      .from('payroll')
      .select('*')
      .limit(5);
    
    if (dataError) {
      console.error('❌ Error getting existing data:', dataError);
      return;
    }
    
    if (!existingData || existingData.length === 0) {
      console.log('❌ No existing payroll data found');
      
      // Try to create a minimal record to see what works
      console.log('\n🧪 TESTING MINIMAL INSERT:');
      
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, base_salary')
        .eq('status', 'active')
        .limit(1);
      
      if (staffData && staffData.length > 0) {
        const testStaff = staffData[0];
        
        // Try minimal insert with just basic fields
        const minimalRecord = {
          staff_id: testStaff.id,
          created_at: new Date().toISOString()
        };
        
        console.log('Testing minimal record:', minimalRecord);
        
        const { data, error } = await supabase
          .from('payroll')
          .insert(minimalRecord);
        
        if (error) {
          console.error('❌ Minimal insert failed:', error);
          
          // The error will tell us what's really required
          if (error.message.includes('null value') && error.message.includes('violates not-null constraint')) {
            console.log('\n🔧 ANALYZING CONSTRAINT ERROR:');
            const match = error.message.match(/column "([^"]+)"/);
            if (match) {
              console.log(`❌ REQUIRED FIELD: ${match[1]}`);
            }
            
            // Extract all required fields from the error details
            const detailsMatch = error.details.match(/Failing row contains \(([^)]+)\)/);
            if (detailsMatch) {
              console.log('\n📋 ROW DATA ANALYSIS:');
              const rowData = detailsMatch[1];
              const fields = rowData.split(', ');
              
              fields.forEach((field, index) => {
                const [fieldName, ...valueParts] = field.split(' ');
                const value = valueParts.join(' ');
                
                if (value === 'null' || value === 'NULL') {
                  console.log(`  ${index + 1}. ❌ ${fieldName}: ${value} (REQUIRED)`);
                } else {
                  console.log(`  ${index + 1}. ✅ ${fieldName}: ${value}`);
                }
              });
            }
          }
        } else {
          console.log('✅ Minimal insert successful!');
          console.log('Inserted data:', data);
          
          // Clean up
          await supabase
            .from('payroll')
            .delete()
            .eq('id', data[0].id);
        }
      }
      
      return;
    }
    
    console.log(`\n📋 FOUND ${existingData.length} EXISTING RECORDS:`);
    
    existingData.forEach((record, index) => {
      console.log(`\n📄 RECORD ${index + 1}:`);
      console.log('  Fields and values:');
      
      Object.keys(record).forEach(key => {
        const value = record[key];
        const type = typeof value;
        const status = value === null || value === undefined ? '❌ NULL' : '✅ VALUE';
        console.log(`    ${key}: ${value} (${type}) ${status}`);
      });
    });
    
    // Analyze the structure from existing data
    console.log('\n🔍 STRUCTURE ANALYSIS:');
    const allFields = new Set();
    const nullFields = [];
    const valueFields = [];
    
    existingData.forEach(record => {
      Object.keys(record).forEach(key => {
        allFields.add(key);
        
        if (record[key] === null || record[key] === undefined) {
          if (!nullFields.includes(key)) {
            nullFields.push(key);
          }
        } else {
          if (!valueFields.includes(key)) {
            valueFields.push(key);
          }
        }
      });
    });
    
    console.log(`  📊 Total unique fields: ${allFields.size}`);
    console.log(`  ✅ Fields with values: ${valueFields.length}`);
    console.log(`  ❌ Fields with null values: ${nullFields.length}`);
    
    console.log('\n📋 ALL FIELDS:');
    Array.from(allFields).sort().forEach((field, index) => {
      const hasValue = valueFields.includes(field);
      const hasNull = nullFields.includes(field);
      const status = hasValue ? '✅ HAS VALUES' : hasNull ? '❌ NULL VALUES' : '🟡 MIXED';
      console.log(`  ${index + 1}. ${field}: ${status}`);
    });
    
    // Get staff data to cross-reference
    console.log('\n👥 CROSS-REFERENCE WITH STAFF:');
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, base_salary')
      .eq('status', 'active');
    
    if (staffData) {
      console.log(`Found ${staffData.length} active staff members`);
      
      existingData.forEach(record => {
        const matchingStaff = staffData.find(s => s.id === record.staff_id);
        if (matchingStaff) {
          console.log(`  📋 Payroll for ${record.funcionario || record.staff_name || 'Unknown'} matches staff: ${matchingStaff.name}`);
        }
      });
    }
    
  } catch (err) {
    console.error('❌ ERROR CHECKING EXISTING DATA:', err);
  }
}

checkExistingData();
