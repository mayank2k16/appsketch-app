import * as React from 'react';
import { View } from 'react-native';

import type { CmsThemeColors } from '../../../theme';
import { CartCardSkeleton } from '../../components/CartCardSkeleton';

type Props = { colors: CmsThemeColors };

// Varying widths per row (Customer, Date, Total — same 3 fields as
// `CheckoutOrderCard`) so the loading state doesn't read as one repeated
// stamp. The real card's "View On Map" link only shows up sometimes
// (depends on whether the order has coordinates), so only some skeleton
// rows carry the link footer too.
const ROWS: { fieldWidths: number[]; footer: 'link' | 'none' }[] = [
  { fieldWidths: [120, 76, 68], footer: 'link' },
  { fieldWidths: [96, 70, 56], footer: 'none' },
  { fieldWidths: [104, 82, 64], footer: 'link' },
];

/** Mirrors `CheckoutOrderCard`'s shape (title + status badge + 3-field grid
 * + optional map link) so the list doesn't jump/reflow once real orders
 * arrive — swapped in for the plain "Loading checkout orders…" text. */
export function CheckoutOrdersSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 12 }}>
      {ROWS.map((row, i) => (
        <CartCardSkeleton key={i} colors={colors} fieldWidths={row.fieldWidths} hasBadge footer={row.footer} />
      ))}
    </View>
  );
}
