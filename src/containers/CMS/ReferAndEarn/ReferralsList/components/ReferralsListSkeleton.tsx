import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const STAT_COUNT = 6;
const ROW_COUNT = 5;

/** Mirrors the analytics `StatTile` strip so it doesn't jump/reflow once
 * real totals arrive — swapped in for the plain "Loading analytics…" text. */
export function ReferralsStatsSkeleton({ colors }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.statScroll} contentContainerStyle={st.statScrollContent}>
      {Array.from({ length: STAT_COUNT }).map((_, i) => (
        <View key={i} style={[st.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Skeleton colors={colors} width="70%" height={10} borderRadius={3} />
          <Skeleton colors={colors} width="50%" height={15} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      ))}
    </ScrollView>
  );
}

function ReferralRowSkeleton({ colors }: Props) {
  return (
    <View style={[st.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.rowHeader}>
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton colors={colors} width="70%" height={13} borderRadius={4} />
          <Skeleton colors={colors} width="40%" height={11} borderRadius={4} />
        </View>
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>
      <View style={st.bonusRow}>
        <Skeleton colors={colors} width={90} height={11} borderRadius={4} />
        <Skeleton colors={colors} width={90} height={11} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width={110} height={10} borderRadius={4} />
    </View>
  );
}

/** Mirrors `ReferralRow`'s shape (referrer→referee + status badge, bonus
 * row, date) so the list doesn't jump/reflow once real referrals arrive —
 * swapped in for the plain "Loading referrals…" text. */
export function ReferralsListSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <ReferralRowSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  statScroll: { flexGrow: 0, marginTop: 12 },
  statScrollContent: { paddingHorizontal: 12, gap: 10 },
  statTile: { width: 118, borderWidth: 1, borderRadius: 12, padding: 10 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginHorizontal: 12, marginTop: 12, gap: 8 },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bonusRow: { flexDirection: 'row', gap: 16 },
});
