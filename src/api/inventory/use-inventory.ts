import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createInventoryLocation,
  fetchInventoryLocations,
  updateInventoryLocation,
} from './client';
import type { InventoryLocationPayload } from './types';

export const inventoryKeys = {
  all: ['inventory-locations'] as const,
  list: () => [...inventoryKeys.all, 'list'] as const,
};

export function useInventoryLocations() {
  return useQuery<Awaited<ReturnType<typeof fetchInventoryLocations>>, AxiosError>({
    queryKey: inventoryKeys.list(),
    queryFn: fetchInventoryLocations,
  });
}

export function useCreateInventoryLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryLocationPayload) => createInventoryLocation(payload),
    onSuccess: () => {
      toast.success('Inventory location added successfully');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
    },
    onError: () => toast.error('Failed to add inventory location'),
  });
}

export function useUpdateInventoryLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InventoryLocationPayload }) =>
      updateInventoryLocation(id, payload),
    onSuccess: () => {
      toast.success('Inventory location updated successfully');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
    },
    onError: () => toast.error('Failed to update inventory location'),
  });
}
