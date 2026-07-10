import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SalesRangeValue } from '@/api/analytics';
import { useSalesAnalytics } from '@/api/analytics';

import { CmsSelect } from '../components';
import { useCmsTheme } from '../theme';
import { DonutChartCard } from './components/DonutChartCard';
import { RevenueAreaChart } from './components/RevenueAreaChart';
import { StatCard } from './components/StatCard';
import { TopProductsCard } from './components/TopProductsCard';
import { TopReferrersCard } from './components/TopReferrersCard';
import { TopViewedPagesChart } from './components/TopViewedPagesChart';
import { getRangeMetaText, inr, SALES_RANGE_OPTIONS, toNumber } from './utils';

// `onMenuPress` is part of `CmsTab['Component']`'s contract but unused here —
// the shell's persistent header already owns the hamburger button.
export function AnalyticsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [range, setRange] = React.useState<SalesRangeValue>('99999');

  const analyticsQuery = useSalesAnalytics(range);
  const summary = analyticsQuery.data?.summary;

  const salesChange = React.useMemo(() => {
    const current = toNumber(summary?.total_sales);
    const allTime = toNumber(summary?.all_time_sales);
    const percentage = allTime === 0 ? (current === 0 ? 0 : 100) : (current / allTime) * 100;
    return { current, percentage };
  }, [summary]);

  const metaText = getRangeMetaText(range);

  const categoriesData = React.useMemo(
    () =>
      (summary?.top_selling_categories ?? []).map((c) => ({
        name: c.category_name,
        value: toNumber(c.total_quantity_sold),
      })),
    [summary]
  );

  const trafficData = React.useMemo(
    () =>
      (summary?.visitor_stats?.sources ?? [])
        .map((s) => ({ name: s.source || 'Direct', value: toNumber(s.page_views) }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value),
    [summary]
  );

  if (analyticsQuery.isLoading) {
    return (
      <View style={st.center}>
        <Text style={{ color: colors.textSecondary }}>Loading analytics…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[st.root, { backgroundColor: colors.background }]}
      contentContainerStyle={st.scroll}
    >
      <CmsSelect
        colors={colors}
        label="Date Range"
        value={range}
        options={SALES_RANGE_OPTIONS}
        onSelect={(v) => setRange(v as SalesRangeValue)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.statScroll}>
        <StatCard
          colors={colors}
          icon="bag-handle-outline"
          title="Total Income"
          rawValue={salesChange.current}
          formatValue={(v) => inr(v)}
          percentage={Number(salesChange.percentage.toFixed(1))}
          isPositive
          meta={metaText}
        />
        <StatCard
          colors={colors}
          icon="people-outline"
          title="Total Views"
          rawValue={toNumber(summary?.visitor_stats?.total_unique_visitors)}
          formatValue={(v) => Math.round(v).toLocaleString('en-IN')}
          percentage={12.5}
          isPositive
          meta={metaText}
        />
        <StatCard
          colors={colors}
          icon="refresh-outline"
          title="Refund Rate"
          rawValue={0}
          formatValue={(v) => v.toFixed(1)}
          percentage={0}
          isPositive={false}
          meta={metaText}
        />
      </ScrollView>

      <RevenueAreaChart colors={colors} salesData={analyticsQuery.data?.orders_data} />

      <DonutChartCard
        colors={colors}
        title="Traffic Sources"
        data={trafficData}
        emptyLabel="No traffic data available."
        showCenterTotal
        centerUnitLabel="Views"
      />

      <DonutChartCard
        colors={colors}
        title="Top Categories"
        data={categoriesData}
        emptyLabel="No category sales in this period."
      />

      <TopProductsCard colors={colors} productsData={summary?.top_selling_products} />

      <TopReferrersCard colors={colors} referrerData={summary?.visitor_stats?.referrers} />

      <TopViewedPagesChart colors={colors} pathData={summary?.visitor_stats?.paths} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  statScroll: { gap: 10, paddingBottom: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
