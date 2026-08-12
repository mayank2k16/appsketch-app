import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';
import { Skeleton } from '../../Analytics/components/Skeleton';

type Props = { colors: CmsThemeColors };

// Varying widths so the loading rows read as placeholder text rather than a
// single repeated stamp — same approach as Analytics's TopReferrersSkeleton.
const NAME_WIDTHS: `${number}%`[] = ['62%', '45%', '70%', '38%', '55%', '48%', '66%'];

function CategoryRowSkeleton({ colors, nameWidth }: Props & { nameWidth: `${number}%` }) {
  return (
    <View style={[st.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton colors={colors} width={32} height={32} borderRadius={5} />
      <Skeleton colors={colors} width={nameWidth} height={12} borderRadius={4} />
    </View>
  );
}

/** Mirrors `CategoryTreeRow`'s row shape (thumb + name line, same height and
 * margins) so the list doesn't jump/reflow once real categories arrive —
 * swapped in for the plain "Loading categories…" text while
 * `useCategoryTree` is loading. */
export function CategoriesSkeleton({ colors }: Props) {
  return (
    <View style={{ paddingTop: 4 }}>
      {NAME_WIDTHS.map((w, i) => (
        <CategoryRowSkeleton key={i} colors={colors} nameWidth={w} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 10,
    marginHorizontal: 14,
    // Matches CategoryTreeRow's root-row inset (`(depth + 0.7) * 18`).
    marginLeft: 0.7 * 18,
    marginBottom: 8,
  },
});
