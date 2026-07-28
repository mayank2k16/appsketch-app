import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CheckoutOrderItem } from '@/api/cart';

import { CmsField, CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { formatDate } from '../../utils';

type Props = {
  order: CheckoutOrderItem;
  colors: CmsThemeColors;
};

export const CheckoutOrderCard = React.memo(function CheckoutOrderCard({ order, colors }: Props) {
  const hasLocation = order.address?.latitude != null && order.address?.longitude != null;
  const mapUrl = hasLocation ? `https://www.google.com/maps?q=${order.address!.latitude},${order.address!.longitude}` : null;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.title, { color: colors.textPrimary }]}>#{order.id}</Text>
        <CmsStatusBadge meta={{ label: '● Checkout', color: '#92400e', kind: 'warning' }} />
      </View>
      <View style={st.fieldGrid}>
        <CmsField
          label="Customer"
          value={order.customer?.name ? `${order.customer.name} (${order.customer.phone_number || '—'})` : 'N/A'}
          colors={colors}
        />
        <CmsField label="Date" value={formatDate(order.created_on)} colors={colors} />
        <CmsField label="Total" value={`Rs.${parseFloat(String(order.total_price || 0)).toFixed(2)}`} colors={colors} />
      </View>
      {mapUrl ? (
        <Pressable onPress={() => Linking.openURL(mapUrl)}>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12.5 }}>View On Map</Text>
        </Pressable>
      ) : null}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: cmsType.listTitle,
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
