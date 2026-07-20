import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Conversation } from '@/api/support';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { timeAgo } from '../utils';

type Props = {
  colors: CmsThemeColors;
  conversation: Conversation;
  active: boolean;
  onPress: () => void;
};

export const ConversationRow = React.memo(function ConversationRow({ colors, conversation: c, active, onPress }: Props) {
  const initial = (c.customer_name || '?').slice(0, 1).toUpperCase();
  const name = c.customer_name || c.customer_phone || `Customer #${c.customer}`;
  const preview = `${c.order?.id ? `[Order #${c.order.id}] ` : ''}${c.last_message_preview || '—'}`;

  return (
    <Pressable
      onPress={onPress}
      style={[
        st.row,
        { borderColor: colors.border },
        active && { backgroundColor: `${colors.accent}14` },
      ]}
    >
      <View style={[st.avatar, { backgroundColor: colors.sidebarActiveBg }]}>
        <Text style={[st.avatarText, { color: colors.sidebarText }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.topRow}>
          <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[st.time, { color: colors.textSecondary }]}>{timeAgo(c.last_message_at)}</Text>
        </View>
        <View style={st.topRow}>
          <Text style={[st.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {preview}
          </Text>
          {(c.admin_unread ?? 0) > 0 ? (
            <View style={[st.unreadBadge, { backgroundColor: colors.accent }]}>
              <Text style={[st.unreadText, { color: colors.accentText }]}>{c.admin_unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { ...cmsType.listTitle, flex: 1 },
  time: cmsType.listMeta,
  preview: { ...cmsType.listMeta, flex: 1 },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontSize: 10.5, fontWeight: '800' },
});
