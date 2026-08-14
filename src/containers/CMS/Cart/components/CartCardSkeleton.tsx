import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = {
  colors: CmsThemeColors;
  /** One entry per field the real card renders, sized to roughly that
   * field's value width — keeps the grid from reflowing once real cards
   * swap in. */
  fieldWidths: number[];
  hasBadge?: boolean;
  footer?: 'button' | 'link' | 'none';
};

/** Shared skeleton shell for both `AbandonedCartCard` and
 * `CheckoutOrderCard` — same card chrome (border/radius/padding) and
 * label-over-value field grid, parameterized by field count and footer kind
 * so each screen's skeleton mirrors its own card exactly. */
export function CartCardSkeleton({ colors, fieldWidths, hasBadge = false, footer = 'none' }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Skeleton colors={colors} width={46} height={18} borderRadius={4} />
        {hasBadge ? <Skeleton colors={colors} width={92} height={25} borderRadius={10} /> : null}
      </View>

      <View style={st.fieldGrid}>
        {fieldWidths.map((width, i) => (
          <View key={i} style={st.field}>
            <Skeleton colors={colors} width={44} height={15} borderRadius={3} />
            <Skeleton colors={colors} width={width} height={15} borderRadius={4} style={st.fieldValue} />
          </View>
        ))}
      </View>

      {footer === 'button' ? <Skeleton colors={colors} height={42} borderRadius={10} /> : null}
      {footer === 'link' ? <Skeleton colors={colors} width={112} height={13} borderRadius={4} /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { minWidth: 140, gap: 2 },
  fieldValue: { marginTop: 2 },
});
