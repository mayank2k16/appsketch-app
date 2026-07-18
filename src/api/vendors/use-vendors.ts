import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createCommission,
  deleteCommission,
  fetchCommissions,
  fetchVendorsList,
  updateCommission,
  vendorRequestAction,
} from './client';
import type { CommissionPayload, VendorActionType } from './types';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: () => [...vendorKeys.all, 'list'] as const,
  commissions: ['vendors', 'commissions'] as const,
};

export function useVendors() {
  return useQuery<Awaited<ReturnType<typeof fetchVendorsList>>, AxiosError>({
    queryKey: vendorKeys.list(),
    queryFn: fetchVendorsList,
  });
}

export function useVendorAction() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { vendorId: number; action: VendorActionType; vendorTitle?: string }>({
    mutationFn: ({ vendorId, action }) => vendorRequestAction(vendorId, action),
    onSuccess: (_data, { action, vendorTitle }) => {
      toast.success(`Vendor ${vendorTitle ?? ''} ${action} successfully`.replace(/\s+/g, ' ').trim());
      queryClient.invalidateQueries({ queryKey: vendorKeys.list() });
    },
    onError: (_err, { action }) => toast.error(`Failed to ${action} vendor`),
  });
}

export function useCommissions() {
  return useQuery<Awaited<ReturnType<typeof fetchCommissions>>, AxiosError>({
    queryKey: vendorKeys.commissions,
    queryFn: fetchCommissions,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CommissionPayload>({
    mutationFn: (payload) => createCommission(payload),
    onSuccess: () => {
      toast.success('Commission added');
      queryClient.invalidateQueries({ queryKey: vendorKeys.commissions });
    },
    onError: () => toast.error('Failed to save commission'),
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: Partial<CommissionPayload> }>({
    mutationFn: ({ id, payload }) => updateCommission(id, payload),
    onSuccess: () => {
      toast.success('Commission updated');
      queryClient.invalidateQueries({ queryKey: vendorKeys.commissions });
    },
    onError: () => toast.error('Failed to save commission'),
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteCommission(id),
    onSuccess: () => {
      toast.success('Commission deleted');
      queryClient.invalidateQueries({ queryKey: vendorKeys.commissions });
    },
    onError: () => toast.error('Failed to delete commission'),
  });
}
