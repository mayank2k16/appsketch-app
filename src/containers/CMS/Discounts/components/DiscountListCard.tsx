import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DiscountCodeItem } from '@/api/discounts';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { formatDiscountDateTime, getDiscountStatusMeta } from '../utils';

type Props = {
  discount: DiscountCodeItem;
  colors: CmsThemeColors;
  onView: () => void;
  onDelete: () => void;
};

export const DiscountListCard = React.memo(function DiscountListCard({ discount, colors, onView, onDelete }: Props) {
  const appliedOn = discount.discount_attributes?.[0]?.applied_on;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.code, { color: colors.textPrimary }]} numberOfLines={1}>
          {discount.code || 'NA'}
        </Text>
        <CmsStatusBadge meta={getDiscountStatusMeta(discount.is_active)} />
      </View>

      {discount.code_description ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }} numberOfLines={2}>
          {discount.code_description}
        </Text>
      ) : null}

      <View style={st.fieldGrid}>
        <Field label="Start Time" value={formatDiscountDateTime(discount.start_time)} colors={colors} />
        <Field label="End Time" value={formatDiscountDateTime(discount.end_time)} colors={colors} />
        <Field label="Apply Type" value={discount.apply_type || 'N/A'} colors={colors} />
        <Field label="Applicable On" value={appliedOn || 'N/A'} colors={colors} />
      </View>

      <View style={st.footerRow}>
        <Pressable onPress={onView} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
          <Ionicons name="eye-outline" size={15} color={colors.textPrimary} />
          <Text style={[st.actionLabel, { color: colors.textPrimary }]}>View</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
          <Text style={[st.actionLabel, { color: colors.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
});

function Field({ label, value, colors }: { label: string; value: string; colors: CmsThemeColors }) {
  return (
    <View style={st.field}>
      <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[st.fieldValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { ...cmsType.listTitle, flex: 1 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 },
  field: { minWidth: '45%', gap: 2 },
  fieldLabel: cmsType.fieldLabel,
  fieldValue: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionLabel: cmsType.buttonLabel,
});
