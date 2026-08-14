import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

const CARD_COUNT = 5;
const LEDGER_ROW_COUNT = 4;

function WalletCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton colors={colors} width="55%" height={13} borderRadius={4} />
          <Skeleton colors={colors} width="40%" height={11} borderRadius={4} />
        </View>
        <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
      </View>
      <View style={[st.balanceRow, { borderColor: colors.border }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={st.balanceCell}>
            <Skeleton colors={colors} width="60%" height={9} borderRadius={3} />
            <Skeleton colors={colors} width="70%" height={13} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      <View style={st.actions}>
        <Skeleton colors={colors} width="100%" height={34} borderRadius={10} style={{ flex: 1 }} />
        <Skeleton colors={colors} width="100%" height={34} borderRadius={10} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** Mirrors `WalletCard`'s shape (avatar + name/meta + badges, 3-cell
 * balance row, 2-button action row) so the list doesn't jump/reflow once
 * real wallets arrive — swapped in for the plain "Loading wallets…" text. */
export function WalletsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <WalletCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

/** Mirrors a `WalletDetailsModal` ledger row (source + date, amount + status
 * badge) — swapped in for the plain "Loading ledger…" text inside that
 * card. */
export function LedgerSkeleton({ colors }: Props) {
  return (
    <View>
      {Array.from({ length: LEDGER_ROW_COUNT }).map((_, i) => (
        <View key={i} style={[st.ledgerRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton colors={colors} width="45%" height={13} borderRadius={4} />
            <Skeleton colors={colors} width="65%" height={11} borderRadius={4} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Skeleton colors={colors} width={60} height={13} borderRadius={4} />
            <Skeleton colors={colors} width={54} height={18} borderRadius={9} />
          </View>
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
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  balanceCell: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
