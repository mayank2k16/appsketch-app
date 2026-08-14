import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;

function BookingCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="45%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="35%" height={11} borderRadius={4} />
      <Skeleton colors={colors} width="55%" height={11} borderRadius={4} />
      <View style={st.footerRow}>
        <Skeleton colors={colors} width={100} height={12} borderRadius={4} />
        <Skeleton colors={colors} width={50} height={13} borderRadius={4} />
      </View>
    </View>
  );
}

/** Mirrors `BookingCard`'s shape (patient name + status badge, phone,
 * doctor line, time + fee) so the list doesn't jump/reflow once real
 * bookings arrive — swapped in for the plain "Loading bookings…" text. */
export function BookingsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <BookingCardSkeleton key={i} colors={colors} />
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
    gap: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
});
