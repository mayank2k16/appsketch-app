import { useQuery } from '@tanstack/react-query';

import { useGeoCurrency } from '@/lib/geo-currency';

import { fetchCatalogue, fetchOrder } from './client';
import type { OrderStatus } from './types';

export const appCartKeys = {
  catalogue: ['app-cart', 'catalogue'] as const,
  order: (id: number | string) => ['app-cart', 'order', String(id)] as const,
};

export function useCatalogue() {
  const currency = useGeoCurrency((s) => s.currency);
  return useQuery({
    queryKey: [...appCartKeys.catalogue, currency],
    queryFn: () => fetchCatalogue(currency),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

const DONE: OrderStatus[] = ['fulfilled', 'failed'];

/** Polls every 3s until the order is fulfilled or failed. */
export function useOrder(id: number | null) {
  return useQuery({
    queryKey: appCartKeys.order(id ?? 0),
    queryFn: () => fetchOrder(id as number),
    enabled: id != null,
    retry: 2,
    refetchInterval: (q) =>
      q.state.data && DONE.includes(q.state.data.status) ? false : 3000,
  });
}
