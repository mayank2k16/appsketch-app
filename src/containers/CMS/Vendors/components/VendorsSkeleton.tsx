import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 6;
const COMMISSION_ROW_COUNT = 2;

function VendorCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width="55%" height={14} borderRadius={4} />
        <Skeleton colors={colors} width={64} height={18} borderRadius={9} />
      </View>
      <Skeleton colors={colors} width="35%" height={11} borderRadius={4} />
      <View style={st.actions}>
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
        <Skeleton colors={colors} width="100%" height={32} borderRadius={8} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** Mirrors `VendorListCard`'s shape (title + status badge, tenant type,
 * 3-button action row) so the list doesn't jump/reflow once real vendors
 * arrive — swapped in for the plain "Loading vendors…" text. */
export function VendorsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <VendorCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

/** Mirrors a commission row inside `VendorDetailSheet` (field grid + status
 * badge + action row) — swapped in for the plain "Loading commissions…"
 * text inside that card. */
export function CommissionsSkeleton({ colors }: Props) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: COMMISSION_ROW_COUNT }).map((_, i) => (
        <View key={i} style={[st.commissionRow, { borderColor: colors.border }]}>
          <View style={st.commissionFieldsGrid}>
            {[0, 1, 2, 3].map((f) => (
              <View key={f} style={{ minWidth: '40%', gap: 4 }}>
                <Skeleton colors={colors} width="60%" height={9} borderRadius={3} />
                <Skeleton colors={colors} width="80%" height={12} borderRadius={4} />
              </View>
            ))}
          </View>
          <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
        </View>
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
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  commissionRow: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  commissionFieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
