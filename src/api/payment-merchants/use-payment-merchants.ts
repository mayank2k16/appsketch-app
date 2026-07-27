import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { addPaymentMerchant, fetchMerchants } from './client';
import type { AddPaymentMerchantPayload } from './types';

export const paymentMerchantKeys = {
  all: ['payment-merchants'] as const,
  list: () => [...paymentMerchantKeys.all, 'list'] as const,
};

export function usePaymentMerchants() {
  return useQuery<Awaited<ReturnType<typeof fetchMerchants>>, AxiosError>({
    queryKey: paymentMerchantKeys.list(),
    queryFn: fetchMerchants,
  });
}

export function useAddPaymentMerchant() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, AddPaymentMerchantPayload>({
    mutationFn: (payload) => addPaymentMerchant(payload),
    onSuccess: () => {
      toast.success('Payment provider connected');
      queryClient.invalidateQueries({ queryKey: paymentMerchantKeys.list() });
    },
    onError: () => toast.error('Could not connect payment provider'),
  });
}
