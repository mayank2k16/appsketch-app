import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { VendorSettlementListItem } from '@/api/payments';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { formatSettlementDate, money } from '../utils';

type Props = {
  settlement: VendorSettlementListItem;
  colors: CmsThemeColors;
  onView: () => void;
  onDelete: () => void;
};

export const SettlementListCard = React.memo(function SettlementListCard({ settlement, colors, onView, onDelete }: Props) {
  const orderId = settlement.vendor_order ?? settlement.parent_order ?? 'NA';
  const vendorLabel = settlement.parent_tenant?.title ?? settlement.vendor_tenant?.title ?? 'NA';

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.orderId, { color: colors.textPrimary }]} numberOfLines={1}>
          #{orderId}
        </Text>
        <Text style={[st.date, { color: colors.textSecondary }]}>{formatSettlementDate(settlement.created_on)}</Text>
      </View>

      <View style={st.fieldGrid}>
        <Field label="Vendor" value={vendorLabel} colors={colors} />
        <Field label="Total Commission" value={`Rs. ${money(settlement.total_commission)}`} colors={colors} />
        <Field label="Vendor Payout" value={`Rs. ${money(settlement.vendor_payout)}`} colors={colors} />
        <Field label="Gross Amount" value={`Rs. ${money(settlement.gross_amount)}`} colors={colors} />
      </View>

      <View style={st.footerRow}>
        <CmsStatusBadge meta={getPaymentStatusMeta(settlement.status)} />
        <View style={st.actions}>
          <Pressable onPress={onView} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="eye-outline" size={15} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={onDelete} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
          </Pressable>
        </View>
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
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: cmsType.listTitle,
  date: cmsType.listMeta,
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: '45%', gap: 2 },
  fieldLabel: cmsType.fieldLabel,
  fieldValue: { fontSize: 13.5, fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 7,
  },
});
