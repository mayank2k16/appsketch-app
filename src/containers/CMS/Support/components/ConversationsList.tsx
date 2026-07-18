import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Conversation, ConversationStatus, InboxEvent } from '@/api/support';
import { fetchConversations, supportInboxSocketUrl } from '@/api/support';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import type { CmsThemeColors } from '../../theme';
import { ConversationRow } from './ConversationRow';

type Props = {
  colors: CmsThemeColors;
  activeId: number | null;
  onSelect: (id: number) => void;
};

export function ConversationsList({ colors, activeId, onSelect }: Props) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<ConversationStatus>('OPEN');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [listLoading, setListLoading] = React.useState(true);

  const activeIdRef = React.useRef<number | null>(null);
  activeIdRef.current = activeId;
  const inboxRef = React.useRef<WebSocket | null>(null);

  const loadConversations = React.useCallback(async () => {
    try {
      const list = await fetchConversations({ status: statusFilter, search: debouncedSearch });
      setConversations(list);
    } catch (e) {
      console.error('support: list failed', e);
    } finally {
      setListLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  React.useEffect(() => {
    setListLoading(true);
    loadConversations();
  }, [loadConversations]);

  // ── inbox socket (tenant-wide), exponential-backoff reconnect ────────────
  React.useEffect(() => {
    let stop = false;
    let reconnectT: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      const ws = new WebSocket(supportInboxSocketUrl());
      inboxRef.current = ws;
      ws.onopen = () => {
        attempt = 0;
      };
      ws.onmessage = (e) => {
        let evt: InboxEvent;
        try {
          evt = JSON.parse(e.data as string);
        } catch {
          return;
        }
        if (evt.type !== 'inbox') return;
        const isCustomerMsg = evt.event === 'message' && evt.sender_type === 'CUSTOMER';
        const isNewConvo = evt.event === 'new_conversation';
        if ((isCustomerMsg && evt.conversation_id !== activeIdRef.current) || isNewConvo) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        loadConversations();
      };
      ws.onclose = () => {
        if (stop) return;
        const delay = Math.min(1000 * 2 ** attempt, 15000);
        attempt += 1;
        reconnectT = setTimeout(connect, delay);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // no-op — onclose handles the reconnect
        }
      };
    };
    connect();

    return () => {
      stop = true;
      if (reconnectT) clearTimeout(reconnectT);
      try {
        inboxRef.current?.close();
      } catch {
        // no-op
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalUnread = React.useMemo(
    () => conversations.reduce((sum, c) => sum + (c.admin_unread || 0), 0),
    [conversations]
  );
  const unreadChats = React.useMemo(() => conversations.filter((c) => (c.admin_unread || 0) > 0).length, [conversations]);

  const renderItem = React.useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationRow colors={colors} conversation={item} active={item.id === activeId} onPress={() => onSelect(item.id)} />
    ),
    [colors, activeId, onSelect]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <Text style={[st.title, { color: colors.textPrimary }]}>Support</Text>
        {totalUnread > 0 ? (
          <View style={[st.headerBadge, { backgroundColor: colors.accent }]}>
            <Text style={[st.headerBadgeText, { color: colors.accentText }]}>
              {totalUnread} unread · {unreadChats} chat{unreadChats === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={st.filterRow}>
        {(['OPEN', 'CLOSED'] as ConversationStatus[]).map((s) => {
          const active = statusFilter === s;
          return (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[st.chip, { borderColor: colors.border }, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
            >
              <Text style={{ color: active ? colors.accentText : colors.textSecondary, fontSize: 12.5, fontWeight: '600' }}>
                {s === 'OPEN' ? 'Open' : 'Closed'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search name / phone / order…"
        placeholderTextColor={colors.textSecondary}
        style={[st.search, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
      />

      {listLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading…</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No conversations.</Text>
        </View>
      ) : (
        <FlatList data={conversations} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24 }} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { fontSize: 11, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  search: { marginHorizontal: 16, marginTop: 10, marginBottom: 8, height: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
