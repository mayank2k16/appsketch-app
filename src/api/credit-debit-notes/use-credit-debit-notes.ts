import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { createNote, fetchNotes } from './client';
import type { CreateNotePayload } from './types';

export const noteKeys = {
  all: ['credit-debit-notes'] as const,
  list: () => [...noteKeys.all, 'list'] as const,
};

export function useNotes() {
  return useQuery<Awaited<ReturnType<typeof fetchNotes>>, AxiosError>({
    queryKey: noteKeys.list(),
    queryFn: fetchNotes,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof createNote>>, AxiosError, CreateNotePayload>({
    mutationFn: (payload) => createNote(payload),
    onSuccess: (data) => {
      toast.success(data?.msg ?? 'Note created successfully');
      queryClient.invalidateQueries({ queryKey: noteKeys.list() });
    },
    onError: () => toast.error('Failed to create note'),
  });
}
