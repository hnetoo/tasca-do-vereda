import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST() {
  try {
    console.log(' Fixing payroll schema...');
    
    // Add missing columns to payroll table
    const alterStatements = [
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bonuses DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS deductions DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(8,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS net_salary DECIMAL(12,2) DEFAULT 0',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS month VARCHAR(7) DEFAULT \'\'\'',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'pending\'',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP',
      'ALTER TABLE payroll ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255) DEFAULT \'\'\''
    ];

    for (const statement of alterStatements) {
      console.log(` Executing: ${statement}`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(` Error executing: ${statement}`, error);
        return Response.json({ error: error.message, statement }, { status: 500 });
      }
    }

    // Verify the changes
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'payroll')
      .order('ordinal_position');

    console.log(' Payroll table columns after fix:');
    columns?.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    return Response.json({ 
      message: 'Payroll schema fixed successfully',
      columns: columns 
    });

  } catch (error: any) {
      console.error(' Error checking payroll schema:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
}
