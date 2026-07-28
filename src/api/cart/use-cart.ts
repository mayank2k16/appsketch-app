import { useIsFocused } from '@react-navigation/native';
import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { discardCart, fetchAbandonedCarts, fetchCheckoutOrders } from './client';

export const cartKeys = {
  all: ['cart'] as const,
  abandoned: () => [...cartKeys.all, 'abandoned'] as const,
  checkoutOrders: () => [...cartKeys.all, 'checkout-orders'] as const,
};

export function useAbandonedCarts() {
  return useQuery<Awaited<ReturnType<typeof fetchAbandonedCarts>>, AxiosError>({
    queryKey: cartKeys.abandoned(),
    queryFn: fetchAbandonedCarts,
  });
}

export function useDiscardCart() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<{ error?: string }>, number>({
    mutationFn: (cartId) => discardCart(cartId),
    onSuccess: (_data, cartId) => {
      toast.success(`Cart #${cartId} discarded`);
      queryClient.invalidateQueries({ queryKey: cartKeys.abandoned() });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to discard cart'),
  });
}

// Vite polls this one every 8s (`setInterval(load, 8000)`) since checkouts
// can complete or expire while the tab is open.
export function useCheckoutOrders() {
  const isFocused = useIsFocused();
  return useQuery<Awaited<ReturnType<typeof fetchCheckoutOrders>>, AxiosError>({
    queryKey: cartKeys.checkoutOrders(),
    queryFn: fetchCheckoutOrders,
    refetchInterval: isFocused ? 8000 : false,
    refetchIntervalInBackground: false,
  });
}
