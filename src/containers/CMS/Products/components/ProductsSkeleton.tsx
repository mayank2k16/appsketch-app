import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 6;

function ProductCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={52} height={52} borderRadius={10} />

      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton colors={colors} width="70%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width="90%" height={11} borderRadius={4} />
        <Skeleton colors={colors} width={90} height={12} borderRadius={4} style={{ marginTop: 2 }} />
      </View>
    </View>
  );
}

/** Mirrors `ProductListCard`'s shape (thumbnail + name/description/price
 * row) so the list doesn't jump/reflow once real products arrive — swapped
 * in for the plain "Loading products…" text. */
export function ProductsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <ProductCardSkeleton key={i} colors={colors} />
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
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
});
