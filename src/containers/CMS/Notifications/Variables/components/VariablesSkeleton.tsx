import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CHIP_COUNT = 6;
const CARD_COUNT = 4;

/** Mirrors the `SystemVariableChip` row so the System Variables card doesn't
 * jump/reflow once real variables arrive — swapped in for the plain
 * "Loading…" text inside that card. */
export function SystemVariablesSkeleton({ colors }: Props) {
  return (
    <View style={st.chipWrap}>
      {Array.from({ length: CHIP_COUNT }).map((_, i) => (
        <Skeleton key={i} colors={colors} width={70 + (i % 3) * 20} height={26} borderRadius={13} style={{ marginRight: 8, marginBottom: 8 }} />
      ))}
    </View>
  );
}

function CustomVariableCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="50%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="65%" height={11} borderRadius={4} />
      <Skeleton colors={colors} width="40%" height={11} borderRadius={4} />
    </View>
  );
}

/** Mirrors `CustomVariableRow`'s shape (name + status badge, label, source
 * meta) so the list doesn't jump/reflow once real variables arrive. */
export function CustomVariablesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <CustomVariableCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
