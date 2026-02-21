import { formatKz } from '@/services/utils/currencyFormatter';

export function formatAOA(value: number | undefined | null): string {
  return formatKz(value);
}
