import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WalletListItem } from '@/api/wallets';

import { CmsStatusBadge as StatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { inr } from '../utils';

type Props = {
  wallet: WalletListItem;
  colors: CmsThemeColors;
  onView: () => void;
  onAdjust: () => void;
};

export const WalletCard = React.memo(function WalletCard({ wallet, colors, onView, onAdjust }: Props) {
  const initial = (wallet.user_name || wallet.user_phone || wallet.user_email || '?').charAt(0).toUpperCase();
  const locked = Number(wallet.locked_balance) > 0;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <View style={[st.avatar, { backgroundColor: colors.sidebarActiveBg }]}>
          <Text style={[st.avatarText, { color: colors.sidebarText }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {wallet.user_name || '—'}
          </Text>
          <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            ID #{wallet.user} · Wallet #{wallet.id}
          </Text>
        </View>
        <View style={st.badgeCol}>
          <StatusBadge
            meta={
              wallet.is_active
                ? { label: 'Active', color: colors.success, kind: 'success' }
                : { label: 'Inactive', color: colors.textSecondary, kind: 'info' }
            }
          />
          {wallet.is_kyc_required ? (
            <StatusBadge meta={{ label: 'KYC', color: colors.warning, kind: 'warning' }} />
          ) : null}
        </View>
      </View>

      {(wallet.user_phone || wallet.user_email) && (
        <Text style={[st.contact, { color: colors.textSecondary }]} numberOfLines={1}>
          {wallet.user_phone || '—'}
          {wallet.user_email ? ` · ${wallet.user_email}` : ''}
        </Text>
      )}

      <View style={[st.balanceRow, { borderColor: colors.border }]}>
        <BalanceCell label="Balance" value={inr(wallet.balance)} colors={colors} />
        <BalanceCell
          label="Locked"
          value={locked ? inr(wallet.locked_balance) : '—'}
          colors={colors}
          muted={!locked}
          accent={locked ? colors.warning : undefined}
        />
        <BalanceCell label="Spendable" value={inr(wallet.spendable_balance)} colors={colors} accent={colors.accent} bold />
      </View>

      <View style={st.actions}>
        <Pressable
          onPress={onView}
          style={[st.actionBtn, { borderColor: colors.border }]}
          hitSlop={6}
        >
          <Text style={[st.actionLabel, { color: colors.textPrimary }]}>View</Text>
        </Pressable>
        <Pressable
          onPress={onAdjust}
          style={[st.actionBtn, st.actionBtnPrimary, { backgroundColor: colors.accent }]}
          hitSlop={6}
        >
          <Text style={[st.actionLabel, { color: colors.accentText }]}>Adjust</Text>
        </Pressable>
      </View>
    </View>
  );
});

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
    <View style={st.balanceCell}>
      <Text style={[st.balanceLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          st.balanceValue,
          bold && st.balanceValueBold,
          { color: accent ?? (muted ? colors.textSecondary : colors.textPrimary) },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
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
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  name: cmsType.listTitle,
  meta: cmsType.listMeta,
  badgeCol: { gap: 4, alignItems: 'flex-end' },
  contact: { fontSize: 12.5, fontWeight: '500' },
  balanceRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  balanceCell: { flex: 1, gap: 2 },
  balanceLabel: cmsType.fieldLabel,
  balanceValue: { fontSize: 13.5, fontWeight: '700' },
  balanceValueBold: { fontSize: 14.5, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBtnPrimary: { borderWidth: 0 },
  actionLabel: cmsType.buttonLabel,
});
