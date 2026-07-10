import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WalletListItem } from '@/api/wallets';
import { useWalletTransactions } from '@/api/wallets';

import { CmsCard, CmsField, CmsModal, CmsStatusBadge as StatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { formatLedgerDate, getTransactionSourceLabel, getTransactionStatusMeta, inr } from '../utils';

type Props = { colors: CmsThemeColors; wallet: WalletListItem | null };

/**
 * Read-only inspector — balance, locks, ledger. The transactions endpoint is
 * user-scoped on the backend (`?wallet=` requires admin authorisation); if
 * that isn't wired up yet, this gracefully shows just the wallet header —
 * same caveat as the Vite reference.
 */
export const WalletDetailsModal = React.forwardRef<BottomSheetModal, Props>(({ colors, wallet }, ref) => {
  const txQuery = useWalletTransactions(wallet?.id ?? null);
  const txns = txQuery.data?.data ?? [];

  if (!wallet) {
    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Wallet Details">
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No wallet selected.</Text>
        </View>
      </CmsModal>
    );
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title="Wallet Details">
      <BottomSheetScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={st.scroll}>
        <Text style={[st.sub, { color: colors.textSecondary }]}>
          {wallet.user_name || `User #${wallet.user}`}
          {wallet.user_phone ? ` · ${wallet.user_phone}` : ''}
          {wallet.user_email ? ` · ${wallet.user_email}` : ''}
        </Text>

        <CmsCard colors={colors}>
          <View style={st.fieldGrid}>
            <CmsField label="Balance" value={inr(wallet.balance)} colors={colors} />
            <CmsField label="Locked" value={inr(wallet.locked_balance)} colors={colors} />
            <CmsField label="Spendable" value={inr(wallet.spendable_balance)} colors={colors} />
            <CmsField label="Max cap" value={inr(wallet.max_balance)} colors={colors} />
            <CmsField label="Status" value={wallet.is_active ? 'Active' : 'Inactive'} colors={colors} />
            <CmsField label="KYC required" value={wallet.is_kyc_required ? 'Yes' : 'No'} colors={colors} />
          </View>
        </CmsCard>

        <CmsCard colors={colors} title="Recent Ledger">
          {txQuery.isLoading ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading ledger…</Text>
          ) : txQuery.isError ? (
            <Text style={{ color: colors.danger, fontSize: 13 }}>
              Could not load transactions. Ledger view may require an admin-scoped endpoint.
            </Text>
          ) : txns.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No transactions yet for this wallet.</Text>
          ) : (
            txns.map((t) => {
              const isCredit = t.transaction_type === 'CREDIT';
              const isHold = t.source === 'LOCK' || t.source === 'UNLOCK';
              const sign = isHold ? '' : isCredit ? '+' : '−';
              const meta = getTransactionStatusMeta(t.status);
              return (
                <View key={t.id} style={[st.ledgerRow, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.ledgerSource, { color: colors.textPrimary }]}>
                      {getTransactionSourceLabel(t.source)}
                    </Text>
                    <Text style={[st.ledgerMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {formatLedgerDate(t.created_on)}
                      {t.note ? ` · ${t.note}` : ''}
                    </Text>
                  </View>
                  <View style={st.ledgerRight}>
                    <Text
                      style={[
                        st.ledgerAmount,
                        { color: isHold ? colors.textSecondary : isCredit ? colors.success : colors.danger },
                      ]}
                    >
                      {sign}
                      {inr(t.amount)}
                    </Text>
                    <StatusBadge meta={meta} />
                  </View>
                </View>
              );
            })
          )}
        </CmsCard>
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  sub: { fontSize: 13, fontWeight: '600' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ledgerSource: cmsType.listSubtitle,
  ledgerMeta: { ...cmsType.listMeta, marginTop: 2 },
  ledgerRight: { alignItems: 'flex-end', gap: 4 },
  ledgerAmount: { fontSize: 13.5, fontWeight: '800' },
});
