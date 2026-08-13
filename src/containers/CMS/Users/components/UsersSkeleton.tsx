import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 5;

function UserCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton colors={colors} width="55%" height={13} borderRadius={4} />
          <Skeleton colors={colors} width="75%" height={11} borderRadius={4} />
        </View>
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>

      <View style={st.footerRow}>
        <Skeleton colors={colors} width={60} height={18} borderRadius={9} />
        <View style={st.actions}>
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
          <Skeleton colors={colors} width={64} height={24} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors `UserListCard`'s shape (avatar + name/meta/status header, role +
 * edit/delete footer) so the list doesn't jump/reflow once real users
 * arrive — swapped in for the plain "Loading…" text. */
export function UsersSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <UserCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 10,
    marginBottom: 12,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actions: { flexDirection: 'row', gap: 8 },
});
