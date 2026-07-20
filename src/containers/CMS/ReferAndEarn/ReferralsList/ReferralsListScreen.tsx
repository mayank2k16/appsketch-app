import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ReferralListItem, ReferralStatus } from '@/api/referrals';
import { useReferralsAnalytics, useReferralsList } from '@/api/referrals';

import { CmsCard, CmsStatusBadge } from '../../components';
import { useCmsTheme } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getReferralStatusMeta, inr } from '../utils';

const PLATFORM_LABEL: Record<string, string> = { ios: 'iOS', android: 'Android', web: 'Web', unknown: 'Unknown' };
const STATUS_FILTERS: (ReferralStatus | 'ALL')[] = ['ALL', 'PENDING', 'QUALIFIED', 'EXPIRED', 'REJECTED'];

export function ReferralsListScreen() {
  const { colors } = useCmsTheme();
  const [statusFilter, setStatusFilter] = React.useState<ReferralStatus | 'ALL'>('ALL');
  const [search, setSearch] = React.useState('');

  const analyticsQuery = useReferralsAnalytics();
  const listQuery = useReferralsList(statusFilter);
  const rows = React.useMemo(() => listQuery.data?.pages.flatMap((p) => p.data) ?? [], [listQuery.data]);

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.referrer_name || '').toLowerCase().includes(q) ||
        (r.referrer_phone || '').toLowerCase().includes(q) ||
        (r.referee_name || '').toLowerCase().includes(q) ||
        (r.referee_phone || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [rows, search]);

  const analytics = analyticsQuery.data;

  const renderItem = React.useCallback(
    ({ item }: { item: ReferralListItem }) => <ReferralRow colors={colors} item={item} />,
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) listQuery.fetchNextPage();
        }}
        ListHeaderComponent={
          <View>
            {analyticsQuery.isLoading ? (
              <Text style={[st.loadingText, { color: colors.textSecondary }]}>Loading analytics…</Text>
            ) : analytics ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.statScroll} contentContainerStyle={st.statScrollContent}>
                  <StatTile colors={colors} label="Total" value={String(analytics.totals.total)} accent="#1E40AF" />
                  <StatTile colors={colors} label="Qualified" value={String(analytics.totals.qualified)} accent="#16A34A" />
                  <StatTile colors={colors} label="Pending" value={String(analytics.totals.pending)} accent="#D97706" />
                  <StatTile colors={colors} label="Expired" value={String(analytics.totals.expired)} accent="#64748B" />
                  <StatTile colors={colors} label="Rejected" value={String(analytics.totals.rejected)} accent="#DC2626" />
                  <StatTile colors={colors} label="Conversion" value={`${analytics.totals.conversion_pct ?? 0}%`} accent="#7C3AED" />
                  <StatTile colors={colors} label="Referrer payout" value={inr(analytics.totals.referrer_payout)} accent="#0F766E" />
                  <StatTile colors={colors} label="Referee payout" value={inr(analytics.totals.referee_payout)} accent="#0F766E" />
                </ScrollView>

                {analytics.top_referrers && analytics.top_referrers.length > 0 ? (
                  <CmsCard colors={colors} title="Top Referrers" style={st.sectionCard}>
                    {analytics.top_referrers.map((r, idx) => (
                      <View key={r.referrer_id} style={[st.leaderRow, { borderColor: colors.border }]}>
                        <Text style={[st.rank, { color: colors.textSecondary }]}>#{idx + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[st.leaderName, { color: colors.textPrimary }]}>Referrer #{r.referrer_id}</Text>
                          <Text style={[st.leaderMeta, { color: colors.textSecondary }]}>
                            {r.qualified_count} qualified · earned {inr(r.earned)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </CmsCard>
                ) : null}

                {analytics.links ? (
                  <CmsCard colors={colors} title="Referral Link Performance" style={st.sectionCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      <StatTile colors={colors} label="Total clicks" value={String(analytics.links.total_clicks ?? 0)} accent="#1E40AF" />
                      {(analytics.links.by_platform ?? []).map((p) => (
                        <StatTile key={p.platform} colors={colors} label={PLATFORM_LABEL[p.platform] || p.platform} value={String(p.count)} accent="#0F766E" />
                      ))}
                    </ScrollView>
                    {(analytics.links.top_referrers_by_clicks ?? []).map((r, idx) => (
                      <View key={r.referrer_id} style={[st.leaderRow, { borderColor: colors.border }]}>
                        <Text style={[st.rank, { color: colors.textSecondary }]}>#{idx + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[st.leaderName, { color: colors.textPrimary }]}>Referrer #{r.referrer_id}</Text>
                          <Text style={[st.leaderMeta, { color: colors.textSecondary }]}>{r.clicks} clicks</Text>
                        </View>
                      </View>
                    ))}
                  </CmsCard>
                ) : null}
              </>
            ) : null}

            <View style={st.controls}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by referrer/referee name, phone or ID…"
                placeholderTextColor={colors.textSecondary}
                style={[st.searchInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                {STATUS_FILTERS.map((f) => {
                  const active = f === statusFilter;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setStatusFilter(f)}
                      style={[
                        st.chip,
                        { borderColor: colors.border },
                        active && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      <Text style={[st.chipLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                        {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {listQuery.isLoading ? <Text style={[st.loadingText, { color: colors.textSecondary }]}>Loading referrals…</Text> : null}
          </View>
        }
        ListEmptyComponent={
          !listQuery.isLoading ? (
            <Text style={[st.emptyText, { color: colors.textSecondary }]}>No referrals match the current filters.</Text>
          ) : null
        }
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

function StatTile({ colors, label, value, accent }: { colors: ReturnType<typeof useCmsTheme>['colors']; label: string; value: string; accent: string }) {
  return (
    <View style={[st.statTile, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: accent }]}>
      <Text style={[st.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[st.statValue, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ReferralRow({ colors, item }: { colors: ReturnType<typeof useCmsTheme>['colors']; item: ReferralListItem }) {
  return (
    <View style={[st.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[st.personName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.referrer_name || `User #${item.referrer_id}`} → {item.referee_name || `User #${item.referee_id}`}
          </Text>
          <Text style={[st.personMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.trigger_event ? item.trigger_event.replace(/_/g, ' ') : '—'}
          </Text>
        </View>
        <CmsStatusBadge meta={getReferralStatusMeta(item.status)} />
      </View>

      <View style={st.bonusRow}>
        <Text style={[st.bonusText, { color: colors.textSecondary }]}>Referrer: {inr(item.referrer_bonus_amount)}</Text>
        <Text style={[st.bonusText, { color: colors.textSecondary }]}>Referee: {inr(item.referee_bonus_amount)}</Text>
      </View>

      <Text style={[st.dateText, { color: colors.textSecondary }]}>
        {item.qualified_at
          ? `Qualified ${new Date(item.qualified_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
          : `Created ${new Date(item.created_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  loadingText: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 12 },
  statScroll: { flexGrow: 0, marginTop: 12 },
  statScrollContent: { paddingHorizontal: 16, gap: 10 },
  statTile: { width: 118, borderWidth: 1, borderLeftWidth: 3, borderRadius: 12, padding: 10, gap: 4 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 15, fontWeight: '800' },
  sectionCard: { marginHorizontal: 16, marginTop: 14 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  rank: { width: 28, fontSize: 12.5, fontWeight: '700' },
  leaderName: cmsType.listSubtitle,
  leaderMeta: { ...cmsType.listMeta, marginTop: 2 },
  controls: { paddingHorizontal: 16, paddingTop: 14 },
  searchInput: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipLabel: cmsType.listBadge,
  emptyText: { textAlign: 'center', paddingVertical: 24, paddingHorizontal: 32, fontSize: 13 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 12, gap: 6 },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  personName: cmsType.listTitle,
  personMeta: { ...cmsType.listMeta, marginTop: 2, textTransform: 'capitalize' },
  bonusRow: { flexDirection: 'row', gap: 16 },
  bonusText: { fontSize: 12.5, fontWeight: '600' },
  dateText: { fontSize: 11.5 },
});
