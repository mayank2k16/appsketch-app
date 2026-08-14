import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 4;

function RuleCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton colors={colors} width="55%" height={14} borderRadius={4} />
          <Skeleton colors={colors} width="35%" height={11} borderRadius={4} />
        </View>
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>

      <View style={[st.rewardGrid, { borderColor: colors.border }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton colors={colors} width="60%" height={10} borderRadius={3} />
          <Skeleton colors={colors} width="40%" height={14} borderRadius={4} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton colors={colors} width="60%" height={10} borderRadius={3} />
          <Skeleton colors={colors} width="40%" height={14} borderRadius={4} />
        </View>
      </View>

      <View style={st.metaGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={st.metaCell}>
            <Skeleton colors={colors} width="70%" height={9} borderRadius={3} />
            <Skeleton colors={colors} width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      <View style={st.actionsRow}>
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** Mirrors `RulesScreen`'s card shape (title/trigger + status badge, reward
 * grid, meta grid, action row) so the list doesn't jump/reflow once real
 * rules arrive — swapped in for the plain "Loading rules…" text. */
export function RulesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <RuleCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rewardGrid: { flexDirection: 'row', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaCell: { minWidth: '45%' },
  actionsRow: { flexDirection: 'row', gap: 8 },
});
