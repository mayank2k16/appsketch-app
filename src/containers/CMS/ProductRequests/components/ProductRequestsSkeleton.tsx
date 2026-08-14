import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;

function ProductRequestCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={52} height={52} borderRadius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton colors={colors} width="70%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width="90%" height={11} borderRadius={4} />
        <View style={st.metaRow}>
          <Skeleton colors={colors} width={60} height={13} borderRadius={4} />
          <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
        </View>
        <Skeleton colors={colors} width="45%" height={11} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width={22} height={22} borderRadius={6} />
    </View>
  );
}

/** Mirrors `ProductRequestCard`'s shape (thumbnail, name, description,
 * price + status badge, vendor, checkbox) so the list doesn't jump/reflow
 * once real requests arrive — swapped in for the plain "Loading product
 * requests…" text. */
export function ProductRequestsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <ProductRequestCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
