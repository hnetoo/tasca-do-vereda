// Função utilitária global para formatar moeda Kwanza de Angola
export const formatKwanza = (value: number): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Versão simplificada para valores grandes (ex: 1.250K Kz)
export const formatKwanzaShort = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M Kz`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K Kz`;
  }
  return formatKwanza(value);
};

// Versão compacta para cards (sem decimais)
export const formatKwanzaCompact = (value: number): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
