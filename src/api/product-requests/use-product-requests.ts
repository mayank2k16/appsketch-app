import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { fetchProductRequests, updateProductRequestStatus } from './client';
import type { UpdateProductRequestStatusPayload } from './types';

export const productRequestKeys = {
  all: ['product-requests'] as const,
  list: () => [...productRequestKeys.all, 'list'] as const,
};

export function useProductRequests() {
  return useQuery<Awaited<ReturnType<typeof fetchProductRequests>>, AxiosError>({
    queryKey: productRequestKeys.list(),
    queryFn: fetchProductRequests,
  });
}

export function useUpdateProductRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, UpdateProductRequestStatusPayload>({
    mutationFn: (payload) => updateProductRequestStatus(payload),
    onSuccess: (_data, { action }) => {
      toast.success(`Products ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: productRequestKeys.list() });
    },
    onError: (_err, { action }) => toast.error(`Failed to ${action === 'APPROVED' ? 'approve' : 'reject'} products`),
  });
}
