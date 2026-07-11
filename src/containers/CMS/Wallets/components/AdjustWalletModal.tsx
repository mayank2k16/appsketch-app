import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WalletListItem, WalletTransactionType } from '@/api/wallets';
import { useAdjustWallet } from '@/api/wallets';

import { CmsButton, CmsCard, CmsInput, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { inr } from '../utils';

type Props = {
  colors: CmsThemeColors;
  wallet: WalletListItem | null;
  onDone: () => void;
};

/** Tenant admin -> credit or debit a single user's wallet with a free-form
 * note. Backend writes a WalletTransaction with source=ADMIN_ADJUST. */
export const AdjustWalletModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, wallet, onDone }, ref) => {
    const [direction, setDirection] = React.useState<WalletTransactionType>('CREDIT');
    const [amount, setAmount] = React.useState('');
    const [note, setNote] = React.useState('');
    const [formError, setFormError] = React.useState('');

    React.useEffect(() => {
      setDirection('CREDIT');
      setAmount('');
      setNote('');
      setFormError('');
    }, [wallet]);

    const adjustWallet = useAdjustWallet();

    if (!wallet) {
      return (
        <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Adjust Wallet">
          <View style={{ padding: 24 }}>
            <Text style={{ color: colors.textSecondary }}>No wallet selected.</Text>
          </View>
        </CmsModal>
      );
    }

    const userId = wallet.user;
    const spendable = Number(wallet.spendable_balance || 0);
    const numericAmount = Number(amount);
    const isInvalidNumber = !amount || Number.isNaN(numericAmount) || numericAmount <= 0;
    const overflowsDebit = direction === 'DEBIT' && numericAmount > spendable + 0.0001;

    function handleSubmit() {
      setFormError('');
      if (isInvalidNumber) {
        setFormError('Enter an amount greater than 0.');
        return;
      }
      if (overflowsDebit) {
        setFormError(`Cannot debit more than spendable balance (${inr(spendable)}).`);
        return;
      }
      adjustWallet.mutate(
        {
          profile_id: userId,
          direction,
          amount: String(numericAmount),
          note: note.trim(),
        },
        { onSuccess: () => onDone() }
      );
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['75%']} title="Adjust Wallet">
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[st.sub, { color: colors.textSecondary }]}>
            {wallet.user_name || `User #${wallet.user}`}
            {wallet.user_phone ? ` · ${wallet.user_phone}` : ''}
          </Text>

          <CmsCard colors={colors}>
            <View style={st.balanceRow}>
              <BalanceCell label="Balance" value={inr(wallet.balance)} colors={colors} />
              <BalanceCell label="Locked" value={inr(wallet.locked_balance)} colors={colors} muted />
              <BalanceCell label="Spendable" value={inr(spendable)} colors={colors} accent={colors.accent} bold />
            </View>
          </CmsCard>

          <View style={st.directionGroup}>
            <Pressable
              onPress={() => setDirection('CREDIT')}
              style={[
                st.dirBtn,
                { borderColor: colors.border },
                direction === 'CREDIT' && { backgroundColor: colors.success, borderColor: colors.success },
              ]}
            >
              <Text style={[st.dirLabel, { color: direction === 'CREDIT' ? colors.accentText : colors.textPrimary }]}>
                ＋ Credit
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDirection('DEBIT')}
              style={[
                st.dirBtn,
                { borderColor: colors.border },
                direction === 'DEBIT' && { backgroundColor: colors.danger, borderColor: colors.danger },
              ]}
            >
              <Text style={[st.dirLabel, { color: direction === 'DEBIT' ? colors.accentText : colors.textPrimary }]}>
                － Debit
              </Text>
            </Pressable>
          </View>

          <View>
            <CmsInput
              colors={colors}
              label="Amount (₹)"
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
            />
            {direction === 'DEBIT' ? (
              <Text style={[st.hint, { color: colors.textSecondary }]}>
                Max debit (spendable): <Text style={{ fontWeight: '700' }}>{inr(spendable)}</Text>
              </Text>
            ) : null}
          </View>

          <View>
            <CmsInput
              colors={colors}
              label="Note (for audit)"
              placeholder="Reason for adjustment — appears in the user's ledger."
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 500))}
              multiline
              numberOfLines={3}
            />
            <Text style={[st.hint, { color: colors.textSecondary }]}>{note.length}/500</Text>
          </View>

          {formError ? <Text style={[st.error, { color: colors.danger }]}>{formError}</Text> : null}

          <CmsButton
            colors={colors}
            label={
              adjustWallet.isPending
                ? 'Processing…'
                : direction === 'CREDIT'
                  ? `Credit ${amount ? inr(numericAmount) : ''}`
                  : `Debit ${amount ? inr(numericAmount) : ''}`
            }
            onPress={handleSubmit}
            loading={adjustWallet.isPending}
            disabled={isInvalidNumber || overflowsDebit}
            variant={direction === 'DEBIT' ? 'danger' : 'primary'}
            style={st.submitBtn}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

function BalanceCell({
  label,
  value,
  colors,
  accent,
  muted,
  bold,
}: {
  label: string;
  value: string;
  colors: CmsThemeColors;
  accent?: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[cmsType.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          bold ? { fontSize: 15, fontWeight: '800' as const } : { fontSize: 13.5, fontWeight: '700' as const },
          { color: accent ?? (muted ? colors.textSecondary : colors.textPrimary) },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  sub: { fontSize: 13, fontWeight: '600' },
  balanceRow: { flexDirection: 'row' },
  directionGroup: { flexDirection: 'row', gap: 8 },
  dirBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dirLabel: cmsType.buttonLabel,
  hint: { fontSize: 11.5, marginTop: 4 },
  error: { fontSize: 12.5, fontWeight: '600' },
  submitBtn: { marginTop: 4 },
});
