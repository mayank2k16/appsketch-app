import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { StockHistoryEntry } from '@/api/stock-history';

import { CmsField } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  entry: StockHistoryEntry;
  colors: CmsThemeColors;
};

export const StockHistoryCard = React.memo(function StockHistoryCard({ entry, colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {entry.product?.product_name || '—'}
      </Text>
      <View style={st.fieldGrid}>
        <CmsField label="Inventory" value={entry.inventory?.name} colors={colors} />
        <CmsField label="Added By" value={entry.added_by?.name} colors={colors} />
        <CmsField label="Quantity" value={entry.quantity} colors={colors} />
        <CmsField label="Batch Number" value={entry.batch_number} colors={colors} />
        <CmsField label="Net Rate" value={entry.net_rate} colors={colors} />
        <CmsField label="Purchase Trade Rate" value={entry.purchase_trade_rate} colors={colors} />
        <CmsField label="Serial Number" value={entry.serial_number} colors={colors} />
        <CmsField label="Catalogue Number" value={entry.catalogue_number} colors={colors} />
        <CmsField label="Manufacturer Date" value={entry.manufacturer_date} colors={colors} />
        <CmsField label="Procurement Price" value={entry.procurement_price_per_product} colors={colors} />
      </View>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  title: cmsType.listTitle,
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
