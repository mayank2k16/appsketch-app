import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

// Whether each skeleton row carries a description line — varied so the
// loading rows don't read as one repeated stamp.
const HAS_DESCRIPTION = [true, false, true, true];

function DiscountCardSkeleton({ colors, hasDescription }: Props & { hasDescription: boolean }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="45%" height={15} borderRadius={4} />
        <Skeleton colors={colors} width={60} height={18} borderRadius={9} />
      </View>

      {hasDescription ? <Skeleton colors={colors} width="80%" height={11} borderRadius={4} /> : null}

      <View style={st.fieldGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={st.field}>
            <Skeleton colors={colors} width={54} height={9} borderRadius={3} />
            <Skeleton colors={colors} width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      <View style={st.footerRow}>
        <Skeleton colors={colors} height={30} borderRadius={8} style={{ flex: 1 }} />
        <Skeleton colors={colors} height={30} borderRadius={8} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** Mirrors `DiscountListCard`'s shape (code + status badge, optional
 * description, a 2×2 field grid, View/Delete footer buttons) so the list
 * doesn't jump/reflow once real discount codes arrive — swapped in for the
 * plain "Loading discount codes…" text. */
export function DiscountsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {HAS_DESCRIPTION.map((hasDescription, i) => (
        <DiscountCardSkeleton key={i} colors={colors} hasDescription={hasDescription} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 },
  field: { minWidth: '45%' },
  footerRow: { flexDirection: 'row', gap: 8, paddingTop: 10, marginTop: 2 },
});
