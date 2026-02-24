export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '0,00 AKZ';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0,00 AKZ';

  // Usando 'AKZ' explicitamente conforme solicitado pelo usuário (em vez de AOA ou Kz)
  return numericAmount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' AKZ';
};
