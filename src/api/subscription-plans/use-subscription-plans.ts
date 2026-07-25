import type { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import { fetchSubscriptionPlans } from './client';

export const subscriptionPlanKeys = {
  all: ['subscription-plans'] as const,
  list: () => [...subscriptionPlanKeys.all, 'list'] as const,
};

export function useSubscriptionPlans() {
  return useQuery<Awaited<ReturnType<typeof fetchSubscriptionPlans>>, AxiosError>({
    queryKey: subscriptionPlanKeys.list(),
    queryFn: fetchSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  });
}
