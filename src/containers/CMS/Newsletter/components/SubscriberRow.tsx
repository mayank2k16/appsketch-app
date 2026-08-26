import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { NewsletterSubscriber } from '@/api/newsletter';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { fmtDate, getSubscriberStatusMeta } from '../utils';

type Props = {
  subscriber: NewsletterSubscriber;
  colors: CmsThemeColors;
};

export const SubscriberRow = React.memo(function SubscriberRow({ subscriber, colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.email, { color: colors.textPrimary }]} numberOfLines={1}>
          {subscriber.email}
        </Text>
        <CmsStatusBadge meta={getSubscriberStatusMeta(subscriber)} />
      </View>
      <View style={st.metaRow}>
        <Text style={[st.metaText, { color: colors.textSecondary }]}>
          Confirmed {fmtDate(subscriber.confirmed_on)}
        </Text>
        <Text style={[st.metaText, { color: colors.textSecondary }]}>
          Subscribed since {fmtDate(subscriber.created_on)}
        </Text>
      </View>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  email: { ...cmsType.listTitle, flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: cmsType.listMeta,
});
