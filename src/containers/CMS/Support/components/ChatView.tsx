import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Conversation, PresenceState, RoomEvent, SupportMessage } from '@/api/support';
import {
  closeConversation,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  sendSupportMedia,
  sendSupportText,
  supportRoomSocketUrl,
} from '@/api/support';
import { toast } from '@/lib/toast';

import type { CmsThemeColors } from '../../theme';
import { OFFLINE_DEBOUNCE_MS, PRESENCE, uuid } from '../utils';
import { MessageBubble } from './MessageBubble';
import { OrderCard } from './OrderCard';

type Props = {
  colors: CmsThemeColors;
  conversationId: number;
  onBack: () => void;
};

export function ChatView({ colors, conversationId, onBack }: Props) {
  const [activeConv, setActiveConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = React.useState(false);
  const [customerState, setCustomerState] = React.useState<PresenceState>('left');
  const [draft, setDraft] = React.useState('');
  const [roomConnected, setRoomConnected] = React.useState(false);

  const roomRef = React.useRef<WebSocket | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── load detail + history when the conversation changes ──────────────────
  React.useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setCustomerState('left');
    setMsgLoading(true);

    (async () => {
      try {
        const [detail, msgs] = await Promise.all([fetchConversation(conversationId), fetchMessages(conversationId, 60)]);
        if (cancelled) return;
        setActiveConv(detail);
        setMessages(msgs);
        markConversationRead(conversationId).catch(() => {});
      } catch (e) {
        console.error('support: open failed', e);
      } finally {
        if (!cancelled) setMsgLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function upsert(incoming: SupportMessage) {
    setMessages((prev) => {
      const byId = incoming.id ? prev.findIndex((m) => m.id === incoming.id) : -1;
      if (byId >= 0) {
        const next = [...prev];
        next[byId] = { ...next[byId], ...incoming, _pending: false, _failed: false };
        return next;
      }
      const byClient = incoming.client_id ? prev.findIndex((m) => m.client_id && m.client_id === incoming.client_id) : -1;
      if (byClient >= 0) {
        const next = [...prev];
        next[byClient] = { ...next[byClient], ...incoming, _pending: false, _failed: false };
        return next;
      }
      return [...prev, incoming];
    });
  }

  // ── room socket lifecycle, exponential-backoff reconnect ─────────────────
  React.useEffect(() => {
    let stop = false;
    let reconnectT: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      const ws = new WebSocket(supportRoomSocketUrl(conversationId));
      roomRef.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setRoomConnected(true);
        try {
          ws.send(JSON.stringify({ action: 'online' }));
          ws.send(JSON.stringify({ action: 'read' }));
        } catch {
          // no-op
        }
      };
      ws.onmessage = (e) => {
        let evt: RoomEvent;
        try {
          evt = JSON.parse(e.data as string);
        } catch {
          return;
        }
        switch (evt.type) {
          case 'message':
            upsert(evt.message);
            if (evt.message.sender_type === 'CUSTOMER') {
              try {
                ws.send(JSON.stringify({ action: 'read' }));
              } catch {
                // no-op
              }
            }
            break;
          case 'presence':
            if (evt.user_type === 'customer') {
              if (evt.state === 'left') {
                if (presenceTimer.current) clearTimeout(presenceTimer.current);
                presenceTimer.current = setTimeout(() => setCustomerState('left'), OFFLINE_DEBOUNCE_MS);
              } else {
                if (presenceTimer.current) {
                  clearTimeout(presenceTimer.current);
                  presenceTimer.current = null;
                }
                setCustomerState(evt.state);
              }
            }
            break;
          case 'read':
            if (evt.by === 'customer') {
              setMessages((prev) => prev.map((m) => (evt.message_ids.includes(m.id) ? { ...m, read: true } : m)));
            }
            break;
          case 'closed':
            setCustomerState('closed');
            setActiveConv((c) => (c ? { ...c, status: 'CLOSED' } : c));
            break;
          default:
            break;
        }
      };
      ws.onclose = () => {
        setRoomConnected(false);
        if (stop) return;
        const delay = Math.min(1000 * 2 ** attempt, 15000);
        attempt += 1;
        reconnectT = setTimeout(connect, delay);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // no-op
        }
      };
    };
    connect();

    return () => {
      stop = true;
      if (reconnectT) clearTimeout(reconnectT);
      if (presenceTimer.current) {
        clearTimeout(presenceTimer.current);
        presenceTimer.current = null;
      }
      try {
        roomRef.current?.close();
      } catch {
        // no-op
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  function roomSend(payload: Record<string, unknown>): boolean {
    const ws = roomRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  // ── send text ────────────────────────────────────────────────────────────
  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    roomSend({ action: 'stop_typing' });
    const clientId = uuid();
    const optimistic: SupportMessage = {
      id: -Date.now(),
      conversation: conversationId,
      sender_type: 'ADMIN',
      message_type: 'TEXT',
      text: body,
      client_id: clientId,
      read: false,
      created_on: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const ok = roomSend({ action: 'message', text: body, client_id: clientId });
    if (!ok) {
      sendSupportText(conversationId, body, clientId)
        .then((saved) => {
          if (saved) setMessages((prev) => prev.map((m) => (m.client_id === clientId ? saved : m)));
        })
        .catch(() =>
          setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, _pending: false, _failed: true } : m)))
        );
    }
  }

  function onDraftChange(val: string) {
    setDraft(val);
    roomSend({ action: 'typing' });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => roomSend({ action: 'stop_typing' }), 2500);
  }

  // ── attach media ─────────────────────────────────────────────────────────
  async function handleAttach() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to attach files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const isVideo = (asset.mimeType ?? '').startsWith('video/') || asset.type === 'video';
    const clientId = uuid();
    const optimistic: SupportMessage = {
      id: -Date.now(),
      conversation: conversationId,
      sender_type: 'ADMIN',
      message_type: isVideo ? 'VIDEO' : 'IMAGE',
      attachment_url: asset.uri,
      attachment_name: asset.fileName ?? undefined,
      client_id: clientId,
      read: false,
      created_on: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendSupportMedia(
        conversationId,
        { uri: asset.uri, name: asset.fileName ?? `attachment-${Date.now()}`, type: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg') },
        clientId
      );
      if (saved) setMessages((prev) => prev.map((m) => (m.client_id === clientId ? saved : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, _pending: false, _failed: true } : m)));
      toast.error('Upload failed');
    }
  }

  async function handleClose() {
    try {
      await closeConversation(conversationId);
      setActiveConv((c) => (c ? { ...c, status: 'CLOSED' } : c));
    } catch {
      toast.error('Could not close conversation');
    }
  }

  const presence = PRESENCE[customerState] || PRESENCE.left;
  const isClosed = activeConv?.status === 'CLOSED' || customerState === 'closed';
  const customerLabel = activeConv?.customer_name || activeConv?.customer_phone || `Customer #${activeConv?.customer ?? ''}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.header, { borderColor: colors.border }]}>
        <Pressable onPress={onBack} hitSlop={8} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {customerLabel}
          </Text>
          <View style={st.presenceRow}>
            <View style={[st.dot, { backgroundColor: presence.color }]} />
            <Text style={[st.presenceText, { color: colors.textSecondary }]}>
              {roomConnected ? presence.label : 'Connecting…'}
              {activeConv?.customer_phone ? ` · ${activeConv.customer_phone}` : ''}
            </Text>
          </View>
        </View>
        {!isClosed ? (
          <Pressable onPress={handleClose} style={[st.closeBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>Close</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
          {activeConv?.order?.id ? <OrderCard colors={colors} order={activeConv.order} /> : null}

          {msgLoading ? (
            <View style={st.center}>
              <Text style={{ color: colors.textSecondary }}>Loading messages…</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={st.center}>
              <Text style={{ color: colors.textSecondary }}>No messages yet.</Text>
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id || m.client_id} colors={colors} message={m} />)
          )}
        </ScrollView>

        <View style={[st.composer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={handleAttach} style={st.attachBtn} hitSlop={6}>
            <Ionicons name="attach" size={20} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            placeholder={isClosed ? 'Reply to reopen this conversation…' : 'Type a reply…'}
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[st.input, { color: colors.textPrimary, borderColor: colors.border }]}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            style={[st.sendBtn, { backgroundColor: colors.accent }, !draft.trim() && st.sendBtnDisabled]}
          >
            <Ionicons name="send" size={16} color={colors.accentText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  name: { fontSize: 14.5, fontWeight: '800' },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  presenceText: { fontSize: 11, fontWeight: '600' },
  closeBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  center: { alignItems: 'center', paddingVertical: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: { padding: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
