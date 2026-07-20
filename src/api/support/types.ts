/**
 * Support chat domain types — ported from Vite's `Containers/Cms/Support`
 * (agent side of the realtime customer-support chat) + `Api/supportAPI.js`.
 */

export type ConversationStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'ADMIN' | 'CUSTOMER' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
export type PresenceState = 'online' | 'typing' | 'idle' | 'left' | 'closed';

export type SupportOrderItem = {
  id: number;
  title?: string;
  quantity?: number;
  price?: string | number;
  final_price?: string | number;
  photo?: string;
};

export type SupportOrder = {
  id: number;
  total_price?: string | number;
  status?: string;
  items_count?: number;
  items?: SupportOrderItem[];
};

export type Conversation = {
  id: number;
  customer: number;
  customer_name?: string;
  customer_phone?: string;
  status: ConversationStatus | string;
  last_message_at?: string;
  last_message_preview?: string;
  admin_unread?: number;
  order?: SupportOrder | null;
};

export type SupportMessage = {
  id: number;
  conversation: number;
  sender_type: SenderType;
  message_type: MessageType;
  text?: string;
  attachment_url?: string;
  attachment_name?: string;
  client_id?: string;
  read?: boolean;
  created_on: string;
  // Client-side-only optimistic-send bookkeeping — never sent to or read
  // from the server.
  _pending?: boolean;
  _failed?: boolean;
};

export type ConversationFilters = {
  status?: ConversationStatus;
  search?: string;
};

// ── Inbox socket (tenant-wide) ──────────────────────────────────────────

export type InboxEvent = {
  type: 'inbox';
  event: 'message' | 'new_conversation';
  sender_type?: SenderType;
  conversation_id?: number;
};

// ── Room socket (per-conversation) ──────────────────────────────────────

export type RoomMessageEvent = { type: 'message'; message: SupportMessage };
export type RoomPresenceEvent = { type: 'presence'; user_type: 'customer' | 'admin'; state: PresenceState };
export type RoomReadEvent = { type: 'read'; by: 'customer' | 'admin'; message_ids: number[] };
export type RoomClosedEvent = { type: 'closed' };

export type RoomEvent = RoomMessageEvent | RoomPresenceEvent | RoomReadEvent | RoomClosedEvent;

export type RoomOutgoingAction =
  | { action: 'online' }
  | { action: 'read' }
  | { action: 'typing' }
  | { action: 'stop_typing' }
  | { action: 'message'; text: string; client_id: string };
