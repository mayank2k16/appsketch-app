import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { CmsCard } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { PIE_PALETTE } from '../utils';

export type DonutDatum = { name: string; value: number };

type Props = {
  colors: CmsThemeColors;
  title: string;
  data: DonutDatum[];
  emptyLabel: string;
  /** Traffic Sources shows a "total views" figure in the donut hole; Top
   * Categories doesn't — matches the Vite reference's two variants of the
   * same chart shape. */
  showCenterTotal?: boolean;
  centerUnitLabel?: string;
};

export function DonutChartCard({ colors, title, data, emptyLabel, showCenterTotal, centerUnitLabel }: Props) {
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const pieData = React.useMemo(
    () => data.map((d, i) => ({ value: d.value, color: PIE_PALETTE[i % PIE_PALETTE.length] })),
    [data]
  );

  return (
    <CmsCard colors={colors} title={title}>
      {data.length === 0 ? (
        <View style={st.empty}>
          <Text style={{ color: colors.textSecondary }}>{emptyLabel}</Text>
        </View>
      ) : (
        <>
          <View style={st.chartWrap}>
            <PieChart
              data={pieData}
              donut
              radius={72}
              innerRadius={52}
              innerCircleColor={colors.surface}
              centerLabelComponent={
                showCenterTotal
                  ? () => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[st.centerValue, { color: colors.textPrimary }]}>
                          {total.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[st.centerLabel, { color: colors.textSecondary }]}>
                          {centerUnitLabel ?? 'Total'}
                        </Text>
                      </View>
                    )
                  : undefined
              }
            />
          </View>

          <View style={st.legend}>
            {data.map((item, i) => (
              <View key={item.name} style={st.legendRow}>
                <View style={st.legendLeft}>
                  <View style={[st.dot, { backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }]} />
                  <Text style={[st.legendName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[st.legendValue, { color: colors.textSecondary }]}>
                  {item.value.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </CmsCard>
  );
}

const st = StyleSheet.create({
  chartWrap: { alignItems: 'center', paddingVertical: 8 },
  centerValue: { fontSize: 17, fontWeight: '800' },
  centerLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  legend: { gap: 8, marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendName: { fontSize: 12.5, fontWeight: '600', flexShrink: 1 },
  legendValue: { fontSize: 12.5, fontWeight: '700' },
  empty: { paddingVertical: 30, alignItems: 'center' },
});
