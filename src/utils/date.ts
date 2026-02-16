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
