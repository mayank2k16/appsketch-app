import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 4;

function BulkPaymentCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="45%" height={15} borderRadius={4} />
        <Skeleton colors={colors} width={70} height={20} borderRadius={10} />
      </View>

      <View style={st.fieldGrid}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={st.field}>
            <Skeleton colors={colors} width={48} height={9} borderRadius={3} />
            <Skeleton colors={colors} width={64} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      <Skeleton colors={colors} height={30} borderRadius={8} />
    </View>
  );
}

/** Mirrors `BulkPaymentListCard`'s shape (entity + status badge, a 3-field
 * grid, a full-width View button) so the list doesn't jump/reflow once real
 * bulk payments arrive — swapped in for the plain "Loading bulk payments…"
 * text. */
export function BulkPaymentsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <BulkPaymentCardSkeleton key={i} colors={colors} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: '30%' },
});
