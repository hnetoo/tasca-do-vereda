'use server';

import { createClient } from '@/lib/supabase/server';

export interface PayrollRecord {
  id?: string;
  funcionario_name: string;
  valor_base: number;
  subsidios: number;
  descontos: number;
  total_liquido?: number;
  mes_referencia: string;
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
    // Calcular total_liquido automaticamente
    const total_liquido = record.valor_base + record.subsidios - record.descontos;
    
    const { data, error } = await supabase
      .from('payroll')
      .insert({
        ...record,
        total_liquido
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
    // Recalcular total_liquido se valores base foram alterados
    let updateData = { ...record };
    if (record.valor_base !== undefined || record.subsidios !== undefined || record.descontos !== undefined) {
      // Buscar registro atual para obter valores não alterados
      const { data: currentRecord } = await supabase
        .from('payroll')
        .select('valor_base, subsidios, descontos')
        .eq('id', id)
        .single();
      
      if (currentRecord) {
        const valor_base = record.valor_base ?? currentRecord.valor_base;
        const subsidios = record.subsidios ?? currentRecord.subsidios;
        const descontos = record.descontos ?? currentRecord.descontos;
        updateData.total_liquido = valor_base + subsidios - descontos;
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
      .select('total_liquido')
      .eq('mes_referencia', currentMonth);
    
    if (error) {
      console.error('❌ Erro ao buscar total do mês:', error);
      return { success: false, error: error.message, total: 0 };
    }
    
    const total = (data || []).reduce((sum, record) => sum + (record.total_liquido || 0), 0);
    
    return { success: true, total };
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar total do mês:', error);
    return { success: false, error: error.message, total: 0 };
  }
}
