import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import type { VisitorPath } from '@/api/analytics';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { toNumber } from '../utils';

type Props = { colors: CmsThemeColors; pathData: VisitorPath[] | undefined };

export function TopViewedPagesChart({ colors, pathData }: Props) {
  const ranked = React.useMemo(() => {
    return (pathData ?? [])
      .map((p) => ({ path: p.path || '/', views: toNumber(p.page_views) }))
      .filter((p) => p.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [pathData]);

  const barData = React.useMemo(
    () => ranked.map((p, i) => ({ value: p.views, label: String(i + 1) })),
    [ranked]
  );

  return (
    <CmsCard colors={colors} title="Top Viewed Pages">
      {ranked.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ color: colors.textSecondary }}>No page view data yet.</Text>
        </View>
      ) : (
        <>
          <View style={st.chartWrap}>
            <BarChart
              data={barData}
              frontColor={colors.accent}
              barBorderRadius={6}
              barWidth={22}
              spacing={18}
              hideRules
              isAnimated
              yAxisColor="transparent"
              xAxisColor={colors.border}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              noOfSections={4}
              height={160}
            />
          </View>

          <View style={st.list}>
            {ranked.map((p, i) => (
              <View key={`${p.path}-${i}`} style={[st.row, { borderColor: colors.border }]}>
                <View style={[st.rankBadge, { backgroundColor: `${colors.accent}1A` }]}>
                  <Text style={[st.rankText, { color: colors.accent }]}>{i + 1}</Text>
                </View>
                <Text style={[st.path, { color: colors.textPrimary }]} numberOfLines={1}>
                  {p.path}
                </Text>
                <Text style={[st.views, { color: colors.textSecondary }]}>{p.views.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  chartWrap: { paddingTop: 8, paddingBottom: 4 },
  list: { marginTop: 10, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontWeight: '800' },
  path: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  views: { fontSize: 12.5, fontWeight: '700' },
  empty: { paddingVertical: 30, alignItems: 'center' },
});
