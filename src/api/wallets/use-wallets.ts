import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { adjustWalletBalance, fetchWalletTransactions, fetchWallets } from './client';
import type { AdjustWalletPayload, WalletActiveFilter } from './types';

export const walletKeys = {
  all: ['wallets'] as const,
  list: (filters: { q: string; activeFilter: WalletActiveFilter }) =>
    [...walletKeys.all, 'list', filters] as const,
  transactions: (walletId: number) => [...walletKeys.all, 'transactions', walletId] as const,
};

const PAGE_SIZE = 25;

/** Cursor-paginated wallet list — unlike the rest of CMS's full-fetch tabs,
 * this list can be large (one row per user), so it's driven by
 * `useInfiniteQuery` + `FlatList.onEndReached` instead. */
export function useWallets(filters: { q: string; activeFilter: WalletActiveFilter }) {
  const { q, activeFilter } = filters;
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchWallets>>, AxiosError>({
    queryKey: walletKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchWallets({
        limit: PAGE_SIZE,
        cursor: (pageParam as string | number | null) ?? undefined,
        ...(q ? { q } : {}),
        ...(activeFilter === 'ACTIVE' ? { active: 'true' } : activeFilter === 'INACTIVE' ? { active: 'false' } : {}),
      }),
    initialPageParam: null as string | number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });
}

export function useWalletTransactions(walletId: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchWalletTransactions>>, AxiosError>({
    queryKey: walletKeys.transactions(walletId ?? -1),
    queryFn: () => fetchWalletTransactions({ wallet: walletId as number, limit: 50 }),
    enabled: walletId !== null,
  });
}

export function useAdjustWallet() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<{ msg?: string }>, AdjustWalletPayload>({
    mutationFn: (payload) => adjustWalletBalance(payload),
    onSuccess: (_data, payload) => {
      toast.success(
        `Wallet ${payload.direction === 'CREDIT' ? 'credited' : 'debited'} successfully.`
      );
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.msg || 'Adjustment failed. Please try again.');
    },
  });
}
