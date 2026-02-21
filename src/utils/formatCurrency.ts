export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') return '0,00 Kz';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0,00 Kz';

  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
};
