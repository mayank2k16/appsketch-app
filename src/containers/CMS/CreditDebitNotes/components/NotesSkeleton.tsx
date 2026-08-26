import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 6;

function NoteCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="45%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="60%" height={11} borderRadius={4} style={{ marginTop: 2 }} />
      <View style={st.footerRow}>
        <Skeleton colors={colors} width={70} height={15} borderRadius={4} />
        <Skeleton colors={colors} width={90} height={11} borderRadius={4} />
      </View>
    </View>
  );
}

/** Mirrors `NoteListCard`'s shape (ref + type badge header, entity line,
 * amount + document-link footer) so the list doesn't jump/reflow once real
 * notes arrive — swapped in for the plain "Loading notes…" text. */
export function NotesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <NoteCardSkeleton key={i} colors={colors} />
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
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
});
