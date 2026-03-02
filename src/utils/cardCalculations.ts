// Função utilitária para apresentar valores dos cards de forma segura e consistente
// Usada em owner/mobile (desktop e telefone) para manter a mesma lógica

import { formatKz } from '@/services/utils/currencyFormatter';

interface CardData {
  value: number;
  label: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

interface PayrollData {
  netSalary?: number;
  net_salary?: number;
  amount?: number;
  baseSalary?: number;
  base_salary?: number;
}

interface ExpenseData {
  amount?: number;
  value?: number;
}

/**
 * Formata valores de forma segura com fallback para 0
 * @param value - Valor numérico ou undefined/null
 * @returns Valor formatado em Kwanza (AOA)
 */
export const formatCardValue = (value: number | undefined | null): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return formatKz(0);
  }
  return formatKz(value);
};

/**
 * Calcula total de despesas de forma segura
 * @param expenses - Array de despesas
 * @returns Total calculado com fallback para 0
 */
export const calculateTotalExpenses = (expenses: ExpenseData[]): number => {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  
  return expenses.reduce((total: number, expense: ExpenseData) => {
    const amount = expense.amount || expense.value || 0;
    return total + (typeof amount === 'number' && !isNaN(amount) ? amount : 0);
  }, 0);
};

/**
 * Calcula total da folha de pagamento de forma segura
 * @param payroll - Array de registros de folha de pagamento
 * @returns Total calculado com fallback para 0
 */
export const calculateTotalPayroll = (payroll: PayrollData[]): number => {
  if (!Array.isArray(payroll) || payroll.length === 0) {
    return 0;
  }
  
  return payroll.reduce((total: number, record: PayrollData) => {
    // Tentar diferentes campos possíveis para o salário líquido
    const netSalary = record.netSalary || record.net_salary || record.amount || 0;
    return total + (typeof netSalary === 'number' && !isNaN(netSalary) ? netSalary : 0);
  }, 0);
};

/**
 * Calcula total de receitas de forma segura
 * @param orders - Array de pedidos
 * @returns Total calculado com fallback para 0
 */
export const calculateTotalRevenue = (orders: any[]): number => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return 0;
  }
  
  return orders.reduce((total: number, order: any) => {
    // Tentar diferentes campos possíveis para o total
    const orderTotal = order.total || order.amount || 0;
    
    // Se não tiver total, calcular dos itens
    if (!orderTotal && order.items && Array.isArray(order.items)) {
      const itemsTotal = order.items.reduce((itemsSum: number, item: any) => {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        return itemsSum + (itemPrice * itemQuantity);
      }, 0);
      return total + itemsTotal;
    }
    
    return total + (typeof orderTotal === 'number' && !isNaN(orderTotal) ? orderTotal : 0);
  }, 0);
};

/**
 * Cria objeto de dados para card de despesas
 * @param expenses - Array de despesas
 * @param period - Período para descrição
 * @returns Objeto com dados formatados para o card
 */
export const createExpensesCardData = (
  expenses: ExpenseData[], 
  period: string = 'período'
): CardData => {
  const total = calculateTotalExpenses(expenses);
  
  return {
    value: total,
    label: 'Despesas',
    description: period.toLowerCase(),
    color: 'text-red-400',
    bgColor: 'bg-gradient-to-br from-red-600 to-red-800',
    borderColor: 'border-red-500/30'
  };
};

/**
 * Cria objeto de dados para card de folha de pagamento
 * @param payroll - Array de registros de folha de pagamento
 * @param period - Período para descrição
 * @returns Objeto com dados formatados para o card
 */
export const createPayrollCardData = (
  payroll: PayrollData[], 
  period: string = 'período'
): CardData => {
  const total = calculateTotalPayroll(payroll);
  
  return {
    value: total,
    label: 'Folha Salarial',
    description: 'total líquido',
    color: 'text-red-400',
    bgColor: 'bg-gradient-to-br from-red-600 to-red-800',
    borderColor: 'border-red-500/30'
  };
};

/**
 * Cria objeto de dados para card de receitas
 * @param orders - Array de pedidos
 * @param period - Período para descrição
 * @returns Objeto com dados formatados para o card
 */
export const createRevenueCardData = (
  orders: any[], 
  period: string = 'período'
): CardData => {
  const total = calculateTotalRevenue(orders);
  
  return {
    value: total,
    label: 'Receita Total',
    description: period.toLowerCase(),
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-600 to-purple-800',
    borderColor: 'border-purple-500/30'
  };
};

/**
 * Cria objeto de dados para card de impostos
 * @param revenue - Valor da receita
 * @param taxRate - Alíquota de imposto (padrão 6.5%)
 * @returns Objeto com dados formatados para o card
 */
export const createTaxCardData = (
  revenue: number, 
  taxRate: number = 0.065
): CardData => {
  const taxAmount = revenue * taxRate;
  
  return {
    value: taxAmount,
    label: 'Impostos',
    description: `${(taxRate * 100).toFixed(1)}% sobre faturação`,
    color: 'text-indigo-400',
    bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
    borderColor: 'border-indigo-500/30'
  };
};

/**
 * Renderiza card genérico com estilo consistente
 * @param data - Dados do card
 * @param icon - Ícone opcional
 * @returns JSX do card formatado
 */
export const renderCard = (data: CardData, icon?: React.ReactNode) => {
  return {
    value: formatCardValue(data.value),
    label: data.label,
    description: data.description,
    icon,
    color: data.color,
    bgColor: data.bgColor,
    borderColor: data.borderColor
  };
};

/**
 * Hook customizado para calcular estatísticas de forma segura
 * @param data - Dados brutos
 * @param period - Período selecionado
 * @returns Estatísticas calculadas
 */
export const useSafeCardCalculations = (
  data: {
    orders?: any[];
    expenses?: ExpenseData[];
    payroll?: PayrollData[];
  },
  period: string = 'período'
) => {
  const expensesCard = createExpensesCardData(data.expenses || [], period);
  const payrollCard = createPayrollCardData(data.payroll || [], period);
  const revenueCard = createRevenueCardData(data.orders || [], period);
  const taxCard = createTaxCardData(revenueCard.value);

  return {
    expenses: renderCard(expensesCard),
    payroll: renderCard(payrollCard),
    revenue: renderCard(revenueCard),
    tax: renderCard(taxCard),
    totals: {
      expenses: expensesCard.value,
      payroll: payrollCard.value,
      revenue: revenueCard.value,
      tax: taxCard.value,
      net: revenueCard.value - expensesCard.value - payrollCard.value - taxCard.value
    }
  };
};
