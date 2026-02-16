export const getOrderDate = (timestamp?: string | number | Date) => {
  const d = timestamp ? new Date(timestamp) : new Date(0);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

export const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const buildDateRange = (start: Date, end: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};
