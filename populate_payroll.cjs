// Populate payroll table with test data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myppylcyupoirizyxhpo.supabase.co';
const supabaseKey = 'sb_publishable_2SbZ5lNBbE9KHxbwRobOSQ_G4WQ2q6K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populatePayrollTable() {
  try {
    console.log('📋 POPULATING PAYROLL TABLE');
    console.log('===============================');
    
    // First, get all active staff
    console.log('\n👥 FETCHING ACTIVE STAFF:');
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, name, position, base_salary, status')
      .eq('status', 'active');
    
    if (staffError) {
      console.error('❌ Error fetching staff:', staffError);
      return;
    }
    
    console.log(`Found ${staffData?.length || 0} active staff members`);
    staffData?.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - ${staff.position} - ${staff.base_salary?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
    });
    
    if (!staffData || staffData.length === 0) {
      console.log('❌ No active staff found. Cannot populate payroll.');
      return;
    }
    
    // Clear existing payroll records
    console.log('\n🗑️ CLEARING EXISTING PAYROLL RECORDS:');
    const { error: deleteError } = await supabase
      .from('payroll')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('❌ Error clearing payroll:', deleteError);
    } else {
      console.log('✅ Existing payroll records cleared');
    }
    
    // Create payroll records for current month (March 2026)
    console.log('\n💰 CREATING PAYROLL RECORDS:');
    const currentMonth = '2026-03';
    const currentYear = 2026;
    
    const payrollRecords = staffData.map(staff => {
      const overtimeHours = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0; // 30% chance of overtime
      const overtimeRate = staff.base_salary ? (staff.base_salary / 160) * 1.5 : 0; // 1.5x hourly rate
      const overtimePay = overtimeHours * overtimeRate;
      const bonuses = Math.random() > 0.8 ? Math.floor(Math.random() * 10000) + 5000 : 0; // 20% chance of bonus
      const deductions = Math.random() > 0.6 ? Math.floor(Math.random() * 5000) + 1000 : 0; // 40% chance of deductions
      const grossSalary = (staff.base_salary || 0) + overtimePay + bonuses;
      const netSalary = grossSalary - deductions;
      
      return {
        staff_id: staff.id,
        funcionario: staff.name, // Portuguese field name
        reference_month: currentMonth,
        month: currentMonth,
        year: currentYear,
        base_salary: staff.base_salary || 0,
        overtime_hours: overtimeHours,
        overtime_rate: overtimeRate,
        overtime_pay: overtimePay,
        deductions: deductions,
        bonuses: bonuses,
        net_salary: netSalary,
        status: Math.random() > 0.7 ? 'paid' : Math.random() > 0.5 ? 'processed' : 'pending',
        payment_date: Math.random() > 0.7 ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      };
    });
    
    console.log(`Creating ${payrollRecords.length} payroll records...`);
    
    // Insert records in batches
    const batchSize = 5;
    for (let i = 0; i < payrollRecords.length; i += batchSize) {
      const batch = payrollRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
      } else {
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserted successfully (${data?.length || 0} records)`);
      }
    }
    
    // Verify insertion
    console.log('\n🔍 VERIFYING INSERTION:');
    const { data: finalData, error: verifyError } = await supabase
      .from('payroll')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verifying payroll:', verifyError);
    } else {
      console.log(`✅ Total payroll records: ${finalData?.length || 0}`);
      
      // Display summary
      console.log('\n📊 PAYROLL SUMMARY:');
      const summary = {
        totalRecords: finalData?.length || 0,
        totalBaseSalary: finalData?.reduce((sum, record) => sum + (record.base_salary || 0), 0) || 0,
        totalNetSalary: finalData?.reduce((sum, record) => sum + (record.net_salary || 0), 0) || 0,
        statusCounts: finalData?.reduce((counts, record) => {
          counts[record.status] = (counts[record.status] || 0) + 1;
          return counts;
        }, {}) || {},
        totalOvertime: finalData?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0,
        totalBonuses: finalData?.reduce((sum, record) => sum + (record.bonuses || 0), 0) || 0,
        totalDeductions: finalData?.reduce((sum, record) => sum + (record.deductions || 0), 0) || 0
      };
      
      console.log(`  📋 Total Records: ${summary.totalRecords}`);
      console.log(`  💰 Total Base Salary: ${summary.totalBaseSalary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
      console.log(`  💵 Total Net Salary: ${summary.totalNetSalary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
      console.log(`  ⏰ Total Overtime Hours: ${summary.totalOvertime}`);
      console.log(`  🎁 Total Bonuses: ${summary.totalBonuses.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
      console.log(`  📉 Total Deductions: ${summary.totalDeductions.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`);
      console.log(`  📊 Status Counts:`, summary.statusCounts);
    }
    
    console.log('\n✅ PAYROLL TABLE POPULATED SUCCESSFULLY!');
    console.log('🎉 Ready to test at /settings/payroll');
    
  } catch (err) {
    console.error('❌ ERROR POPULATING PAYROLL:', err);
  }
}

populatePayrollTable();
