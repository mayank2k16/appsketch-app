import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { createCollection, deleteCollection, fetchCollections, updateCollection } from './client';
import type { CreateCollectionPayload, UpdateCollectionPayload } from './types';

export const collectionKeys = {
  all: ['collections'] as const,
  list: () => [...collectionKeys.all, 'list'] as const,
};

export function useCollections() {
  return useQuery<Awaited<ReturnType<typeof fetchCollections>>, AxiosError>({
    queryKey: collectionKeys.list(),
    queryFn: fetchCollections,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreateCollectionPayload>({
    mutationFn: (payload) => createCollection(payload),
    onSuccess: () => {
      toast.success('Collection added successfully.');
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
    },
    onError: () => toast.error('Could not save collection'),
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: UpdateCollectionPayload }>({
    mutationFn: ({ id, payload }) => updateCollection(id, payload),
    onSuccess: () => {
      toast.success('Collection updated successfully.');
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
    },
    onError: () => toast.error('Could not save collection'),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteCollection(id),
    onSuccess: () => {
      toast.success('Collection deleted');
      queryClient.invalidateQueries({ queryKey: collectionKeys.list() });
    },
    onError: () => toast.error('Could not delete collection'),
  });
}
