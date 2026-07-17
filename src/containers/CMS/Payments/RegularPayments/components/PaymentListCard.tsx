import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentListItem } from '@/api/payments';

import { CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { extractCustomerName, formatPaymentDate, money } from '../utils';

type Props = {
  payment: PaymentListItem;
  colors: CmsThemeColors;
  onEdit: () => void;
};

export const PaymentListCard = React.memo(function PaymentListCard({ payment, colors, onEdit }: Props) {
  const isCredit = payment.transaction_type === 'credit';

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.orderId, { color: colors.textPrimary }]} numberOfLines={1}>
          #{payment.order_details?.id ?? 'NA'}
        </Text>
        <Text style={[st.date, { color: colors.textSecondary }]}>{formatPaymentDate(payment.created_on)}</Text>
      </View>

      <View style={st.fieldGrid}>
        <Field label="Invoice No." value={payment.invoice_details?.title ?? 'NA'} colors={colors} />
        <Field label="Customer" value={extractCustomerName(payment.order_details?.title)} colors={colors} />
        <Field
          label="Amount"
          value={`Rs. ${money(payment.amount)}`}
          colors={colors}
          valueColor={isCredit ? colors.success : colors.danger}
        />
        <Field label="Type" value={payment.transaction_type || 'NA'} colors={colors} />
      </View>

      <View style={st.footerRow}>
        <CmsStatusBadge meta={getPaymentStatusMeta(payment.status)} />
        <Pressable onPress={onEdit} style={[st.editBtn, { borderColor: colors.border }]} hitSlop={6}>
          <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
          <Text style={[st.editLabel, { color: colors.textPrimary }]}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
});

function Field({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: CmsThemeColors;
  valueColor?: string;
}) {
  return (
    <View style={st.field}>
      <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[st.fieldValue, { color: valueColor ?? colors.textPrimary }]} numberOfLines={1}>
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editLabel: cmsType.buttonLabel,
});
