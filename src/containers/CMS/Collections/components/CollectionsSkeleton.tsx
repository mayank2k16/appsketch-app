import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

// How many description lines each skeleton row stubs out — varied so the
// loading rows don't read as one repeated stamp (some collections have no
// description, mirrored here as 0 lines).
const DESC_LINES: (0 | 1 | 2)[] = [2, 1, 0, 2];

function CollectionCardSkeleton({ colors, descLines }: Props & { descLines: 0 | 1 | 2 }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={96} />

      <View style={st.body}>
        <View style={st.headerRow}>
          <Skeleton colors={colors} width="55%" height={14} borderRadius={4} />
          <Skeleton colors={colors} width={60} height={18} borderRadius={9} />
        </View>

        {descLines > 0 ? <Skeleton colors={colors} width="90%" height={11} borderRadius={4} /> : null}
        {descLines > 1 ? <Skeleton colors={colors} width="65%" height={11} borderRadius={4} /> : null}

        <Skeleton colors={colors} width={72} height={11} borderRadius={4} style={{ marginTop: 2 }} />

        <View style={st.actions}>
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors `CollectionCard`'s horizontal shape (left-edge image + right-side
 * title/badge/description/count/actions) so the list doesn't jump/reflow
 * once real collections arrive — swapped in for the plain "Loading
 * collections…" text. */
export function CollectionsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {DESC_LINES.map((descLines, i) => (
        <CollectionCardSkeleton key={i} colors={colors} descLines={descLines} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
