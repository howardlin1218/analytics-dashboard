import { isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from '../context/FilterContext';

export function filterItemsByDateRange<T extends { created_at?: string; timestamp?: string }>(
  items: T[],
  range: DateRange
): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    const rawDate = item.created_at || item.timestamp;
    if (!rawDate) return true;
    try {
      const itemDate = parseISO(rawDate);
      return isWithinInterval(itemDate, { start: range.startDate, end: range.endDate });
    } catch {
      return true;
    }
  });
}
