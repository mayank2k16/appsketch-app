import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { Skeleton } from './Skeleton';

type Props = { colors: CmsThemeColors };

function StatCardSkeleton({ colors }: Props) {
  return (
    <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.statHeader}>
        <Skeleton colors={colors} width={30} height={30} borderRadius={15} />
        <Skeleton colors={colors} width="55%" height={12} borderRadius={4} />
      </View>
      <Skeleton colors={colors} width="65%" height={21} borderRadius={5} style={{ marginTop: 2 }} />
      <View style={st.statFooter}>
        <Skeleton colors={colors} width={54} height={18} borderRadius={20} />
        <Skeleton colors={colors} width="80%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

function RevenueChartSkeleton({ colors }: Props) {
  return (
    <CmsCard colors={colors}>
      <View style={st.rowBetween}>
        <Skeleton colors={colors} width={140} height={14} borderRadius={4} />
        <View style={st.legend}>
          <Skeleton colors={colors} width={8} height={8} borderRadius={4} />
          <Skeleton colors={colors} width={70} height={11} borderRadius={4} />
        </View>
      </View>
      <Skeleton colors={colors} height={180} borderRadius={12} style={{ marginTop: 10 }} />
    </CmsCard>
  );
}

function DonutCardSkeleton({ colors }: Props) {
  return (
    <CmsCard colors={colors}>
      <Skeleton colors={colors} width={130} height={14} borderRadius={4} />
      <View style={st.donutWrap}>
        <Skeleton colors={colors} width={144} height={144} borderRadius={72} />
      </View>
      <View style={st.legendList}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={st.legendRow}>
            <Skeleton colors={colors} width={9} height={9} borderRadius={5} />
            <Skeleton colors={colors} width="45%" height={12} borderRadius={4} style={{ flex: 1 }} />
            <Skeleton colors={colors} width={40} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </CmsCard>
  );
}

function TopProductsSkeleton({ colors }: Props) {
  return (
    <CmsCard colors={colors}>
      <Skeleton colors={colors} width={160} height={14} borderRadius={4} />
      <View>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[st.productRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
          >
            <Skeleton colors={colors} height={12} borderRadius={4} style={{ flex: 1 }} />
            <Skeleton colors={colors} width={54} height={11} borderRadius={4} />
            <Skeleton colors={colors} width={64} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </CmsCard>
  );
}

function TopReferrersSkeleton({ colors }: Props) {
  return (
    <CmsCard colors={colors}>
      <Skeleton colors={colors} width={120} height={14} borderRadius={4} />
      <View style={st.referrerList}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={st.referrerRow}>
            <Skeleton colors={colors} width={32} height={32} borderRadius={16} />
            <View style={{ flex: 1 }}>
              <View style={[st.rowBetween, { marginBottom: 5 }]}>
                <Skeleton colors={colors} width="40%" height={12} borderRadius={4} />
                <Skeleton colors={colors} width={30} height={11} borderRadius={4} />
              </View>
              <Skeleton colors={colors} height={5} borderRadius={3} />
            </View>
          </View>
        ))}
      </View>
    </CmsCard>
  );
}

function TopViewedPagesSkeleton({ colors }: Props) {
  return (
    <CmsCard colors={colors}>
      <Skeleton colors={colors} width={150} height={14} borderRadius={4} />
      <Skeleton colors={colors} height={160} borderRadius={12} style={{ marginTop: 8 }} />
      <View style={st.pagesList}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[st.pageRow, { borderColor: colors.border }]}>
            <Skeleton colors={colors} width={22} height={22} borderRadius={11} />
            <Skeleton colors={colors} height={12} borderRadius={4} style={{ flex: 1 }} />
            <Skeleton colors={colors} width={44} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </CmsCard>
  );
}

/** Mirrors `AnalyticsScreen`'s card-by-card layout so nothing reflows once
 * real data arrives — swapped in for the stat row + chart cards while
 * `useSalesAnalytics` is loading. */
export function AnalyticsSkeleton({ colors }: Props) {
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.statRow}>
        <StatCardSkeleton colors={colors} />
        <StatCardSkeleton colors={colors} />
        <StatCardSkeleton colors={colors} />
      </ScrollView>

      <RevenueChartSkeleton colors={colors} />
      <DonutCardSkeleton colors={colors} />
      <DonutCardSkeleton colors={colors} />
      <TopProductsSkeleton colors={colors} />
      <TopReferrersSkeleton colors={colors} />
      <TopViewedPagesSkeleton colors={colors} />
    </>
  );
}

const st = StyleSheet.create({
  statRow: { gap: 10, paddingBottom: 2 },
  statCard: { width: 190, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statFooter: { gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  donutWrap: { alignItems: 'center', paddingVertical: 8 },
  legendList: { gap: 8, marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  referrerList: { gap: 12 },
  referrerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pagesList: { marginTop: 10, gap: 2 },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
