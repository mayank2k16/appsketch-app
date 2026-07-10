import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NotificationLog } from '@/api/notifications';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { formatLogDate, getLogStatusMeta } from '../utils';

const CHANNEL_ICON: Record<NotificationLog['channel'], React.ComponentProps<typeof Ionicons>['name']> = {
  EMAIL: 'mail-outline',
  SMS: 'chatbubble-outline',
  WHATSAPP: 'logo-whatsapp',
  FCM: 'notifications-outline',
};

export const LogRow = React.memo(function LogRow({ log, colors }: { log: NotificationLog; colors: CmsThemeColors }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <View style={st.channelRow}>
          <Ionicons name={CHANNEL_ICON[log.channel] ?? 'notifications-outline'} size={14} color={colors.textSecondary} />
          <Text style={[st.eventCode, { color: colors.textPrimary }]} numberOfLines={1}>
            {log.event_code}
          </Text>
        </View>
        <CmsStatusBadge meta={getLogStatusMeta(log.status)} />
      </View>

      <Text style={[st.target, { color: colors.textSecondary }]} numberOfLines={1}>
        {log.target}
      </Text>

      {log.error ? (
        <Text style={[st.error, { color: colors.danger }]} numberOfLines={2}>
          {log.error}
        </Text>
      ) : null}

      <Text style={[st.date, { color: colors.textSecondary }]}>{formatLogDate(log.created_on)}</Text>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  eventCode: { ...cmsType.listSubtitle, flex: 1 },
  target: cmsType.listMeta,
  error: { ...cmsType.listMeta, fontWeight: '600' },
  date: { ...cmsType.listMeta, marginTop: 2 },
});
