import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { useGeoCurrency } from '@/lib/geo-currency';

import { fetchSubscriptionPlans } from './client';

export const subscriptionPlanKeys = {
  all: ['subscription-plans'] as const,
  list: (currency?: string) =>
    [...subscriptionPlanKeys.all, 'list', currency] as const,
};

/** In the launch-time geo currency (INR in India, USD elsewhere). */
export function useSubscriptionPlans() {
  const currency = useGeoCurrency((s) => s.currency);
  return useQuery<
    Awaited<ReturnType<typeof fetchSubscriptionPlans>>,
    AxiosError
  >({
    queryKey: subscriptionPlanKeys.list(currency),
    queryFn: () => fetchSubscriptionPlans(currency),
    staleTime: 5 * 60 * 1000,
  });
}
