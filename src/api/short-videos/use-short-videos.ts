import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { createShortVideo, deleteShortVideo, fetchShortVideos, updateShortVideo } from './client';
import type { CreateShortVideoPayload, UpdateShortVideoPayload } from './types';

export const shortVideoKeys = {
  all: ['short-videos'] as const,
  list: () => [...shortVideoKeys.all, 'list'] as const,
};

export function useShortVideos() {
  return useQuery<Awaited<ReturnType<typeof fetchShortVideos>>, AxiosError>({
    queryKey: shortVideoKeys.list(),
    queryFn: fetchShortVideos,
  });
}

export function useCreateShortVideo() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreateShortVideoPayload>({
    mutationFn: (payload) => createShortVideo(payload),
    onSuccess: () => {
      toast.success('Short video added successfully.');
      queryClient.invalidateQueries({ queryKey: shortVideoKeys.list() });
    },
    onError: () => toast.error('Could not save short video'),
  });
}

export function useUpdateShortVideo() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: UpdateShortVideoPayload }>({
    mutationFn: ({ id, payload }) => updateShortVideo(id, payload),
    onSuccess: () => {
      toast.success('Short video updated successfully.');
      queryClient.invalidateQueries({ queryKey: shortVideoKeys.list() });
    },
    onError: () => toast.error('Could not save short video'),
  });
}

export function useDeleteShortVideo() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteShortVideo(id),
    onSuccess: () => {
      toast.success('Short video deleted');
      queryClient.invalidateQueries({ queryKey: shortVideoKeys.list() });
    },
    onError: () => toast.error('Could not delete short video'),
  });
}
