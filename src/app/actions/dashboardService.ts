'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface DashboardData {
  sales: {
    total: number;
    today: number;
    yesterday: number;
    count: number;
    todayCount: number;
    growth: number;
  };
  expenses: {
    total: number;
    today: number;
    count: number;
  };
  payroll: {
    total: number;
    currentMonth: number;
    count: number;
  };
  externalRevenue: {
    total: number;
    count: number;
  };
  taxes: {
    total: number;
    rate: number;
  };
  netProfit: number;
}

export async function getDashboardData(period: 'HOJE' | 'SEMANA' | 'MES' | 'ANO' = 'HOJE'): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  // Detectar se é mobile vs PC
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') || '';
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone');
  
  console.log('📱 DETECÇÃO:', { userAgent: userAgent.substring(0, 100), isMobile });
  
  const supabase = await createClient();
  
  try {
    console.log('🔍 DASHBOARD SERVICE: Calculando dados para período:', period);
    
    // Fuso horário de Angola (UTC+1) - FORÇADO
    const now = new Date();
    const angolaTime = new Date(now.getTime() + (60 * 60000)); // UTC+1
    angolaTime.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date = new Date(angolaTime);
    endDate.setHours(23, 59, 59, 999);
    
    switch (period) {
      case 'HOJE':
        startDate = new Date(angolaTime);
        break;
      case 'SEMANA':
        startDate = new Date(angolaTime);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'MES':
        startDate = new Date(angolaTime);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'ANO':
        startDate = new Date(angolaTime);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    console.log('📅 Período calculado (Angola UTC+1):', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      angolaTime: angolaTime.toISOString()
    });
    
    // 1. VENDAS POS - Tabela orders com status paid/completed
    console.log('🔍 Buscando orders com período:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: ['paid', 'completed'],
      isMobile: isMobile
    });
    
    // FORÇAR CACHE-BUSTING NO MOBILE com timestamp único
    const cacheBuster = isMobile ? `&_t=${Date.now()}` : '';
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['paid', 'completed'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    console.log('📊 Orders encontradas:', {
      count: ordersData?.length || 0,
      data: ordersData,
      error: ordersError
    });

    if (ordersError) {
      console.error('❌ Erro ao buscar orders:', ordersError);
      return { success: false, error: `Erro ao buscar vendas: ${ordersError.message}` };
    }

    // DEBUG: Verificar dados das orders
    if (ordersData && ordersData.length > 0) {
      console.log('📋 DADOS DAS ORDERS:');
      ordersData.forEach((order, index) => {
        console.log(`  Order ${index + 1}:`, {
          id: order.id,
          status: order.status,
          total: order.total,
          created_at: order.created_at
        });
      });
    } else {
      console.log('⚠️ NENHUMA ORDER ENCONTRADA! Verificando todas as orders...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(10);
      
      console.log('📋 TODAS AS ORDERS (limit 10):', {
        count: allOrders?.length || 0,
        data: allOrders,
        error: allOrdersError
      });
    }

    // 2. VENDAS DO DIA (para cálculo de hoje)
    const todayStart = new Date(angolaTime);
    const todayEnd = new Date(angolaTime);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayOrdersData, error: todayOrdersError } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['paid', 'completed'])
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (todayOrdersError) {
      console.error('❌ Erro ao buscar orders de hoje:', todayOrdersError);
    }

    // 3. VENDAS DE ONTEM (para cálculo de crescimento)
    const yesterdayStart = new Date(angolaTime);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const { data: yesterdayOrdersData, error: yesterdayOrdersError } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['paid', 'completed'])
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    if (yesterdayOrdersError) {
      console.error('❌ Erro ao buscar orders de ontem:', yesterdayOrdersError);
    }

    // 4. RECEITAS EXTERNAS - Tabela revenues (que não venham de orders)
    const { data: externalRevenueData, error: externalRevenueError } = await supabase
      .from('revenues')
      .select('*')
      .is('order_id', null) // Apenas receitas não vinculadas a orders
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (externalRevenueError) {
      console.error('❌ Erro ao buscar revenues externas:', externalRevenueError);
    }

    // 5. DESPESAS - Tabela expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (expensesError) {
      console.error('❌ Erro ao buscar expenses:', expensesError);
    }

    // 6. FOLHA SALARIAL - Tabela payroll (nome real no schema)
    const currentMonth = angolaTime.toISOString().slice(0, 7); // YYYY-MM
    const { data: payrollData, error: payrollError } = await supabase
      .from('payroll')  // CORRIGIDO: usar 'payroll' em vez de 'payroll_records'
      .select('*')
      .eq('status_pagamento', 'pago')  // CORRIGIDO: usar coluna real 'status_pagamento'
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (payrollError) {
      console.error('❌ Erro ao buscar payroll:', payrollError);
    }

    // 7. FOLHA DO MÊS ATUAL - USAR TABELA CORRETA
    const { data: currentMonthPayroll, error: currentMonthPayrollError } = await supabase
      .from('payroll')  // CORRIGIDO: usar 'payroll' em vez de 'payroll_records'
      .select('*')
      .eq('status_pagamento', 'pago')  // CORRIGIDO: usar coluna real 'status_pagamento'
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (currentMonthPayrollError) {
      console.error('❌ Erro ao buscar payroll do mês:', currentMonthPayrollError);
    }

    // CÁLCULOS
    const taxRate = 0.065; // 6.5%

    // VENDAS POS: Usar coluna 'total' (confirmada no schema)
    const salesPosTotal = ordersData?.reduce((sum, order) => {
      const amount = (order as any).total || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    const salesPosToday = todayOrdersData?.reduce((sum, order) => {
      const amount = (order as any).total || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    const salesPosYesterday = yesterdayOrdersData?.reduce((sum, order) => {
      const amount = (order as any).total || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    // RECEITAS EXTERNAS
    const externalRevenueTotal = externalRevenueData?.reduce((sum, revenue) => {
      const amount = (revenue as any).amount || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    // DESPESAS
    const expensesTotal = expensesData?.reduce((sum, expense) => {
      const amount = (expense as any).amount || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    // FOLHA SALARIAL
    const payrollTotal = payrollData?.reduce((sum, payroll) => {
      const amount = (payroll as any).amount || (payroll as any).net_total || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0) || 0;

    const payrollCurrentMonth = payrollTotal; // Usar total do período em vez de mês específico

    // TOTAIS FINAIS - UNIFICADO: ORDERS + REVENUES
    const totalSales = salesPosTotal + externalRevenueTotal;
    const totalTaxes = totalSales * taxRate;
    const netProfit = totalSales - expensesTotal - payrollTotal - totalTaxes;

    // CÁLCULO DE CRESCIMENTO
    const growthPercentage = salesPosYesterday > 0 
      ? ((salesPosToday - salesPosYesterday) / salesPosYesterday) * 100
      : (salesPosToday > 0 ? 100 : 0);

    // DEBUG: Mostrar todos os cálculos
    console.log('🧮 CÁLCULOS FINAIS:', {
      salesPosTotal,
      salesPosToday,
      salesPosYesterday,
      externalRevenueTotal,
      expensesTotal,
      payrollTotal,
      totalSales,
      totalTaxes,
      netProfit,
      growthPercentage,
      ordersCount: ordersData?.length || 0,
      todayOrdersCount: todayOrdersData?.length || 0
    });

    const dashboardData: DashboardData = {
      sales: {
        total: totalSales,
        today: salesPosToday,
        yesterday: salesPosYesterday,
        count: ordersData?.length || 0,
        todayCount: todayOrdersData?.length || 0,
        growth: growthPercentage
      },
      expenses: {
        total: expensesTotal,
        today: 0, // TODO: Implementar se necessário
        count: expensesData?.length || 0
      },
      payroll: {
        total: payrollTotal,
        currentMonth: payrollCurrentMonth,
        count: payrollData?.length || 0
      },
      externalRevenue: {
        total: externalRevenueTotal,
        count: externalRevenueData?.length || 0
      },
      taxes: {
        total: totalTaxes,
        rate: taxRate
      },
      netProfit
    };

    console.log('✅ DASHBOARD SERVICE: Dados calculados:', {
      period,
      sales: dashboardData.sales,
      expenses: dashboardData.expenses,
      payroll: dashboardData.payroll,
      externalRevenue: dashboardData.externalRevenue,
      taxes: dashboardData.taxes,
      netProfit: dashboardData.netProfit,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: dashboardData
    };

  } catch (error) {
    console.error('❌ Erro geral no getDashboardData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao calcular dados do dashboard'
    };
  }
}
