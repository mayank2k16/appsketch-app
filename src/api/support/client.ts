import { Platform } from 'react-native';

import { authenticatedClient } from '@/api/common/client';
import { useAuth } from '@/hooks/useAuth';

import type { Conversation, ConversationFilters, SupportMessage } from './types';

/** Both endpoints below sometimes wrap the entity in `{data: T}` and
 * sometimes return it bare, depending on the view — same defensive
 * unwrapping every other domain in this port does for inconsistently-shaped
 * responses. A plain `'data' in data` check doesn't narrow cleanly against a
 * `{data?: T} | T` union when `T` itself has no discriminant field, so this
 * checks the entity's own required field instead. */
function unwrapEnvelope<T extends { id: number }>(payload: { data?: T } | T): T | null {
  if (payload && typeof payload === 'object' && !('id' in payload)) {
    return (payload as { data?: T }).data ?? null;
  }
  return payload as T;
}

export async function fetchConversations(filters: ConversationFilters = {}): Promise<Conversation[]> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  const { data } = await authenticatedClient.get<{ data?: Conversation[] } | Conversation[]>(
    'api/support/conversations/',
    { params }
  );
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}

export async function fetchConversation(id: number): Promise<Conversation | null> {
  const { data } = await authenticatedClient.get<{ data?: Conversation } | Conversation>(
    `api/support/conversations/${id}/`
  );
  return unwrapEnvelope(data);
}

export async function fetchMessages(id: number, limit = 60): Promise<SupportMessage[]> {
  const { data } = await authenticatedClient.get<{ data?: SupportMessage[] } | SupportMessage[]>(
    `api/support/conversations/${id}/messages/`,
    { params: { limit } }
  );
  return Array.isArray(data) ? data : (data.data ?? []);
}

/** REST fallback for sending text — the agent normally uses the room socket;
 * this only fires when that socket is down. */
export async function sendSupportText(id: number, text: string, clientId: string): Promise<SupportMessage | null> {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('client_id', clientId);
  const { data } = await authenticatedClient.post<{ data?: SupportMessage } | SupportMessage>(
    `api/support/conversations/${id}/messages/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return unwrapEnvelope(data);
}

export async function sendSupportMedia(
  id: number,
  asset: { uri: string; name: string; type: string },
  clientId: string
): Promise<SupportMessage | null> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    formData.append('attachment', blob, asset.name);
  } else {
    // @ts-expect-error React Native's FormData accepts a {uri,name,type} file part; the DOM lib types don't model it.
    formData.append('attachment', asset);
  }
  formData.append('client_id', clientId);
  const { data } = await authenticatedClient.post<{ data?: SupportMessage } | SupportMessage>(
    `api/support/conversations/${id}/messages/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return unwrapEnvelope(data);
}

export async function markConversationRead(id: number): Promise<void> {
  await authenticatedClient.post(`api/support/conversations/${id}/read/`);
}

export async function closeConversation(id: number): Promise<void> {
  await authenticatedClient.post(`api/support/conversations/${id}/close/`);
}

// ── WebSocket URLs ───────────────────────────────────────────────────────

/** Best-effort tenant hint — optional here (Vite itself falls back to an
 * empty string when there's no `?tenant=` on the CMS URL, for a "null-tenant
 * operator account" edge case), unlike Vendors' hard path-segment
 * requirement. Same lookup shape as `src/api/vendors/client.ts`. */
function getTenantHint(): string {
  const user = useAuth.getState().user as Record<string, unknown> | null;
  const tenantId = user?.tenant_id ?? user?.tenant_uuid ?? user?.tenant;
  return tenantId ? String(tenantId) : '';
}

function wsOrigin(): string {
  return 'https://appsketch.ai/'.replace(/^http/, 'ws');
}

export function supportInboxSocketUrl(): string {
  const token = useAuth.getState().token?.access ?? '';
  return `${wsOrigin()}ws/support/inbox/?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(getTenantHint())}`;
}

export function supportRoomSocketUrl(conversationId: number): string {
  const token = useAuth.getState().token?.access ?? '';
  return `${wsOrigin()}ws/support/${conversationId}/?token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(getTenantHint())}`;
}
