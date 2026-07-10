import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SmsTemplate } from '@/api/notifications';

import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';

export const SmsTemplateRow = React.memo(function SmsTemplateRow({
  template,
  colors,
  onEdit,
  onDelete,
}: {
  template: SmsTemplate;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const isDefault = template.tenant === null;

  return (
    <Pressable onPress={onEdit} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {template.title}
        </Text>
        {isDefault ? (
          <Text style={[st.defaultBadge, { color: colors.textSecondary, borderColor: colors.border }]}>Default</Text>
        ) : (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        )}
      </View>
      <Text style={[st.body, { color: colors.textSecondary }]} numberOfLines={2}>
        {template.body}
      </Text>
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
    gap: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { ...cmsType.listSubtitle, flex: 1 },
  body: cmsType.listMeta,
  defaultBadge: {
    ...cmsType.listBadge,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
