import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createReferralRule,
  deleteReferralRule,
  fetchReferralLinkConfig,
  fetchReferralRules,
  fetchReferralsAnalytics,
  fetchReferralsList,
  updateReferralLinkConfig,
  updateReferralRule,
} from './client';
import type {
  ReferralRulePayload,
  ReferralStatus,
  UpdateReferralLinkConfigPayload,
} from './types';

export const referralKeys = {
  all: ['referrals'] as const,
  rules: () => [...referralKeys.all, 'rules'] as const,
  list: (status: ReferralStatus | 'ALL') => [...referralKeys.all, 'list', status] as const,
  analytics: () => [...referralKeys.all, 'analytics'] as const,
  linkConfig: () => [...referralKeys.all, 'link-config'] as const,
};

const LIST_PAGE_SIZE = 25;

export function useReferralRules() {
  return useQuery<Awaited<ReturnType<typeof fetchReferralRules>>, AxiosError>({
    queryKey: referralKeys.rules(),
    queryFn: fetchReferralRules,
  });
}

export function useCreateReferralRule() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, ReferralRulePayload>({
    mutationFn: (payload) => createReferralRule(payload),
    onSuccess: () => {
      toast.success('Rule created');
      queryClient.invalidateQueries({ queryKey: referralKeys.rules() });
    },
    onError: () => toast.error('Could not save rule'),
  });
}

export function useUpdateReferralRule() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: Partial<ReferralRulePayload> }>({
    mutationFn: ({ id, payload }) => updateReferralRule(id, payload),
    onSuccess: () => {
      toast.success('Rule updated');
      queryClient.invalidateQueries({ queryKey: referralKeys.rules() });
    },
    onError: () => toast.error('Could not save rule'),
  });
}

export function useDeleteReferralRule() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteReferralRule(id),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: referralKeys.rules() });
    },
    onError: () => toast.error('Could not delete rule'),
  });
}

/** Cursor-paginated referrals list — same `useInfiniteQuery` recipe as
 * Wallets' `useWallets` (`src/api/wallets/use-wallets.ts`). */
export function useReferralsList(status: ReferralStatus | 'ALL') {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchReferralsList>>, AxiosError>({
    queryKey: referralKeys.list(status),
    queryFn: ({ pageParam }) =>
      fetchReferralsList({
        limit: LIST_PAGE_SIZE,
        cursor: (pageParam as string | number | null) ?? undefined,
        status,
      }),
    initialPageParam: null as string | number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}

export function useReferralsAnalytics() {
  return useQuery<Awaited<ReturnType<typeof fetchReferralsAnalytics>>, AxiosError>({
    queryKey: referralKeys.analytics(),
    queryFn: fetchReferralsAnalytics,
  });
}

export function useReferralLinkConfig() {
  return useQuery<Awaited<ReturnType<typeof fetchReferralLinkConfig>>, AxiosError>({
    queryKey: referralKeys.linkConfig(),
    queryFn: fetchReferralLinkConfig,
  });
}

export function useUpdateReferralLinkConfig() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, UpdateReferralLinkConfigPayload>({
    mutationFn: (payload) => updateReferralLinkConfig(payload),
    onSuccess: () => {
      toast.success('Referral link settings saved');
      queryClient.invalidateQueries({ queryKey: referralKeys.linkConfig() });
    },
    onError: () => toast.error('Could not save link settings'),
  });
}
