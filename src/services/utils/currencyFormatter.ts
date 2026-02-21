export const formatKz = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0,00 Kz';
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};
export const formatKzDetailed = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0,00 Kz';
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};
