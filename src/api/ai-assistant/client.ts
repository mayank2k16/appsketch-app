import { authenticatedClient } from '@/api/common/client';
import { useAuth } from '@/hooks/useAuth';

import type { ChatThread } from './types';

export async function listChatThreads(): Promise<ChatThread[]> {
  const { data } = await authenticatedClient.get<ChatThread[] | { results?: ChatThread[] }>('api/aiagent/threads/');
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createChatThread(title = 'New chat'): Promise<ChatThread> {
  const { data } = await authenticatedClient.post<ChatThread>('api/aiagent/threads/', { title });
  return data;
}

/** Auth can't ride a WS header portably (same limitation in RN as browsers),
 * so it goes in the query string — same workaround as Vite's `aiAgentWsUrl`. */
export function buildChatWebSocketUrl(threadId: string): string {
  const base = 'https://appsketch.ai/'.replace(/^http/, 'ws');
  const token = useAuth.getState().token?.access ?? '';
  return `${base}ws/aiagent/${threadId}/?token=${encodeURIComponent(token)}`;
}
