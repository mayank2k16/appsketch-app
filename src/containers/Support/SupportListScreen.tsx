import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useConversations, useStartConversation } from '@/api/support';
import type { Conversation } from '@/api/support';
import { F } from '@/lib/fonts';
import { useAppTheme, type AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConversationRow({
  t,
  conv,
  onPress,
}: {
  t: AppColors;
  conv: Conversation;
  onPress: () => void;
}) {
  const unread = conv.customer_unread ?? 0;
  const closed = conv.status === 'CLOSED';
  return (
    <Pressable
      onPress={onPress}
      style={[st.row, { backgroundColor: t.surface, borderColor: t.border }]}
    >
      <View style={[st.rowIcon, { backgroundColor: t.accentSoft }]}>
        <Ionicons
          name={closed ? 'checkmark-done' : 'chatbubble-ellipses'}
          size={19}
          color={closed ? t.textMuted : t.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.rowTop}>
          <Text style={[st.rowTitle, { color: t.text }]} numberOfLines={1}>
            {conv.subject || 'Support chat'}
          </Text>
          <Text style={[st.rowTime, { color: t.textSub }]}>{timeAgo(conv.last_message_at)}</Text>
        </View>
        <View style={st.rowTop}>
          <Text style={[st.rowPreview, { color: t.textSub }]} numberOfLines={1}>
            {conv.last_message_preview || (closed ? 'Conversation closed' : 'Tap to chat')}
          </Text>
          {unread > 0 ? (
            <View style={[st.badge, { backgroundColor: t.accent }]}>
              <Text style={st.badgeTxt}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
    </Pressable>
  );
}

// One general conversation type only — this app has no orders/storefront, so
// unlike the sibling apps' order-picker sheet, "New Conversation" always
// starts a plain general-support thread with no scoping choice to make.
export function SupportListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const { data: conversations, isLoading, refetch } = useConversations();
  const startMut = useStartConversation();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const totalUnread = React.useMemo(
    () => (conversations ?? []).reduce((s, c) => s + (c.customer_unread ?? 0), 0),
    [conversations]
  );

  function openChat(id: number) {
    router.push({ pathname: '/support-chat', params: { id: String(id) } });
  }

  async function handleNewConversation() {
    try {
      const conv = await startMut.mutateAsync(undefined);
      if (conv) openChat(conv.id);
    } catch {
      toast.error('Could not start a new conversation', 'Please try again.');
    }
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={st.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </Pressable>
        <Text style={[st.headerTitle, { color: t.text }]}>Help &amp; Support</Text>
        {totalUnread > 0 ? (
          <View style={[st.headerBadge, { backgroundColor: t.accent }]}>
            <Text style={st.headerBadgeTxt}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
          </View>
        ) : (
          <View style={st.headerBtn} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.accent} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={t.border} />
              <Text style={[st.emptyTitle, { color: t.text }]}>No conversations yet</Text>
              <Text style={[st.emptySub, { color: t.textSub }]}>
                Start a chat with our support team — we usually reply within minutes.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow t={t} conv={item} onPress={() => openChat(item.id)} />
          )}
        />
      )}

      <Pressable
        onPress={handleNewConversation}
        disabled={startMut.isPending}
        style={[st.fab, { bottom: insets.bottom + 20, backgroundColor: t.accent, opacity: startMut.isPending ? 0.7 : 1 }]}
      >
        {startMut.isPending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="add" size={20} color="#FFFFFF" />
        )}
        <Text style={st.fabTxt}>New Conversation</Text>
      </Pressable>
    </View>
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
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: F.sans700, fontSize: 15 },
  headerBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeTxt: { color: '#FFFFFF', fontFamily: F.sans700, fontSize: 11 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { flex: 1, fontFamily: F.sans700, fontSize: 14.5 },
  rowTime: { fontFamily: F.sans400, fontSize: 11, marginLeft: 8 },
  rowPreview: { flex: 1, fontFamily: F.sans400, fontSize: 13, marginTop: 2 },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeTxt: { color: '#FFFFFF', fontSize: 11, fontFamily: F.sans700 },

  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: F.sans700, fontSize: 16, marginTop: 14 },
  emptySub: {
    fontFamily: F.sans400,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  fab: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 26,
  },
  fabTxt: { color: '#FFFFFF', fontFamily: F.sans700, fontSize: 13.5 },
});
