'use server';

import { createClient } from '@/lib/supabase/client';

export interface PayrollRecord {
  id?: string;
  staff_id?: string;
  staff_name: string;
  base_salary: number;
  subsidies?: number;
  deductions?: number;
  net_total?: number;
  reference_month: string;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  metadata?: {
    bonus?: number;
    hora_extra?: {
      horas: number;
      valor_hora: number;
      total: number;
    };
    subsidios?: {
      alimentacao?: number;
      transporte?: number;
      outros?: number;
    };
    deducoes?: {
      irs?: number;
      seguranca_social?: number;
      outros?: number;
    };
    observacoes?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export async function getPayrollRecords() {
  const supabase = await createClient();
  
  try {
    // Verificar qual tabela existe: payroll ou payroll_records
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      // Tabela payroll não existe, tentar payroll_records
      tableName = 'payroll_records';
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id, staff_id, staff_name, base_salary, subsidies, deductions, net_total, reference_month, status_pagamento, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar registros de payroll:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar payroll:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createPayrollRecord(record: PayrollRecord) {
  const supabase = await createClient();
  
  try {
    // Verificar qual tabela existe: payroll ou payroll_records
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      // Tabela payroll não existe, tentar payroll_records
      tableName = 'payroll_records';
    }
    
    // Calcular net_total automaticamente incluindo metadata
    let net_total = record.base_salary;
    
    // Adicionar subsidios tradicionais se existirem
    if (record.subsidies) {
      net_total += record.subsidies;
    }
    
    // Adicionar subsidios do metadata se existirem
    if (record.metadata?.subsidios) {
      const subsidiosValues = Object.values(record.metadata.subsidios);
      net_total += subsidiosValues.reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
    }
    
    // Adicionar bónus do metadata se existir
    if (record.metadata?.bonus) {
      net_total += record.metadata.bonus;
    }
    
    // Adicionar hora_extra do metadata se existir
    if (record.metadata?.hora_extra?.total) {
      net_total += record.metadata.hora_extra.total;
    }
    
    // Subtrair deduções tradicionais se existirem
    if (record.deductions) {
      net_total -= record.deductions;
    }
    
    // Subtrair deduções do metadata se existirem
    if (record.metadata?.deducoes) {
      const deducoesValues = Object.values(record.metadata.deducoes);
      net_total -= deducoesValues.reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
    }
    
    // Incluir apenas colunas que existem
    const insertData: any = {
      staff_id: record.staff_id,
      staff_name: record.staff_name,
      base_salary: record.base_salary,
      subsidies: record.subsidies || 0,
      deductions: record.deductions || 0,
      net_total: net_total,
      reference_month: record.reference_month,
      status_pagamento: record.status_pagamento,
      metadata: record.metadata || {}
    };
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar registro de payroll:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erro geral ao criar payroll:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePayrollRecord(id: string, record: Partial<PayrollRecord>) {
  const supabase = await createClient();
  
  try {
    // Verificar qual tabela existe: payroll ou payroll_records
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      // Tabela payroll não existe, tentar payroll_records
      tableName = 'payroll_records';
    }
    
    // Recalcular net_total se valores foram alterados
    let updateData: any = { ...record };
    
    if (record.base_salary !== undefined || record.subsidies !== undefined || record.deductions !== undefined || record.metadata) {
      // Buscar registro atual para obter valores não alterados
      const { data: currentRecord } = await supabase
        .from(tableName)
        .select('base_salary, subsidies, deductions, metadata')
        .eq('id', id)
        .single();
      
      if (currentRecord) {
        const base_salary = record.base_salary ?? (currentRecord as any).base_salary;
        const subsidies = (record.subsidies ?? (currentRecord as any).subsidies) || 0;
        const deductions = (record.deductions ?? (currentRecord as any).deductions) || 0;
        const metadata = (record.metadata ?? (currentRecord as any).metadata) || {};
        
        // Recalcular net_total
        let net_total = base_salary + subsidies;
        
        // Adicionar valores do metadata
        if (metadata.subsidios) {
          const subsidiosValues = Object.values(metadata.subsidios);
          net_total += subsidiosValues.reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
        }
        
        if (metadata.bonus) {
          net_total += metadata.bonus;
        }
        
        if (metadata.hora_extra?.total) {
          net_total += metadata.hora_extra.total;
        }
        
        // Subtrair deduções do metadata
        if (metadata.deducoes) {
          const deducoesValues = Object.values(metadata.deducoes);
          net_total -= deducoesValues.reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
        }
        
        net_total -= deductions;
        
        updateData.net_total = net_total;
      }
    }
    
    const { data, error } = await (supabase as any)
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar registro de payroll:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erro geral ao atualizar payroll:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePayrollRecord(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar qual tabela existe: payroll ou payroll_records
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      // Tabela payroll não existe, tentar payroll_records
      tableName = 'payroll_records';
    }
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Erro ao deletar registro de payroll:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro geral ao deletar payroll:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentMonthPayrollTotal() {
  const supabase = await createClient();
  
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Verificar qual tabela existe: payroll ou payroll_records
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      // Tabela payroll não existe, tentar payroll_records
      tableName = 'payroll_records';
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('net_total')
      .eq('reference_month', currentMonth);
    
    if (error) {
      console.error('❌ Erro ao buscar total do mês:', error);
      return { success: false, error: error.message, total: 0 };
    }
    
    const total = (data || []).reduce((sum: number, record: any) => sum + (record.net_total || 0), 0);
    
    return { success: true, total };
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar total do mês:', error);
    return { success: false, error: error.message, total: 0 };
  }
}

// Funções auxiliares para trabalhar com metadata JSONB
export async function addBonusToPayroll(id: string, bonus: number, motivo?: string) {
  const supabase = await createClient();
  
  try {
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      tableName = 'payroll_records';
    }
    
    // Buscar metadata atual
    const { data: currentRecord } = await supabase
      .from(tableName)
      .select('metadata')
      .eq('id', id)
      .single();
    
    const currentMetadata = (currentRecord as any)?.metadata || {};
    
    // Atualizar metadata com bónus
    const updatedMetadata = {
      ...currentMetadata,
      bonus: bonus,
      ...(motivo && { observacoes: motivo })
    };
    
    // Atualizar registro
    const { data, error } = await (supabase as any)
      .from(tableName)
      .update({ metadata: updatedMetadata })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao adicionar bónus:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erro geral ao adicionar bónus:', error);
    return { success: false, error: error.message };
  }
}

export async function addHoraExtraToPayroll(id: string, horas: number, valor_hora: number) {
  const supabase = await createClient();
  
  try {
    let tableName = 'payroll';
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      tableName = 'payroll_records';
    }
    
    // Buscar metadata atual
    const { data: currentRecord } = await supabase
      .from(tableName)
      .select('metadata')
      .eq('id', id)
      .single();
    
    const currentMetadata = (currentRecord as any)?.metadata || {};
    
    // Calcular total da hora extra
    const total = horas * valor_hora;
    
    // Atualizar metadata com hora_extra
    const updatedMetadata = {
      ...currentMetadata,
      hora_extra: {
        horas: horas,
        valor_hora: valor_hora,
        total: total
      }
    };
    
    // Atualizar registro
    const { data, error } = await (supabase as any)
      .from(tableName)
      .update({ metadata: updatedMetadata })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao adicionar hora extra:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Erro geral ao adicionar hora extra:', error);
    return { success: false, error: error.message };
  }
}
