import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { InvoiceListItem } from '@/api/invoices';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { formatInvoiceDate, getInvoiceStatusMeta, money } from '../utils';

type Props = {
  invoice: InvoiceListItem;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
};

export const InvoiceListCard = React.memo(function InvoiceListCard({ invoice, colors, onEdit, onDelete }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.invoiceId, { color: colors.textPrimary }]} numberOfLines={1}>
          {invoice.invoice_id || 'N/A'}
        </Text>
        <Text style={[st.date, { color: colors.textSecondary }]}>{formatInvoiceDate(invoice.created_on)}</Text>
      </View>

      <View style={st.fieldGrid}>
        <Field label="Order ID" value={invoice.order_id ? `#${invoice.order_id}` : 'N/A'} colors={colors} />
        <Field label="Amount" value={`Rs. ${money(invoice.final_price)}`} colors={colors} />
        <Field label="Type" value={invoice.type || 'N/A'} colors={colors} />
        {invoice.invoice_url ? (
          <Pressable onPress={() => Linking.openURL(invoice.invoice_url as string)} style={st.field}>
            <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>Invoice URL</Text>
            <Text style={[st.fieldValue, { color: colors.accent }]} numberOfLines={1}>
              View Invoice
            </Text>
          </Pressable>
        ) : (
          <Field label="Invoice URL" value="N/A" colors={colors} />
        )}
      </View>

      <View style={st.footerRow}>
        <CmsStatusBadge meta={getInvoiceStatusMeta(invoice.status)} />
        <View style={st.actions}>
          <Pressable onPress={onEdit} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
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
  invoiceId: cmsType.listTitle,
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
