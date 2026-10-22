import * as React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { GAP, PAD } from '../Home/Studio/geometry';
import { RowCells } from '../Home/Studio/rows';
import type { DealRow } from './deal';

/**
 * One bento row: Home's own `RowCells` (the same tiles, anchored top-left),
 * wrapped in this screen's rise. A row rises in (UI-thread translate +
 * scale, no opacity) the first time its key shows; a category switch clears
 * that (`resetCategoryRise`), so the new deal rises with a short stagger.
 * The "seen" set is this screen's own, so Home's rows are untouched.
 */

const seen = new Set<string>();
export const resetCategoryRise = () => seen.clear();

const RISE_EASE = Easing.out(Easing.cubic);

function useRise(key: string, index: number) {
  const p = useSharedValue(1);
  React.useLayoutEffect(() => {
    if (seen.has(key)) {
      p.value = 1;
      return;
    }
    seen.add(key);
    p.value = 0;
    p.value = withDelay(
      index < 6 ? index * 70 : 0,
      withTiming(1, { duration: 460, easing: RISE_EASE })
    );
  }, [key, index, p]);
  return useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - p.value) * 28 },
      { scale: 0.965 + 0.035 * p.value },
    ],
  }));
}

export const CategoryRow = React.memo(function CategoryRow({
  row,
  index,
}: {
  row: DealRow;
  index: number;
}) {
  const rise = useRise(row.key, index);
  return (
    <Animated.View style={[s.row, { height: row.h }, rise]}>
      <RowCells row={row} onBlack={false} />
    </Animated.View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginHorizontal: PAD,
    marginBottom: GAP,
  },
});
