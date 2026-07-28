import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AbandonedCartItem } from '@/api/cart';

import { CmsButton, CmsField } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { formatDate } from '../../utils';

type Props = {
  cart: AbandonedCartItem;
  colors: CmsThemeColors;
  onDiscard: () => void;
  discarding: boolean;
};

export const AbandonedCartCard = React.memo(function AbandonedCartCard({ cart, colors, onDiscard, discarding }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[st.title, { color: colors.textPrimary }]}>#{cart.id}</Text>
      <View style={st.fieldGrid}>
        <CmsField
          label="Customer"
          value={cart.customer_name ? `${cart.customer_name} (${cart.customer_phone || '—'})` : 'Guest'}
          colors={colors}
        />
        <CmsField label="Items" value={cart.item_count} colors={colors} />
        <CmsField label="Value" value={`Rs.${parseFloat(String(cart.total_price || 0)).toFixed(2)}`} colors={colors} />
        <CmsField label="Created" value={formatDate(cart.created_on)} colors={colors} />
        <CmsField label="Last Updated" value={formatDate(cart.updated_on)} colors={colors} />
      </View>
      <CmsButton colors={colors} variant="danger" label={discarding ? 'Discarding…' : 'Discard'} onPress={onDiscard} loading={discarding} />
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
