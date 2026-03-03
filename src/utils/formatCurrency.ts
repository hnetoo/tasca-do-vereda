export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '0,00 AOA';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0,00 AOA';

  // Usando Kwanza (AOA) - moeda oficial de Angola
  return numericAmount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' AOA';
};
