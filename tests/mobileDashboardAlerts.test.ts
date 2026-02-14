import { buildMobileAlerts, calculateTodayFinance } from '../pages/MobileDashboard';

describe('buildMobileAlerts', () => {
  it('cria alertas baseados nos limites configurados', () => {
    const alerts = buildMobileAlerts({
      todaySales: 600,
      avg7Days: 1000,
      averagePreparationTime: 45,
      liveActiveOrders: 12,
      config: { revenueDropPercent: 30, prepTimeLimit: 30, activeOrdersLimit: 10 }
    });
    expect(alerts.some(a => a.title === 'Faturamento Baixo')).toBe(true);
    expect(alerts.some(a => a.title === 'Atraso na Cozinha')).toBe(true);
    expect(alerts.some(a => a.title === 'Alta Demanda')).toBe(true);
  });

  it('não cria alerta de faturamento quando a queda não ultrapassa o limite', () => {
    const alerts = buildMobileAlerts({
      todaySales: 750,
      avg7Days: 1000,
      averagePreparationTime: 10,
      liveActiveOrders: 2,
      config: { revenueDropPercent: 30, prepTimeLimit: 30, activeOrdersLimit: 10 }
    });
    expect(alerts.length).toBe(0);
  });
});

describe('calculateTodayFinance', () => {
  it('calcula fluxo de caixa e lucro líquido do dia', () => {
    const result = calculateTodayFinance({ todaySales: 2000, todayExpenses: 500, grossProfitToday: 1200 });
    expect(result.cashFlowToday).toBe(1500);
    expect(result.netProfitToday).toBe(700);
  });
});
