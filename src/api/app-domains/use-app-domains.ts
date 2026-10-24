import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { useGeoCurrency } from '@/lib/geo-currency';

import {
  attachDomain,
  connectDomain,
  disconnectDomain,
  fetchDomain,
  fetchMyDomains,
  retryDomain,
  searchDomains,
} from './client';
import type { DomainStage, DomainView } from './types';

export const appDomainKeys = {
  all: ['app-domains'] as const,
  search: (q: string) => [...appDomainKeys.all, 'search', q] as const,
  mine: () => [...appDomainKeys.all, 'mine'] as const,
  one: (id: number | string) =>
    [...appDomainKeys.all, 'one', String(id)] as const,
};

/** Stages that no longer change on their own — polling stops there. */
export const SETTLED_STAGES: DomainStage[] = ['live', 'failed'];

/** `q` must already be debounced (useDebouncedValue). */
export function useDomainSearch(q: string) {
  const query = q.trim().toLowerCase();
  const currency = useGeoCurrency((s) => s.currency);
  return useQuery({
    queryKey: [...appDomainKeys.search(query), currency],
    queryFn: () => searchDomains(query, currency),
    enabled: query.length > 1,
    staleTime: 60_000,
    retry: false,
  });
}

export function useMyDomains(enabled = true) {
  return useQuery<DomainView[], AxiosError>({
    queryKey: appDomainKeys.mine(),
    queryFn: fetchMyDomains,
    enabled,
    retry: false,
  });
}

/** Freshly checked on every fetch; `poll` turns on the 5s refresh. */
export function useDomain(id: number | string, poll: boolean) {
  return useQuery<DomainView, AxiosError>({
    queryKey: appDomainKeys.one(id),
    queryFn: () => fetchDomain(id),
    retry: false,
    refetchInterval: (q) =>
      poll && !SETTLED_STAGES.includes(q.state.data?.stage as DomainStage)
        ? 5000
        : false,
  });
}

function useSetDomain() {
  const qc = useQueryClient();
  return (d: DomainView) => {
    qc.setQueryData(appDomainKeys.one(d.id), d);
    void qc.invalidateQueries({ queryKey: appDomainKeys.mine() });
  };
}

export function useConnectDomain() {
  const onSuccess = useSetDomain();
  return useMutation({ mutationFn: connectDomain, onSuccess });
}

export function useAttachDomain() {
  const onSuccess = useSetDomain();
  return useMutation({ mutationFn: attachDomain, onSuccess });
}

export function useRetryDomain() {
  const onSuccess = useSetDomain();
  return useMutation({ mutationFn: retryDomain, onSuccess });
}

export function useDisconnectDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectDomain,
    onSuccess: () => qc.invalidateQueries({ queryKey: appDomainKeys.all }),
  });
}
