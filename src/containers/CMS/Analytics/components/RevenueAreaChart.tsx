import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { OrdersDataPoint } from '@/api/analytics';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { formatShortDate, inrCompact, toNumber } from '../utils';

type Props = { colors: CmsThemeColors; salesData: OrdersDataPoint[] | undefined };

export function RevenueAreaChart({ colors, salesData }: Props) {
  const points = salesData ?? [];

  const chartData = React.useMemo(
    () =>
      points.map((p) => ({
        value: toNumber(p.total_sales),
        label: formatShortDate(p.date),
        dataPointText: '',
      })),
    [points]
  );

  return (
    <CmsCard colors={colors}>
      <View style={st.header}>
        <Text style={[st.title, { color: colors.textPrimary }]}>Revenue Over Time</Text>
        <View style={st.legend}>
          <View style={[st.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[st.legendText, { color: colors.textSecondary }]}>Total Revenue</Text>
        </View>
      </View>

      {chartData.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ color: colors.textSecondary }}>No revenue data for this period.</Text>
        </View>
      ) : (
        <View style={st.chartWrap}>
          <LineChart
            data={chartData}
            areaChart
            curved
            color={colors.accent}
            thickness={2.5}
            startFillColor={colors.accent}
            startOpacity={0.28}
            endFillColor={colors.accent}
            endOpacity={0.02}
            hideDataPoints
            hideRules
            yAxisColor="transparent"
            xAxisColor={colors.border}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            formatYLabel={(label) => inrCompact(Number(label))}
            noOfSections={4}
            initialSpacing={12}
            endSpacing={12}
            spacing={Math.max(240 / Math.max(chartData.length - 1, 1), 32)}
            height={180}
            adjustToWidth
          />
        </View>
      )}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11.5, fontWeight: '500' },
  chartWrap: { marginTop: 10, paddingLeft: 4 },
  empty: { paddingVertical: 40, alignItems: 'center' },
});
