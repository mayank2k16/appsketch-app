import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { BulkPaymentDetail } from '@/api/payments';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { money } from '../utils';

type Props = { payment: BulkPaymentDetail; colors: CmsThemeColors; onView: () => void };

export const BulkPaymentListCard = React.memo(function BulkPaymentListCard({ payment, colors, onView }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.entity, { color: colors.textPrimary }]} numberOfLines={1}>
          {payment.entity || 'NA'}
        </Text>
        <CmsStatusBadge meta={getPaymentStatusMeta(payment.status)} />
      </View>

      <View style={st.fieldGrid}>
        <Field label="Amount" value={`Rs. ${money(payment.amount)}`} colors={colors} />
        <Field label="Type" value={payment.type || 'NA'} colors={colors} />
        <Field label="Date" value={payment.payment_date || 'NA'} colors={colors} />
      </View>

      <Pressable onPress={onView} style={[st.viewBtn, { borderColor: colors.border }]} hitSlop={6}>
        <Ionicons name="eye-outline" size={15} color={colors.textPrimary} />
        <Text style={[st.viewLabel, { color: colors.textPrimary }]}>View</Text>
      </Pressable>
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
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  entity: { ...cmsType.listTitle, flex: 1 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: '30%', gap: 2 },
  fieldLabel: cmsType.fieldLabel,
  fieldValue: { fontSize: 13.5, fontWeight: '700' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  viewLabel: cmsType.buttonLabel,
});
