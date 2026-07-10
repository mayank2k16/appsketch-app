import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  value?: React.ReactNode;
  /** Lays out in the wrapping field-grid row (default) vs a full-width block. */
  wrap?: boolean;
};

/** Read-only label/value pair — the detail-view building block from
 * OrderDetailModal. Renders nothing if `value` is empty, so callers can list
 * fields unconditionally and let optional ones disappear on their own. */
export function CmsField({ colors, label, value, wrap = true }: Props) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={[st.item, wrap && st.wrapItem]}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[st.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  item: { gap: 2 },
  wrapItem: { minWidth: 140 },
  label: cmsType.fieldLabel,
  value: cmsType.fieldValue,
});
