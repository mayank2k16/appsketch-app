import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { EmailTemplate, NotificationEvent, NotificationRule, SmsTemplate } from '@/api/notifications';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

function targetLabel(rule: NotificationRule, emailTemplates: EmailTemplate[], smsTemplates: SmsTemplate[]) {
  if (rule.channel === 'EMAIL') return emailTemplates.find((t) => t.id === rule.email_template)?.name ?? '—';
  if (rule.channel === 'SMS') return smsTemplates.find((t) => t.id === rule.sms_template)?.title ?? '—';
  if (rule.channel === 'FCM') return rule.fcm_title_template || '—';
  return '—';
}

export const RuleRow = React.memo(function RuleRow({
  rule,
  event,
  emailTemplates,
  smsTemplates,
  colors,
  onEdit,
  onDelete,
}: {
  rule: NotificationRule;
  event: NotificationEvent | undefined;
  emailTemplates: EmailTemplate[];
  smsTemplates: SmsTemplate[];
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onEdit} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.eventName, { color: colors.textPrimary }]} numberOfLines={1}>
          {event?.name ?? rule.event_code}
        </Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </Pressable>
      </View>

      <View style={st.metaRow}>
        <Text style={[st.channelBadge, { color: colors.accent, borderColor: colors.accent }]}>{rule.channel}</Text>
        <Text style={[st.target, { color: colors.textSecondary }]} numberOfLines={1}>
          {targetLabel(rule, emailTemplates, smsTemplates)}
        </Text>
      </View>

      <CmsStatusBadge
        meta={
          rule.is_active
            ? { label: 'Active', color: colors.success, kind: 'success' }
            : { label: 'Inactive', color: colors.textSecondary, kind: 'info' }
        }
      />
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eventName: { ...cmsType.listSubtitle, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  channelBadge: {
    ...cmsType.listBadge,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  target: { ...cmsType.listMeta, flex: 1 },
});
