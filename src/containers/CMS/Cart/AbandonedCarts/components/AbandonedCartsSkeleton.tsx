import * as React from 'react';
import { View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { CartCardSkeleton } from '../../components/CartCardSkeleton';

type Props = { colors: CmsThemeColors };

// Varying widths per row (Customer, Items, Value, Created, Last Updated —
// same 5 fields as `AbandonedCartCard`) so the loading state doesn't read as
// one repeated stamp.
const ROWS = [
  [116, 40, 66, 88, 92],
  [92, 32, 58, 80, 76],
  [132, 44, 70, 84, 96],
];

/** Mirrors `AbandonedCartCard`'s shape (title + 5-field grid + Discard
 * button) so the list doesn't jump/reflow once real carts arrive — swapped
 * in for the plain "Loading abandoned carts…" text. */
export function AbandonedCartsSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 12 }}>
      {ROWS.map((fieldWidths, i) => (
        <CartCardSkeleton key={i} colors={colors} fieldWidths={fieldWidths} footer="button" />
      ))}
    </View>
  );
}
