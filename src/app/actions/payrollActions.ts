'use server';

import { createClient } from '@/lib/supabase/server';

export interface PayrollRecord {
  id?: string;
  staff_id?: string;
  staff_name: string;
  base_salary: number;
  subsidies: number;
  deductions: number;
  net_total?: number;
  reference_month: string;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  created_at?: string;
  updated_at?: string;
}

export async function getPayrollRecords() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
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
    // Calcular net_total automaticamente
    const net_total = record.base_salary + record.subsidies - record.deductions;
    
    const { data, error } = await supabase
      .from('payroll')
      .insert({
        ...record,
        net_total
      })
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
    // Recalcular net_total se valores base foram alterados
    let updateData = { ...record };
    if (record.base_salary !== undefined || record.subsidies !== undefined || record.deductions !== undefined) {
      // Buscar registro atual para obter valores não alterados
      const { data: currentRecord } = await supabase
        .from('payroll')
        .select('base_salary, subsidies, deductions')
        .eq('id', id)
        .single();
      
      if (currentRecord) {
        const base_salary = record.base_salary ?? currentRecord.base_salary;
        const subsidies = record.subsidies ?? currentRecord.subsidies;
        const deductions = record.deductions ?? currentRecord.deductions;
        updateData.net_total = base_salary + subsidies - deductions;
      }
    }
    
    const { data, error } = await supabase
      .from('payroll')
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
    const { error } = await supabase
      .from('payroll')
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
    
    const { data, error } = await supabase
      .from('payroll')
      .select('net_total')
      .eq('reference_month', currentMonth);
    
    if (error) {
      console.error('❌ Erro ao buscar total do mês:', error);
      return { success: false, error: error.message, total: 0 };
    }
    
    const total = (data || []).reduce((sum, record) => sum + (record.net_total || 0), 0);
    
    return { success: true, total };
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar total do mês:', error);
    return { success: false, error: error.message, total: 0 };
  }
}
