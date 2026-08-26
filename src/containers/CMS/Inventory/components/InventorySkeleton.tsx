import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 5;

function InventoryCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="50%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width={60} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="80%" height={11} borderRadius={4} />
      <View style={st.footerRow}>
        <Skeleton colors={colors} width={60} height={11} borderRadius={4} />
        <Skeleton colors={colors} width={70} height={11} borderRadius={4} />
        <Skeleton colors={colors} width={70} height={11} borderRadius={4} />
      </View>
    </View>
  );
}

/** Mirrors `InventoryCard`'s shape (name + active badge, address, code/
 * pincode/distance meta row) so the list doesn't jump/reflow once real
 * locations arrive — swapped in for the plain "Loading inventory
 * locations…" text. */
export function InventorySkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 12 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <InventoryCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
});
