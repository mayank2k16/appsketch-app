import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;

function OrderCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width={60} height={14} borderRadius={4} />
        <Skeleton colors={colors} width={70} height={11} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width="55%" height={12} borderRadius={4} />
      <View style={st.badgeRow}>
        <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
        <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
      </View>
      <View style={st.footerRow}>
        <Skeleton colors={colors} width={80} height={15} borderRadius={4} />
        <Skeleton colors={colors} width={90} height={26} borderRadius={8} />
      </View>
    </View>
  );
}

/** Mirrors `OrderListItem`'s shape (order id + date, customer line, status
 * badges, total + action row) so the list doesn't jump/reflow once real
 * orders arrive — swapped in for the plain "Loading orders…" text. */
export function OrdersSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <OrderCardSkeleton key={i} colors={colors} />
      ))}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
