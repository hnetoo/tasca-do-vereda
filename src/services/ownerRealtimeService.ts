'use client';

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type RevenueRow = Database['public']['Tables']['revenues']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

type FinancialTx = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'REVENUE' | 'EXPENSE';
  status?: string;
};

export class OwnerRealtimeService {
  private supabase: ReturnType<typeof createClient>;
  private subscriptions: Map<string, any> = new Map();
  private listeners: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.supabase = createClient();
  }

  // Obter dados financeiros em tempo real
  async getFinancialData(period: 'HOJE' | 'SEMANA' | 'MES' | 'CUSTOM' = 'HOJE', start?: string, end?: string) {
    const range = this.computeDateRange(period, start, end);
    
    try {
      console.log('Buscando dados financeiros no período:', range);
      
      // Buscar dados das tabelas de forma mais simples
      const revenuesRes = await this.supabase
        .from('revenues')
        .select('*')
        .gte('created_at', range.start)
        .lte('created_at', range.end)
        .order('created_at', { ascending: false });

      const expensesRes = await this.supabase
        .from('expenses')
        .select('*')
        .gte('created_at', range.start)
        .lte('created_at', range.end)
        .order('created_at', { ascending: false });

      const ordersRes = await this.supabase
        .from('orders')
        .select('id,total,created_at')
        .gte('created_at', range.start)
        .lte('created_at', range.end)
        .order('created_at', { ascending: false });

      console.log('Resultados:', { revenues: revenuesRes.data, expenses: expensesRes.data, orders: ordersRes.data });
      console.log('Erros:', { revenues: revenuesRes.error, expenses: expensesRes.error, orders: ordersRes.error });

      // Buscar totais do mês
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const monthRevenueRes = await this.supabase
        .from('revenues')
        .select('amount')
        .gte('created_at', monthStart);

      // Processar transações
      const transactions: FinancialTx[] = [];
      
      // Adicionar receitas
      (revenuesRes.data || []).forEach((r: RevenueRow) => {
        transactions.push({
          id: r.id,
          date: r.created_at || '',
          amount: Number(r.amount || 0),
          description: r.description || 'Receita',
          category: r.category || 'REVENUE',
          type: 'REVENUE',
          status: 'COMPLETED'
        });
      });

      // Adicionar despesas
      (expensesRes.data || []).forEach((e: ExpenseRow) => {
        transactions.push({
          id: e.id,
          date: e.created_at || '',
          amount: Number(e.amount || 0),
          description: e.description || 'Despesa',
          category: e.category || 'EXPENSE',
          type: 'EXPENSE',
          status: 'COMPLETED'
        });
      });

      // Ordenar por data
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calcular totais
      const revenueTotal = (revenuesRes.data as RevenueRow[] || []).reduce((sum: number, r: RevenueRow) => sum + Number(r.amount || 0), 0);
      const expenseTotal = (expensesRes.data as ExpenseRow[] || []).reduce((sum: number, e: ExpenseRow) => sum + Number(e.amount || 0), 0);
      const monthTotal = (monthRevenueRes.data as RevenueRow[] || []).reduce((sum: number, r: RevenueRow) => sum + Number(r.amount || 0), 0);
      const ordersCount = (ordersRes.data || []).length;

      console.log('Totais calculados:', { revenueTotal, expenseTotal, monthTotal, ordersCount });

      return {
        success: true,
        data: {
          transactions,
          revenueTotal,
          expenseTotal,
          monthTotal,
          ordersCount,
          revenues: revenuesRes.data || [],
          expenses: expensesRes.data || [],
          orders: ordersRes.data || []
        }
      };
    } catch (error: any) {
      console.error('Erro ao buscar dados financeiros:', error);
      return {
        success: false,
        error: error.message || 'Falha ao carregar dados financeiros',
        data: {
          transactions: [],
          revenueTotal: 0,
          expenseTotal: 0,
          monthTotal: 0,
          ordersCount: 0,
          revenues: [],
          expenses: [],
          orders: []
        }
      };
    }
  }

  // Inscrever para atualizações em tempo real
  subscribeToFinancialUpdates(callback: (data: any) => void) {
    const listenerId = `financial_${Date.now()}`;
    this.listeners.set(listenerId, callback);

    // Inscrever para mudanças em revenues
    const revenueSubscription = this.supabase
      .channel('revenues_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'revenues' 
        }, 
        (payload) => {
          callback({ type: 'revenue', payload });
        }
      )
      .subscribe();

    // Inscrever para mudanças em expenses
    const expenseSubscription = this.supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'expenses' 
        }, 
        (payload) => {
          callback({ type: 'expense', payload });
        }
      )
      .subscribe();

    // Inscrever para mudanças em orders
    const orderSubscription = this.supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          callback({ type: 'order', payload });
        }
      )
      .subscribe();

    // Armazenar subscriptions
    this.subscriptions.set(`${listenerId}_revenues`, revenueSubscription);
    this.subscriptions.set(`${listenerId}_expenses`, expenseSubscription);
    this.subscriptions.set(`${listenerId}_orders`, orderSubscription);

    return listenerId;
  }

  // Cancelar inscrição
  unsubscribe(listenerId: string) {
    // Remover listener
    this.listeners.delete(listenerId);

    // Cancelar subscriptions
    const revenueSub = this.subscriptions.get(`${listenerId}_revenues`);
    const expenseSub = this.subscriptions.get(`${listenerId}_expenses`);
    const orderSub = this.subscriptions.get(`${listenerId}_orders`);

    if (revenueSub) revenueSub.unsubscribe();
    if (expenseSub) expenseSub.unsubscribe();
    if (orderSub) orderSub.unsubscribe();

    // Limpar subscriptions
    this.subscriptions.delete(`${listenerId}_revenues`);
    this.subscriptions.delete(`${listenerId}_expenses`);
    this.subscriptions.delete(`${listenerId}_orders`);
  }

  // Cancelar todas as inscrições
  unsubscribeAll() {
    this.subscriptions.forEach((sub, key) => {
      sub.unsubscribe();
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }

  private computeDateRange(period: 'HOJE' | 'SEMANA' | 'MES' | 'CUSTOM', start?: string, end?: string) {
    const now = new Date();
    
    switch (period) {
      case 'HOJE':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        return { start: todayStart, end: todayEnd };
        
      case 'SEMANA':
        const d = new Date(now);
        const day = d.getDay() || 7;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - day + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return { 
          start: weekStart.toISOString(), 
          end: weekEnd.toISOString() 
        };
        
      case 'MES':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        return { start: monthStart, end: monthEnd };
        
      case 'CUSTOM':
        return { start: start || now.toISOString(), end: end || now.toISOString() };
        
      default:
        return { start: now.toISOString(), end: now.toISOString() };
    }
  }

  // Testar conexão
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('revenues')
        .select('count', { count: 'exact', head: true });
      
      return { success: !error, error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton
export const ownerRealtimeService = new OwnerRealtimeService();
