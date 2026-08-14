import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { Skeleton } from '../../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 8;

function LogCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="50%" height={13} borderRadius={4} />
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="65%" height={11} borderRadius={4} />
      <Skeleton colors={colors} width="35%" height={10} borderRadius={4} style={{ marginTop: 2 }} />
    </View>
  );
}

/** Mirrors `LogRow`'s shape (channel icon + event code + status badge,
 * target line, date) so the list doesn't jump/reflow once real logs arrive
 * — swapped in for the plain "Loading logs…" text. */
export function LogsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <LogCardSkeleton key={i} colors={colors} />
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
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
