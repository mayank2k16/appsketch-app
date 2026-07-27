import type { AxiosError } from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

import { fetchUserDomains, purchaseDomain, searchDomains } from './client';
import type { PurchaseDomainPayload } from './types';

export const domainKeys = {
  all: ['domains'] as const,
  search: (query: string) => [...domainKeys.all, 'search', query] as const,
  owned: () => [...domainKeys.all, 'owned'] as const,
};

/** `query` should already be debounced by the caller (see `useDebouncedValue`). */
export function useSearchDomains(query: string) {
  const q = query.trim();
  return useQuery<Awaited<ReturnType<typeof searchDomains>>, AxiosError>({
    queryKey: domainKeys.search(q),
    queryFn: () => searchDomains(q),
    enabled: q.length > 1,
  });
}

export function useUserDomains() {
  return useQuery<Awaited<ReturnType<typeof fetchUserDomains>>, AxiosError>({
    queryKey: domainKeys.owned(),
    queryFn: fetchUserDomains,
  });
}

export function usePurchaseDomain() {
  return useMutation<unknown, AxiosError, PurchaseDomainPayload>({
    mutationFn: (payload) => purchaseDomain(payload),
  });
}
