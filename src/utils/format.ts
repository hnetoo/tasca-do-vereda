export function formatAOA(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return '0,00 AOA';
  }
  
  // Create formatter for Angola currency
  const formatter = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Intl default for pt-AO is 'Kz', but user requested 'AOA' for null case.
  // We'll stick to standard 'Kz' for numbers unless user complains.
  // The '0,00 AOA' for null is a specific requirement.
  return formatter.format(value);
}
