import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 8;

function ConversationRowSkeleton({ colors }: Props) {
  return (
    <View style={[st.row, { borderColor: colors.border }]}>
      <Skeleton colors={colors} width={38} height={38} borderRadius={19} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={st.topRow}>
          <Skeleton colors={colors} width="50%" height={13} borderRadius={4} />
          <Skeleton colors={colors} width={36} height={10} borderRadius={4} />
        </View>
        <Skeleton colors={colors} width="75%" height={11} borderRadius={4} />
      </View>
    </View>
  );
}

/** Mirrors `ConversationRow`'s shape (avatar + name/time row + preview line)
 * so the inbox doesn't jump/reflow once real conversations arrive — swapped
 * in for the plain "Loading…" text. */
export function ConversationsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <ConversationRowSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
