import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AiAgentWsEvent, ChatMessage, ChatThread, QueryPlanStep } from '@/api/ai-assistant';
import { buildChatWebSocketUrl, createChatThread, listChatThreads } from '@/api/ai-assistant';
import { useModal } from '@/components/ui';
import { toast } from '@/lib/toast';

import { useCmsTheme } from '../theme';
import { ApprovalCard } from './components/ApprovalCard';
import { MessageBubble } from './components/MessageBubble';
import { ThreadsSheet } from './components/ThreadsSheet';

const SUGGESTIONS = [
  'What were my total sales in the last 30 days?',
  'Show my 10 most recent orders.',
  'Which inventory items are low on stock?',
  'How much did I invoice this month?',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AiAssistantScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const threadsModal = useModal();

  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [pendingPlan, setPendingPlan] = React.useState<QueryPlanStep[] | null>(null);
  const [input, setInput] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const wsRef = React.useRef<WebSocket | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);

  // ── thread bootstrap ────────────────────────────────────────────────────
  React.useEffect(() => {
    (async () => {
      try {
        const list = await listChatThreads();
        if (list.length) {
          setThreads(list);
          setActiveThreadId(list[0].thread_id);
        } else {
          const created = await createChatThread();
          if (created?.thread_id) {
            setThreads([created]);
            setActiveThreadId(created.thread_id);
          }
        }
      } catch {
        toast.error('Could not load the assistant.');
      }
    })();
  }, []);

  // ── incoming server events ──────────────────────────────────────────────
  const handleEvent = React.useCallback((msg: AiAgentWsEvent) => {
    switch (msg.event) {
      case 'ready':
        setMessages(
          (msg.history || []).map((m) => ({
            role: m.role,
            content: m.content,
            chart: m.chart,
          }))
        );
        break;

      case 'token':
        setBusy(true);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.streaming) {
            const copy = [...prev];
            copy[copy.length - 1] = { ...last, content: last.content + msg.content };
            return copy;
          }
          return [...prev, { role: 'assistant', content: msg.content, streaming: true }];
        });
        break;

      case 'approval_required':
        setBusy(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.streaming && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setPendingPlan(msg.plan || []);
        break;

      case 'final':
        setBusy(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.streaming) {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...last,
              content: msg.content || last.content,
              chart: msg.chart || null,
              streaming: false,
            };
            return copy;
          }
          return [...prev, { role: 'assistant', content: msg.content || '', chart: msg.chart || null }];
        });
        break;

      case 'error':
        setBusy(false);
        toast.error(msg.detail || 'Assistant error.');
        break;

      default:
        break;
    }
  }, []);

  // ── websocket lifecycle (per active thread) ─────────────────────────────
  React.useEffect(() => {
    if (!activeThreadId) return undefined;
    setMessages([]);
    setPendingPlan(null);

    const ws = new WebSocket(buildChatWebSocketUrl(activeThreadId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => handleEvent(JSON.parse(evt.data as string));

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeThreadId, handleEvent]);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, pendingPlan, busy]);

  // ── outgoing actions ─────────────────────────────────────────────────────
  function send() {
    const text = input.trim();
    if (!text || !connected || busy || !wsRef.current) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: 'message', content: text }));
  }

  function resume(payload: Record<string, unknown>) {
    if (!wsRef.current) return;
    setPendingPlan(null);
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: 'approval', ...payload }));
  }

  async function newChat() {
    try {
      const created = await createChatThread();
      if (!created?.thread_id) throw new Error('bad thread');
      setThreads((t) => [created, ...t]);
      setActiveThreadId(created.thread_id);
      threadsModal.dismiss();
    } catch {
      toast.error('Could not start a new chat.');
    }
  }

  function selectThread(threadId: string) {
    setActiveThreadId(threadId);
    threadsModal.dismiss();
  }

  const empty = messages.length === 0 && !pendingPlan;

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.header, { borderColor: colors.border }]}>
        <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[st.title, { color: colors.textPrimary }]}>Business Assistant</Text>
          <View style={st.statusRow}>
            <View style={[st.dot, { backgroundColor: connected ? colors.success : colors.textSecondary }]} />
            <Text style={[st.statusText, { color: colors.textSecondary }]}>
              {connected ? 'Connected' : 'Connecting…'}
            </Text>
          </View>
        </View>
        <Pressable onPress={threadsModal.present} style={[st.threadsBtn, { borderColor: colors.border }]}>
          <Ionicons name="chatbubbles-outline" size={16} color={colors.textPrimary} />
          <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' }}>Chats</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 14 }}>
          {empty ? (
            <View style={st.empty}>
              <Ionicons name="sparkles-outline" size={36} color={colors.textSecondary} />
              <Text style={[st.emptyText, { color: colors.textSecondary }]}>
                Ask anything about your sales, orders, inventory, invoices or challans.
              </Text>
              <View style={st.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => setInput(s)} style={[st.suggestion, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.textPrimary, fontSize: 12.5 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {messages.map((m, idx) => (
            <MessageBubble key={idx} colors={colors} message={m} />
          ))}

          {pendingPlan ? (
            <ApprovalCard
              colors={colors}
              plan={pendingPlan}
              disabled={busy}
              onApprove={() => resume({ action: 'approve' })}
              onEdit={(editedPlan) => resume({ action: 'edit', edited_plan: editedPlan })}
              onReject={(reason) => resume({ action: 'reject', reason })}
            />
          ) : null}

          {busy && !pendingPlan ? (
            <View style={st.typingRow}>
              <View style={[st.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary }}>…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[st.composer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={pendingPlan ? 'Respond to the approval above to continue…' : 'Ask about your business data…'}
            placeholderTextColor={colors.textSecondary}
            editable={!pendingPlan}
            multiline
            style={[st.input, { color: colors.textPrimary, borderColor: colors.border }]}
          />
          <Pressable
            onPress={send}
            disabled={!connected || busy || !!pendingPlan || !input.trim()}
            style={[
              st.sendBtn,
              { backgroundColor: colors.accent },
              (!connected || busy || !!pendingPlan || !input.trim()) && st.sendBtnDisabled,
            ]}
          >
            <Ionicons name="send" size={16} color={colors.accentText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ThreadsSheet
        ref={threadsModal.ref}
        colors={colors}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelect={selectThread}
        onNewChat={newChat}
      />
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 14.5, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  threadsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24, gap: 10 },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  suggestions: { gap: 8, width: '100%' },
  suggestion: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  typingRow: { paddingHorizontal: 16 },
  typingBubble: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
