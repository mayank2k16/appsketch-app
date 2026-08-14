import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 5;
const FIELD_COUNT = 6;

function StockHistoryCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width="65%" height={14} borderRadius={4} />
      <View style={st.fieldGrid}>
        {Array.from({ length: FIELD_COUNT }).map((_, i) => (
          <View key={i} style={st.field}>
            <Skeleton colors={colors} width="70%" height={9} borderRadius={3} />
            <Skeleton colors={colors} width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Mirrors `StockHistoryCard`'s shape (product title + field grid) so the
 * list doesn't jump/reflow once real records arrive — swapped in for the
 * plain "Loading Stock History…" text. */
export function StockHistorySkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 12 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <StockHistoryCardSkeleton key={i} colors={colors} />
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
    gap: 10,
  },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: '40%' },
});
