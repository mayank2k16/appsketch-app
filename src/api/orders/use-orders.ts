/**
 * React Query hooks for the order domain — one hook per operation, no
 * screen-level aggregator (unlike `src/api/home/use-home.ts`'s `useHomePage`).
 * Any screen can import just what it needs.
 */
import { useIsFocused } from '@react-navigation/native';
import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  acceptOrder,
  createOrder,
  deleteOrder,
  fetchDiscounts,
  fetchInventories,
  fetchOrderDetailsById,
  fetchOrders,
  fetchTenantUsers,
  previewOrder,
  rejectOrder,
  updateOrder,
} from './client';
import type { CreateOrderPayload, PreviewOrderPayload } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (orderId: number) => [...orderKeys.all, 'detail', orderId] as const,
  discounts: () => [...orderKeys.all, 'discounts'] as const,
  inventories: () => [...orderKeys.all, 'inventories'] as const,
  tenantUsers: () => [...orderKeys.all, 'tenant-users'] as const,
};

export function useOrders() {
  const isFocused = useIsFocused();
  return useQuery<Awaited<ReturnType<typeof fetchOrders>>, AxiosError>({
    queryKey: orderKeys.list(),
    queryFn: fetchOrders,
    refetchInterval: isFocused ? 4000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useOrderDetail(orderId: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchOrderDetailsById>>, AxiosError>({
    queryKey: orderKeys.detail(orderId ?? -1),
    queryFn: () => fetchOrderDetailsById(orderId as number),
    enabled: orderId !== null,
  });
}

export function useDiscounts() {
  return useQuery<Awaited<ReturnType<typeof fetchDiscounts>>, AxiosError>({
    queryKey: orderKeys.discounts(),
    queryFn: fetchDiscounts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventories() {
  return useQuery<Awaited<ReturnType<typeof fetchInventories>>, AxiosError>({
    queryKey: orderKeys.inventories(),
    queryFn: fetchInventories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantUsersSearch() {
  return useQuery<Awaited<ReturnType<typeof fetchTenantUsers>>, AxiosError>({
    queryKey: orderKeys.tenantUsers(),
    queryFn: fetchTenantUsers,
    staleTime: 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
    onError: () => toast.error('Failed to create order'),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => updateOrder(payload),
    onSuccess: () => {
      toast.success('Order updated successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
    onError: () => toast.error('Failed to update order'),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => deleteOrder(orderId),
    onSuccess: () => {
      toast.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
    onError: () => toast.error('Failed to delete order'),
  });
}

export function usePreviewOrder() {
  return useMutation({
    mutationFn: (payload: PreviewOrderPayload) => previewOrder(payload),
  });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => acceptOrder(orderId),
    onSuccess: () => {
      toast.success('Order accepted successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
    onError: () => toast.error('Failed to accept order'),
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => rejectOrder(orderId),
    onSuccess: () => {
      toast.success('Order rejected successfully');
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
    onError: () => toast.error('Failed to reject order'),
  });
}
