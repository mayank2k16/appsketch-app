import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { createStory, deleteStory, fetchStories, updateStory } from './client';
import type { CreateStoryPayload, UpdateStoryPayload } from './types';

export const storyKeys = {
  all: ['stories'] as const,
  list: () => [...storyKeys.all, 'list'] as const,
};

export function useStories() {
  return useQuery<Awaited<ReturnType<typeof fetchStories>>, AxiosError>({
    queryKey: storyKeys.list(),
    queryFn: fetchStories,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreateStoryPayload>({
    mutationFn: (payload) => createStory(payload),
    onSuccess: () => {
      toast.success('Story added successfully.');
      queryClient.invalidateQueries({ queryKey: storyKeys.list() });
    },
    onError: () => toast.error('Could not save story'),
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: UpdateStoryPayload }>({
    mutationFn: ({ id, payload }) => updateStory(id, payload),
    onSuccess: () => {
      toast.success('Story updated successfully.');
      queryClient.invalidateQueries({ queryKey: storyKeys.list() });
    },
    onError: () => toast.error('Could not save story'),
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteStory(id),
    onSuccess: () => {
      toast.success('Story deleted');
      queryClient.invalidateQueries({ queryKey: storyKeys.list() });
    },
    onError: () => toast.error('Could not delete story'),
  });
}
