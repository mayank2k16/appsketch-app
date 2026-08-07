import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { Conversation, PresenceState, RoomEvent, SupportMessage } from '@/api/support';
import {
  closeConversation,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  sendSupportMedia,
  sendSupportText,
  startConversation,
  supportRoomSocketUrl,
} from '@/api/support';
import { OFFLINE_DEBOUNCE_MS, PRESENCE, uuid } from '@/containers/CMS/Support/utils';
import { F } from '@/lib/fonts';
import { useVoiceInput } from '@/lib/hooks/use-voice-input';
import { getDocumentPicker } from '@/lib/safe-document-picker';
import { useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { MessageBubble } from './MessageBubble';

// Opened either with an `id` param (from the conversation list — reopening
// an existing thread) or with none (a direct entry point, which
// get-or-creates the general thread — this app has no per-order support
// threads like the sibling storefront apps, so there's nothing to pick).
export function SupportChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const [conv, setConv] = React.useState<Conversation | null>(null);
  const [starting, setStarting] = React.useState(true);
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = React.useState(false);
  const [agentState, setAgentState] = React.useState<PresenceState>('left');
  const [draft, setDraft] = React.useState('');
  const [roomConnected, setRoomConnected] = React.useState(false);
  const [attachOpen, setAttachOpen] = React.useState(false);

  const roomRef = React.useRef<WebSocket | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── load the conversation (by id, or get-or-create the general one) ──────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const opened = id ? await fetchConversation(Number(id)) : await startConversation();
        if (cancelled || !opened) return;
        setConv(opened);
        setMsgLoading(true);
        const msgs = await fetchMessages(opened.id, 60);
        if (cancelled) return;
        setMessages(msgs);
        markConversationRead(opened.id).catch(() => {});
      } catch {
        if (!cancelled) toast.error('Could not open support chat', 'Please try again.');
      } finally {
        if (!cancelled) {
          setStarting(false);
          setMsgLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const conversationId = conv?.id ?? null;

  function upsert(incoming: SupportMessage) {
    setMessages((prev) => {
      const byId = incoming.id ? prev.findIndex((m) => m.id === incoming.id) : -1;
      if (byId >= 0) {
        const next = [...prev];
        next[byId] = { ...next[byId], ...incoming, _pending: false, _failed: false };
        return next;
      }
      const byClient = incoming.client_id
        ? prev.findIndex((m) => m.client_id && m.client_id === incoming.client_id)
        : -1;
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
    if (!conversationId) return;
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
            if (evt.message.sender_type === 'ADMIN') {
              try {
                ws.send(JSON.stringify({ action: 'read' }));
              } catch {
                // no-op
              }
            }
            break;
          case 'presence':
            if (evt.user_type === 'admin') {
              if (evt.state === 'left') {
                if (presenceTimer.current) clearTimeout(presenceTimer.current);
                presenceTimer.current = setTimeout(() => setAgentState('left'), OFFLINE_DEBOUNCE_MS);
              } else {
                if (presenceTimer.current) {
                  clearTimeout(presenceTimer.current);
                  presenceTimer.current = null;
                }
                setAgentState(evt.state);
              }
            }
            break;
          case 'read':
            if (evt.by === 'admin') {
              setMessages((prev) => prev.map((m) => (evt.message_ids.includes(m.id) ? { ...m, read: true } : m)));
            }
            break;
          case 'closed':
            setAgentState('closed');
            setConv((c) => (c ? { ...c, status: 'CLOSED' } : c));
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

  function handleSend() {
    const body = draft.trim();
    if (!conversationId || !body) return;
    setDraft('');
    roomSend({ action: 'stop_typing' });
    const clientId = uuid();
    const optimistic: SupportMessage = {
      id: -Date.now(),
      conversation: conversationId,
      sender_type: 'CUSTOMER',
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

  // Dictation into the composer — the same on-device speech-to-text the Agent
  // and Home composers use, so the mic behaves identically across the app.
  const voice = useVoiceInput(draft, onDraftChange);

  // ── attachments ──────────────────────────────────────────────────────────
  /** Upload one already-picked file as its own message, with an optimistic
   * bubble. Shared by all three pickers so camera/gallery/document behave
   * identically (and so a multi-select just calls this per asset). */
  async function uploadOne(file: {
    uri: string;
    name: string;
    type: string;
    kind: 'IMAGE' | 'VIDEO' | 'FILE';
  }) {
    if (!conversationId) return;
    const clientId = uuid();
    const optimistic: SupportMessage = {
      id: -Date.now() - Math.floor(Math.random() * 1000),
      conversation: conversationId,
      sender_type: 'CUSTOMER',
      message_type: file.kind,
      attachment_url: file.uri,
      attachment_name: file.name,
      client_id: clientId,
      read: false,
      created_on: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendSupportMedia(
        conversationId,
        { uri: file.uri, name: file.name, type: file.type },
        clientId
      );
      if (saved) setMessages((prev) => prev.map((m) => (m.client_id === clientId ? saved : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.client_id === clientId ? { ...m, _pending: false, _failed: true } : m))
      );
      toast.error('Upload failed', file.name);
    }
  }

  function assetToFile(a: ImagePicker.ImagePickerAsset) {
    const isVideo = (a.mimeType ?? '').startsWith('video/') || a.type === 'video';
    return {
      uri: a.uri,
      name: a.fileName ?? `attachment-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
      type: a.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
      kind: (isVideo ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
    };
  }

  async function pickFromCamera() {
    setAttachOpen(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.error('Camera permission is required', 'Enable it in Settings to take photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (res.canceled) return;
    for (const a of res.assets) await uploadOne(assetToFile(a));
  }

  async function pickFromLibrary() {
    setAttachOpen(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Photo library permission is required to attach files.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (res.canceled) return;
    // Sequential, not Promise.all — each upload is its own multipart request
    // and its own message; firing ten at once on mobile data reliably times
    // some of them out, and the server orders messages by arrival anyway.
    for (const a of res.assets) await uploadOne(assetToFile(a));
  }

  async function pickDocuments() {
    setAttachOpen(false);
    const DocumentPicker = getDocumentPicker();
    if (!DocumentPicker) {
      toast.error(
        'Document attachments unavailable',
        'This build needs an update — try Camera or Photos & Videos instead.'
      );
      return;
    }
    const res = await DocumentPicker.getDocumentAsync({
      // Everything — PDFs, Word/Excel/PowerPoint, zips, plain text. The
      // backend classifies by mime (`_detect_message_type`) and stores
      // anything that isn't image/* or video/* as a FILE message.
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    for (const a of res.assets) {
      await uploadOne({
        uri: a.uri,
        name: a.name || `document-${Date.now()}`,
        type: a.mimeType || 'application/octet-stream',
        kind: 'FILE',
      });
    }
  }

  async function handleClose() {
    if (!conversationId) return;
    try {
      await closeConversation(conversationId);
      setConv((c) => (c ? { ...c, status: 'CLOSED' } : c));
    } catch {
      toast.error('Could not end the conversation');
    }
  }

  const presence = PRESENCE[agentState] || PRESENCE.left;
  const isClosed = conv?.status === 'CLOSED' || agentState === 'closed';

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={st.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[st.name, { color: t.text }]}>Help &amp; Support</Text>
          <View style={st.presenceRow}>
            <View style={[st.dot, { backgroundColor: presence.color }]} />
            <Text style={[st.presenceText, { color: t.textSub }]}>
              {roomConnected ? presence.label : 'Connecting…'}
            </Text>
          </View>
        </View>
        {!isClosed && conv ? (
          <Pressable onPress={handleClose} style={[st.endBtn, { borderColor: t.border }]}>
            <Text style={[st.endBtnText, { color: t.textSub }]}>End chat</Text>
          </Pressable>
        ) : (
          <View style={st.headerBtn} />
        )}
      </View>

      {starting ? (
        <View style={st.center}>
          <ActivityIndicator color={t.accent} />
          <Text style={[st.centerText, { color: t.textSub }]}>Connecting you to support…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {msgLoading ? (
              <View style={st.center}>
                <ActivityIndicator color={t.accent} />
              </View>
            ) : messages.length === 0 ? (
              <View style={st.center}>
                <Text style={[st.centerText, { color: t.textSub }]}>No messages yet — say hello!</Text>
              </View>
            ) : (
              messages.map((m) => <MessageBubble key={m.id || m.client_id} t={t} message={m} />)
            )}
          </ScrollView>

          {/* Composer sits above the home indicator — `insets.bottom` plus a
              constant so it never hugs the very bottom edge of the screen. */}
          <View
            style={[
              st.composer,
              {
                borderColor: t.border,
                backgroundColor: t.bg,
                paddingBottom: insets.bottom + 14,
              },
            ]}
          >
            <Pressable onPress={() => setAttachOpen(true)} style={st.iconBtn} hitSlop={6}>
              <Ionicons name="attach" size={21} color={t.textSub} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              placeholder={isClosed ? 'Reply to reopen this conversation…' : 'Type a message…'}
              placeholderTextColor={t.textMuted}
              multiline
              style={[st.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
            />
            {voice.supported ? (
              <Pressable onPress={voice.toggle} style={st.iconBtn} hitSlop={6}>
                <Ionicons
                  name={voice.listening ? 'mic' : 'mic-outline'}
                  size={21}
                  color={voice.listening ? t.accent : t.textSub}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim()}
              style={[st.sendBtn, { backgroundColor: t.accent }, !draft.trim() && st.sendBtnDisabled]}
            >
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Attachment source sheet ── */}
      <Modal
        visible={attachOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAttachOpen(false)}
      >
        <Pressable style={st.sheetBackdrop} onPress={() => setAttachOpen(false)} />
        <View
          style={[
            st.sheet,
            { backgroundColor: t.surface, paddingBottom: insets.bottom + 20, borderColor: t.border },
          ]}
        >
          <View style={[st.sheetHandle, { backgroundColor: t.border }]} />
          <Text style={[st.sheetTitle, { color: t.text }]}>Attach</Text>
          <AttachOption
            t={t}
            icon="camera-outline"
            label="Camera"
            sub="Take a photo or video"
            onPress={pickFromCamera}
          />
          <AttachOption
            t={t}
            icon="images-outline"
            label="Photos & Videos"
            sub="Pick up to 10 at once"
            onPress={pickFromLibrary}
          />
          <AttachOption
            t={t}
            icon="document-text-outline"
            label="Document"
            sub="PDF, Word, Excel, and more"
            onPress={pickDocuments}
            isLast
          />
        </View>
      </Modal>
    </View>
  );
}

function AttachOption({
  t,
  icon,
  label,
  sub,
  onPress,
  isLast,
}: {
  t: ReturnType<typeof useAppTheme>;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sub: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.attachRow, !isLast && { borderBottomWidth: 1, borderBottomColor: t.border }]}
    >
      <View style={[st.attachIcon, { backgroundColor: t.accentSoft }]}>
        <Ionicons name={icon} size={19} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.attachLabel, { color: t.text }]}>{label}</Text>
        <Text style={[st.attachSub, { color: t.textSub }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: F.sans700, fontSize: 15 },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  presenceText: { fontFamily: F.sans500, fontSize: 11 },
  endBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  endBtnText: { fontFamily: F.sans600, fontSize: 12 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  centerText: { fontFamily: F.sans400, fontSize: 13 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  iconBtn: { padding: 7 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    // +10% box height: 10/40/100 -> 11/44/110 (vertical padding, min, max).
    paddingVertical: 11,
    minHeight: 44,
    maxHeight: 110,
    fontFamily: F.sans400,
    fontSize: 14,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },

  // ── Attachment sheet ──
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: F.sans700, fontSize: 15, marginBottom: 6 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  attachIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: { fontFamily: F.sans600, fontSize: 14.5 },
  attachSub: { fontFamily: F.sans400, fontSize: 12, marginTop: 2 },
});
