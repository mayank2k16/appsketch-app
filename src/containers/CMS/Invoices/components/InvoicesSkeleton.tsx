import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const ROW_COUNT = 4;

function InvoiceCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width={90} height={15} borderRadius={4} />
        <Skeleton colors={colors} width={72} height={11} borderRadius={4} />
      </View>

      <View style={st.fieldGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={st.field}>
            <Skeleton colors={colors} width={60} height={9} borderRadius={3} />
            <Skeleton colors={colors} width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      <View style={st.footerRow}>
        <Skeleton colors={colors} width={70} height={20} borderRadius={10} />
        <View style={st.actions}>
          <Skeleton colors={colors} width={30} height={30} borderRadius={8} />
          <Skeleton colors={colors} width={30} height={30} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors `InvoiceListCard`'s shape (invoice id + date, a 2×2 field grid,
 * status badge + Edit/Delete icon buttons) so the list doesn't jump/reflow
 * once real invoices arrive — swapped in for the plain "Loading invoices…"
 * text. */
export function InvoicesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <InvoiceCardSkeleton key={i} colors={colors} />
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
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: '45%' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  actions: { flexDirection: 'row', gap: 8 },
});
