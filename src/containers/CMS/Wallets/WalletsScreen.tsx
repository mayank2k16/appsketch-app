import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { WalletActiveFilter, WalletListItem } from '@/api/wallets';
import { useWallets } from '@/api/wallets';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../theme';
import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { AdjustWalletModal } from './components/AdjustWalletModal';
import { WalletCard } from './components/WalletCard';
import { WalletDetailsModal } from './components/WalletDetailsModal';
import { WalletSearchBar } from './components/WalletSearchBar';
import { inr, WALLET_FILTER_OPTIONS } from './utils';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// `onMenuPress` is part of `CmsTab['Component']`'s contract but unused here —
// the shell's persistent header already owns the hamburger button.
export function WalletsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [activeFilter, setActiveFilter] = React.useState<WalletActiveFilter>('ALL');

  const walletsQuery = useWallets({ q: debouncedQuery, activeFilter });
  const wallets = React.useMemo(
    () => walletsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [walletsQuery.data]
  );

  const totals = React.useMemo(() => {
    const acc = { active: 0, inactive: 0, balance: 0, locked: 0 };
    for (const w of wallets) {
      if (w.is_active) acc.active += 1;
      else acc.inactive += 1;
      acc.balance += Number(w.balance || 0);
      acc.locked += Number(w.locked_balance || 0);
    }
    return acc;
  }, [wallets]);

  const [selectedWallet, setSelectedWallet] = React.useState<WalletListItem | null>(null);
  const adjustModal = useModal();
  const detailsModal = useModal();

  function openAdjust(wallet: WalletListItem) {
    setSelectedWallet(wallet);
    adjustModal.present();
  }
  function openDetails(wallet: WalletListItem) {
    setSelectedWallet(wallet);
    detailsModal.present();
  }
  function handleAdjustDone() {
    adjustModal.dismiss();
    setSelectedWallet(null);
  }

  const renderItem = React.useCallback(
    ({ item }: { item: WalletListItem }) => (
      <WalletCard
        wallet={item}
        colors={colors}
        onView={() => openDetails(item)}
        onAdjust={() => openAdjust(item)}
      />
    ),
    [colors]
  );

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.statScroll}
        contentContainerStyle={st.statScrollContent}
      >
        <StatCard icon="people-outline" label="Shown" value={String(wallets.length)} colors={colors} accent={colors.accent} />
        <StatCard icon="checkmark-circle-outline" label="Active" value={String(totals.active)} colors={colors} accent={colors.success} />
        <StatCard icon="close-circle-outline" label="Inactive" value={String(totals.inactive)} colors={colors} accent={colors.textSecondary} />
        <StatCard icon="cash-outline" label="Balances" value={inr(totals.balance)} colors={colors} accent={colors.info} />
        <StatCard icon="lock-closed-outline" label="Locked" value={inr(totals.locked)} colors={colors} accent={colors.warning} />
      </ScrollView>

      <View style={st.searchWrap}>
        <WalletSearchBar value={query} onChangeText={setQuery} colors={colors} />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.filterRow}
        contentContainerStyle={st.filterRowContent}
        data={WALLET_FILTER_OPTIONS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => {
          const active = item.value === activeFilter;
          return (
            <Pressable
              onPress={() => setActiveFilter(item.value)}
              style={[
                st.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text style={[st.chipLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {walletsQuery.isLoading ? (
        <View style={st.center}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[st.centerText, { color: colors.textSecondary }]}>Loading wallets…</Text>
        </View>
      ) : wallets.length === 0 ? (
        <View style={st.center}>
          <View style={[st.emptyIconRing, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="wallet-outline" size={26} color={colors.textSecondary} />
          </View>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No wallets found</Text>
          <Text style={[st.emptyHint, { color: colors.textSecondary }]}>
            Wallets are auto-provisioned on first user touch. Try removing filters or searching for an
            existing user.
          </Text>
        </View>
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (walletsQuery.hasNextPage && !walletsQuery.isFetchingNextPage) {
              walletsQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            walletsQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      <AdjustWalletModal ref={adjustModal.ref} colors={colors} wallet={selectedWallet} onDone={handleAdjustDone} />
      <WalletDetailsModal ref={detailsModal.ref} colors={colors} wallet={selectedWallet} />
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  colors,
  accent,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  colors: CmsThemeColors;
  accent: string;
}) {
  return (
    <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[st.statIconRing, { backgroundColor: `${accent}1A` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <Text style={[st.statValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  statScroll: { flexGrow: 0, marginTop: 12 },
  statScrollContent: { paddingHorizontal: 16, gap: 10 },
  statCard: {
    width: 108,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  statIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  searchWrap: { paddingTop: 14 },
  filterRow: { flexGrow: 0, marginBottom: 10, flexShrink: 0 },
  filterRowContent: { paddingHorizontal: 16, gap: 8, flexShrink: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: cmsType.listBadge,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 60, paddingHorizontal: 24 },
  centerText: { fontSize: 13, fontWeight: '500', marginTop: 6 },
  emptyIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyHint: { fontSize: 12.5, textAlign: 'center', marginTop: 2, lineHeight: 18, maxWidth: 280 },
});
