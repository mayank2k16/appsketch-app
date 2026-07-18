import type { AxiosError } from 'axios';
import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchStockHistory } from './client';

export const stockHistoryKeys = {
  all: ['stock-history'] as const,
  list: () => [...stockHistoryKeys.all, 'list'] as const,
};

const PAGE_SIZE = 10;

/** Same offset-accumulation `useInfiniteQuery` recipe as `Invoices`'
 * `useInvoices` (`src/api/invoices/use-invoices.ts`) — Vite's own version of
 * this pagination (in `StockHistory.jsx`) double-fetches on scroll due to a
 * stale-closure bug; this is the correct, single-fetch-per-page version. */
export function useStockHistory() {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchStockHistory>>, AxiosError>({
    queryKey: stockHistoryKeys.list(),
    queryFn: ({ pageParam }) => fetchStockHistory(pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.results.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });
}
