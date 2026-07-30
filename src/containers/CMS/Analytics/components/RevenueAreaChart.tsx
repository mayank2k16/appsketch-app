import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { OrdersDataPoint } from '@/api/analytics';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { formatShortDate, inrCompact, toNumber } from '../utils';

type Props = { colors: CmsThemeColors; salesData: OrdersDataPoint[] | undefined };

// Narrowest a "27 Apr"-style label can get before it wraps at fontSize 10 —
// below this, prefer letting the chart scroll over shrinking further.
const MIN_LABEL_SPACING = 42;
const INITIAL_SPACING = 12;
const END_SPACING = 12;

export function RevenueAreaChart({ colors, salesData }: Props) {
  const points = salesData ?? [];
  const [chartWidth, setChartWidth] = React.useState(0);

  const chartData = React.useMemo(
    () =>
      points.map((p) => ({
        value: toNumber(p.total_sales),
        label: formatShortDate(p.date),
        dataPointText: '',
      })),
    [points]
  );

  // Only stretch points to fill the container (`adjustToWidth`) when doing so
  // still leaves each date label enough room to render on one line; otherwise
  // fall back to a fixed readable spacing and let the chart scroll within its
  // own container instead of wrapping/clipping labels.
  const fitSpacing =
    chartWidth > 0 && chartData.length > 1
      ? (chartWidth - INITIAL_SPACING - END_SPACING) / (chartData.length - 1)
      : Infinity;
  const canFitReadableLabels = fitSpacing >= MIN_LABEL_SPACING;

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
        <View
          style={st.chartWrap}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {chartWidth > 0 && (
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
              initialSpacing={INITIAL_SPACING}
              endSpacing={END_SPACING}
              height={180}
              parentWidth={chartWidth}
              {...(canFitReadableLabels
                ? { adjustToWidth: true }
                : { spacing: MIN_LABEL_SPACING, width: chartWidth })}
            />
          )}
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
  chartWrap: { marginTop: 10, paddingLeft: 4, overflow: 'hidden' },
  empty: { paddingVertical: 40, alignItems: 'center' },
});
