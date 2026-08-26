import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

// Whether each skeleton row carries the "★ Featured" badge and a subtitle
// line, mirrored from StoryCard's optional badge/subtitle — varied so the
// loading rows don't read as one repeated stamp.
const ROWS: { featured: boolean; hasSubtitle: boolean }[] = [
  { featured: true, hasSubtitle: true },
  { featured: false, hasSubtitle: true },
  { featured: false, hasSubtitle: false },
];

function StoryCardSkeleton({ colors, featured, hasSubtitle }: Props & { featured: boolean; hasSubtitle: boolean }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={100} />

      <View style={st.body}>
        <View style={st.badgeRow}>
          {featured ? <Skeleton colors={colors} width={80} height={18} borderRadius={9} /> : null}
          <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
        </View>

        <Skeleton colors={colors} width="70%" height={14} borderRadius={4} />
        {hasSubtitle ? <Skeleton colors={colors} width="90%" height={11} borderRadius={4} /> : null}
        <Skeleton colors={colors} width={100} height={10} borderRadius={4} />

        <View style={st.actions}>
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors `StoryCard`'s horizontal shape (left-edge image + right-side
 * badge row/title/subtitle/timestamp/actions) so the list doesn't
 * jump/reflow once real stories arrive — swapped in for the plain "Loading
 * stories…" text. */
export function StoriesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {ROWS.map((row, i) => (
        <StoryCardSkeleton key={i} colors={colors} featured={row.featured} hasSubtitle={row.hasSubtitle} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  body: { flex: 1, padding: 12, gap: 6, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
