import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import type { AiChartSpec } from '@/api/ai-assistant';

import type { CmsThemeColors } from '../../theme';

// Same palette Vite's `renderChart.jsx` uses, tuned to the CMS theme.
const COLORS = ['#4338ca', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

type Props = {
  colors: CmsThemeColors;
  spec: AiChartSpec | null | undefined;
};

/** Reimplementation of Vite's `renderChart.jsx` — that version renders an
 * agent-produced chart spec with `recharts` (web-only). Same spec shape and
 * key-inference fallback (x defaults to the first data key; measures default
 * to any numeric keys besides x), rendered with `react-native-gifted-charts`
 * instead — already a dependency, used by the Analytics tab's own charts
 * (`Analytics/components/RevenueAreaChart.tsx` etc). Unlike `recharts`,
 * gifted-charts doesn't compose arbitrary multi-series lines/bars from a
 * flat data array, so multi-measure specs chart only the first measure
 * (still shows the answer's primary series; the text answer stands on its
 * own regardless). */
export function AiChart({ colors, spec }: Props) {
  if (!spec || !Array.isArray(spec.data) || spec.data.length === 0) return null;

  const { type = 'bar', title, x, series = [], data } = spec;
  const keys = Object.keys(data[0] || {});
  const xKey = x && keys.includes(x) ? x : keys[0];
  const measures = (series.length ? series : keys.filter((k) => k !== xKey)).filter((k) =>
    data.some((row) => typeof row[k] === 'number')
  );
  if (!xKey || measures.length === 0) return null;
  const primaryMeasure = measures[0];

  const labelOf = (row: Record<string, unknown>) => {
    const v = row[xKey];
    return v === undefined || v === null ? '' : String(v);
  };
  const valueOf = (row: Record<string, unknown>) => Number(row[primaryMeasure]) || 0;

  let body: React.ReactNode = null;

  if (type === 'pie') {
    const pieData = data.map((row, i) => ({
      value: valueOf(row),
      color: COLORS[i % COLORS.length],
      text: labelOf(row),
    }));
    body = (
      <View style={st.pieWrap}>
        <PieChart data={pieData} donut radius={72} innerRadius={48} innerCircleColor={colors.surface} />
        <View style={st.legend}>
          {pieData.map((d, i) => (
            <View key={i} style={st.legendRow}>
              <View style={[st.legendDot, { backgroundColor: d.color }]} />
              <Text style={[st.legendText, { color: colors.textSecondary }]} numberOfLines={1}>
                {d.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  } else if (type === 'line' || type === 'area') {
    const lineData = data.map((row) => ({ value: valueOf(row), label: labelOf(row) }));
    body = (
      <LineChart
        data={lineData}
        areaChart={type === 'area'}
        curved
        color={COLORS[0]}
        thickness={2.5}
        startFillColor={COLORS[0]}
        startOpacity={0.25}
        endOpacity={0.02}
        hideDataPoints
        hideRules
        yAxisColor="transparent"
        xAxisColor={colors.border}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        height={180}
        adjustToWidth
      />
    );
  } else {
    const barData = data.map((row) => ({ value: valueOf(row), label: labelOf(row) }));
    body = (
      <BarChart
        data={barData}
        frontColor={COLORS[0]}
        barBorderRadius={4}
        hideRules
        yAxisColor="transparent"
        xAxisColor={colors.border}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        height={180}
      />
    );
  }

  return (
    <View style={[st.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {title ? <Text style={[st.title, { color: colors.textPrimary }]}>{title}</Text> : null}
      {body}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 8 },
  title: { fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  pieWrap: { alignItems: 'center', gap: 10 },
  legend: { width: '100%', gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11.5, flexShrink: 1 },
});
