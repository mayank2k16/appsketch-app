import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 3;

const PREVIEW_WIDTH = 90;

function ShortVideoCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={PREVIEW_WIDTH} height={PREVIEW_WIDTH * (12 / 9)} borderRadius={10} />

      <View style={st.body}>
        <View style={st.badgeRow}>
          <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
          <Skeleton colors={colors} width={36} height={18} borderRadius={9} />
        </View>
        <Skeleton colors={colors} width="65%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width="90%" height={11} borderRadius={4} />
        <Skeleton colors={colors} width={110} height={11} borderRadius={4} style={{ marginTop: 2 }} />

        <View style={st.actions}>
          <Skeleton colors={colors} width="100%" height={28} borderRadius={8} style={{ flex: 1 }} />
          <Skeleton colors={colors} width="100%" height={28} borderRadius={8} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors `ShortVideoCard`'s shape (rounded preview on the left, content +
 * badges + Edit/Delete actions on the right) so the list doesn't jump/reflow
 * once real videos arrive — swapped in for the plain "Loading short videos…"
 * text. */
export function ShortVideosSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <ShortVideoCardSkeleton key={i} colors={colors} />
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
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  body: { flex: 1, gap: 6, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
