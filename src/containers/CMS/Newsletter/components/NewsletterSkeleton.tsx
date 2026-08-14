import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 5;

function RowSkeleton({ colors, withAction }: Props & { withAction?: boolean }) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="55%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
      </View>
      <View style={st.metaRow}>
        <Skeleton colors={colors} width={110} height={11} borderRadius={4} />
        <Skeleton colors={colors} width={110} height={11} borderRadius={4} />
      </View>
      {withAction ? <Skeleton colors={colors} width={70} height={26} borderRadius={8} style={{ marginTop: 2 }} /> : null}
    </View>
  );
}

/** Mirrors `SubscriberRow`'s shape (email + status badge, two meta lines). */
export function SubscribersSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <RowSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

/** Mirrors `CampaignRow`'s shape (subject + status badge, two meta lines, Send button). */
export function CampaignsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <RowSkeleton key={i} colors={colors} withAction />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metaRow: { flexDirection: 'row', gap: 12 },
});
