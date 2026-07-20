import { Image } from 'expo-image';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SupportOrder } from '@/api/support';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  order: SupportOrder;
};

export function OrderCard({ colors, order }: Props) {
  const items = order.items ?? [];
  return (
    <CmsCard colors={colors} style={st.card}>
      <View style={st.headRow}>
        <Text style={[st.orderLabel, { color: colors.textPrimary }]}>Order #{order.id}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>₹{order.total_price ?? '—'}</Text>
        {order.status ? <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>· {order.status}</Text> : null}
        {order.items_count != null ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>· {order.items_count} item(s)</Text>
        ) : null}
      </View>

      {items.length > 0 ? (
        <View style={st.itemsRow}>
          {items.map((it) => (
            <View key={it.id} style={[st.item, { borderColor: colors.border }]}>
              {it.photo ? (
                <Image source={{ uri: it.photo }} style={st.thumb} contentFit="cover" />
              ) : (
                <View style={[st.thumb, st.thumbFallback, { backgroundColor: colors.background }]}>
                  <Text>🍱</Text>
                </View>
              )}
              <Text style={{ color: colors.textPrimary, fontSize: 11.5, flexShrink: 1 }} numberOfLines={1}>
                {it.title || 'Item'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>× {it.quantity ?? 1}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>₹{it.final_price ?? it.price ?? '—'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10, gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  orderLabel: { fontSize: 13, fontWeight: '800' },
  itemsRow: { gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  thumb: { width: 28, height: 28, borderRadius: 6 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
});
