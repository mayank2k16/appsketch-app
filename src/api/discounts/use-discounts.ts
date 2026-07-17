import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { createDiscount, deleteDiscount, fetchAllInvoices, fetchDiscountCodes, updateDiscount } from './client';
import type { DiscountPayload } from './types';

export const discountKeys = {
  all: ['discounts'] as const,
  list: () => [...discountKeys.all, 'list'] as const,
  allInvoices: ['discounts', 'all-invoices'] as const,
};

// Named `useDiscountCodes` (not `useDiscounts`) — `@/api/orders` already
// exports `useDiscounts`/`fetchDiscounts` for its own narrower
// order-creation dropdown, and both domains are flat-barrel-exported from
// `src/api/index.tsx`.
export function useDiscountCodes() {
  return useQuery<Awaited<ReturnType<typeof fetchDiscountCodes>>, AxiosError>({
    queryKey: discountKeys.list(),
    queryFn: fetchDiscountCodes,
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, DiscountPayload>({
    mutationFn: (payload) => createDiscount(payload),
    onSuccess: () => {
      toast.success('Discount Code saved Successfully');
      queryClient.invalidateQueries({ queryKey: discountKeys.list() });
    },
    onError: () => toast.error('Error while saving discount'),
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: DiscountPayload }>({
    mutationFn: ({ id, payload }) => updateDiscount(id, payload),
    onSuccess: () => {
      toast.success('Discount Code saved Successfully');
      queryClient.invalidateQueries({ queryKey: discountKeys.list() });
    },
    onError: () => toast.error('Error while saving discount'),
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteDiscount(id),
    onSuccess: () => {
      toast.success('Discount deleted successfully');
      queryClient.invalidateQueries({ queryKey: discountKeys.list() });
    },
    onError: () => toast.error('Failed to delete discount'),
  });
}

export function useAllInvoicesForDiscount(enabled: boolean) {
  return useQuery<Awaited<ReturnType<typeof fetchAllInvoices>>, AxiosError>({
    queryKey: discountKeys.allInvoices,
    queryFn: fetchAllInvoices,
    enabled,
  });
}
