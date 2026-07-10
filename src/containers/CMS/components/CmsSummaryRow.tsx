import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  value: number;
  bold?: boolean;
  /** Override the rendered value, e.g. to prefix a currency symbol differently. */
  formatValue?: (value: number) => string;
};

function money(v: number) {
  return Number.isFinite(v) ? v.toFixed(2) : '0.00';
}

/** Label/value money row used for order-total-style breakdowns. */
export function CmsSummaryRow({ colors, label, value, bold, formatValue }: Props) {
  const color = bold ? colors.textPrimary : colors.textSecondary;
  const labelStyle = bold ? cmsType.summaryLabelBold : cmsType.summaryLabel;
  const valueStyle = bold ? cmsType.summaryValueBold : cmsType.summaryValue;
  return (
    <View style={st.row}>
      <Text style={[labelStyle, { color }]}>{label}</Text>
      <Text style={[valueStyle, { color }]}>{formatValue ? formatValue(value) : `Rs. ${money(value)}`}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
});
