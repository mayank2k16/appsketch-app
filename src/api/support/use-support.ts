/** React Query hooks for the customer-facing support chat (list + start). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';

import { fetchConversations, startConversation } from './client';
import type { Conversation } from './types';

export const supportKeys = {
  all: ['support'] as const,
  conversations: () => [...supportKeys.all, 'conversations'] as const,
};

function useIsSignedIn() {
  return useAuth.use.status() === 'signIn';
}

export function useConversations() {
  const enabled = useIsSignedIn();
  return useQuery<Conversation[]>({
    queryKey: supportKeys.conversations(),
    queryFn: () => fetchConversations(),
    enabled,
    staleTime: 15 * 1000,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subject?: string) => startConversation(subject),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.conversations() });
    },
  });
}
