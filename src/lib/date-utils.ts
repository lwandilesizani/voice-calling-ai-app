/**
 * Simple date formatting utility to replace date-fns
 */

/**
 * Format a date according to the specified format string
 * Supported format tokens:
 * - yyyy: 4-digit year
 * - MM: 2-digit month
 * - dd: 2-digit day
 * - HH: 2-digit hour (24-hour)
 * - mm: 2-digit minute
 * - ss: 2-digit second
 * - PPP: Long date format (e.g., "April 29, 2023")
 * 
 * @param date The date to format
 * @param formatStr The format string
 * @returns The formatted date string
 */
export function format(date: Date, formatStr: string): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  // Handle special format strings
  if (formatStr === 'PPP') {
    return formatLongDate(date);
  }

  const tokens: Record<string, () => string> = {
    yyyy: () => date.getFullYear().toString(),
    MM: () => padZero(date.getMonth() + 1),
    dd: () => padZero(date.getDate()),
    HH: () => padZero(date.getHours()),
    mm: () => padZero(date.getMinutes()),
    ss: () => padZero(date.getSeconds()),
  };

  let result = formatStr;
  for (const [token, fn] of Object.entries(tokens)) {
    result = result.replace(token, fn());
  }

  return result;
}

/**
 * Format a date in a long format (e.g., "April 29, 2023")
 */
function formatLongDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

/**
 * Pad a number with a leading zero if it's less than 10
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : num.toString();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Parse a date string in the format "YYYY-MM-DD"
 */
export function parseISO(dateStr: string): Date {
  return new Date(dateStr);
} 