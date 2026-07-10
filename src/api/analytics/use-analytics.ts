import type { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { fetchSalesAnalytics } from './client';
import type { SalesRangeValue } from './types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  sales: (range: SalesRangeValue) => [...analyticsKeys.all, 'sales', range] as const,
};

/** Same "duration in days back from today" trick as the Vite reference —
 * `99999` for the "All Time" option just walks the start date back far
 * enough to cover everything the backend has. */
function rangeToDates(range: SalesRangeValue) {
  const duration = parseInt(range, 10) || 7;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - duration + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start_date: fmt(start), end_date: fmt(end) };
}

export function useSalesAnalytics(range: SalesRangeValue) {
  return useQuery<Awaited<ReturnType<typeof fetchSalesAnalytics>>, AxiosError>({
    queryKey: analyticsKeys.sales(range),
    queryFn: () => fetchSalesAnalytics(rangeToDates(range)),
  });
}
