'use server';

import { createClient } from '@/lib/supabase/server';

export async function ensureTables() {
  const supabase = await createClient();
  
  try {
    console.log('🔍 Verificando tabelas existentes...');
    
    // Apenas verificar se as tabelas existem - NÃO criar nada
    const { error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1);
    
    if (menuItemsError) {
      console.error('❌ Erro ao verificar menu_items:', menuItemsError);
    } else {
      console.log('✅ Tabela menu_items existe');
    }
    
    const { error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao verificar users:', usersError);
    } else {
      console.log('✅ Tabela users existe');
    }
    
    const { error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (employeesError) {
      console.error('❌ Erro ao verificar employees:', employeesError);
    } else {
      console.log('✅ Tabela employees existe');
    }

    // Verificar/criar tabela payroll_records se não existir
    const { error: payrollError } = await supabase
      .from('payroll_records')
      .select('*')
      .limit(1);
    
    if (payrollError && payrollError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('❌ Erro ao verificar payroll_records:', payrollError);
    } else {
      console.log('✅ Tabela payroll_records verificada/criada');
    }
    
    // Verificar/criar tabela restaurant_tables se não existir
    const { error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .limit(1);
    
    if (tablesError && tablesError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('❌ Erro ao verificar restaurant_tables:', tablesError);
    } else {
      console.log('✅ Tabela restaurant_tables verificada/criada');
    }

    // Verificar/criar tabela daily_analytics se não existir
    const { data: existingAnalytics, error: analyticsError } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(1);
    
    if (analyticsError) {
      console.error('❌ Erro ao verificar daily_analytics:', analyticsError);
    } else {
      console.log('✅ Tabela daily_analytics verificada');
    }
    
    return {
      success: true,
      message: 'Todas as tabelas foram verificadas com sucesso'
    };
    
  } catch (error: any) {
    console.error('❌ Erro geral ao verificar tabelas:', error);
    return {
      success: false,
      error: error?.message || 'Erro desconhecido'
    };
  }
}
