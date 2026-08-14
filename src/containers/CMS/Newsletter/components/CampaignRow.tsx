import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { NewsletterCampaign } from '@/api/newsletter';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { fmtDate, getCampaignStatusMeta } from '../utils';

type Props = {
  campaign: NewsletterCampaign;
  colors: CmsThemeColors;
  sending: boolean;
  onSend: () => void;
};

export const CampaignRow = React.memo(function CampaignRow({ campaign, colors, sending, onSend }: Props) {
  const canSend = campaign.status === 'draft' && !sending;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.subject, { color: colors.textPrimary }]} numberOfLines={1}>
          {campaign.subject}
        </Text>
        <CmsStatusBadge meta={getCampaignStatusMeta(campaign.status)} />
      </View>
      <View style={st.metaRow}>
        <Text style={[st.metaText, { color: colors.textSecondary }]}>
          {campaign.total_recipients} recipient{campaign.total_recipients === 1 ? '' : 's'}
        </Text>
        <Text style={[st.metaText, { color: colors.textSecondary }]}>Sent {fmtDate(campaign.sent_on)}</Text>
      </View>

      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={[st.sendBtn, { borderColor: colors.border, backgroundColor: colors.background }, !canSend && st.sendBtnDisabled]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[st.sendLabel, { color: canSend ? colors.accent : colors.textSecondary }]}>Send</Text>
        )}
      </Pressable>
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
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subject: { ...cmsType.listTitle, flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: cmsType.listMeta,
  sendBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendLabel: cmsType.buttonLabel,
});
