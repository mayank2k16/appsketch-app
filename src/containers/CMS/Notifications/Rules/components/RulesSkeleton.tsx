import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 5;

function RuleCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="60%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width={16} height={16} borderRadius={4} />
      </View>
      <View style={st.metaRow}>
        <Skeleton colors={colors} width={48} height={16} borderRadius={4} />
        <Skeleton colors={colors} width="40%" height={11} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
    </View>
  );
}

/** Mirrors `RuleRow`'s shape (event name + delete icon, channel badge +
 * target, status badge) so the list doesn't jump/reflow once real rules
 * arrive — swapped in for the plain "Loading rules…" text. */
export function RulesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <RuleCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
