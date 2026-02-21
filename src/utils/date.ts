export function getAngolaToday(): string {
  // Get current date in Luanda timezone (UTC+1)
  const now = new Date();
  const luandaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const [year, month, day] = luandaDateStr.split('-').map(Number);

  // Create date at 00:00:00 Luanda time
  // Luanda is UTC+1, so 00:00 Luanda is 23:00 UTC previous day
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  date.setUTCHours(date.getUTCHours() - 1);

  return date.toISOString();
}

/**
 * Formats a date string or Date object to a readable string in Luanda timezone
 * @param date - Date string or Date object
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateInLuanda(
  date: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('pt-AO', {
    timeZone: 'Africa/Luanda',
    ...options
  }).format(d);
}
