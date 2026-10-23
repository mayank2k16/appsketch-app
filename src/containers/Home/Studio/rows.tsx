import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { COL_W, GAP, PAD, SHORT, SPAN2, SPAN3 } from './geometry';
import type { Cell, FeedItem, Row } from './recipes';
import {
  LargeSiteTile,
  PhoneTile,
  SiteTile,
  SmallTile,
  WideTile,
} from './tiles';
import { ActionTile, TypeTile } from './word-tiles';

/**
 * One bento row: its columns side by side, stacked cells inside a column.
 * A row rises in (UI-thread translate + scale, no opacity — text never
 * fades) the first time its key is shown; a category switch resets that, so
 * the new deal rises in with a short stagger down the first screen.
 */

const seen = new Set<string>();
export const resetRise = () => seen.clear();

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

const spanW = (span: 1 | 2 | 3) =>
  span === 1 ? COL_W : span === 2 ? SPAN2 : SPAN3;

function CellView({
  cell,
  h,
  onBlack,
}: {
  cell: Cell;
  h: number;
  onBlack: boolean;
}) {
  switch (cell.kind) {
    case 'phone':
      return <PhoneTile template={cell.t} onBlack={onBlack} />;
    case 'large':
      return <LargeSiteTile template={cell.t} onBlack={onBlack} />;
    case 'site':
      return <SiteTile template={cell.t} height={h} />;
    case 'small':
      return <SmallTile template={cell.t} height={h} />;
    case 'wide':
      return <WideTile template={cell.t} onBlack={onBlack} />;
    case 'type':
      return (
        <TypeTile
          category={cell.category}
          count={cell.count}
          thumbs={cell.thumbs}
        />
      );
    case 'action':
      return <ActionTile />;
  }
}

/** A row's columns side by side (stacked cells split a tall row). */
export function RowCells({ row, onBlack }: { row: Row; onBlack: boolean }) {
  return (
    <>
      {row.cols.map((col, ci) => {
        const cellH = col.cells.length > 1 ? SHORT : row.h;
        return (
          <View key={ci} style={[s.col, { width: spanW(col.span) }]}>
            {col.cells.map((cell, k) => (
              <View key={k} style={{ height: cellH }}>
                <CellView cell={cell} h={cellH} onBlack={onBlack} />
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

export const RowView = React.memo(function RowView({
  item,
  index,
}: {
  item: FeedItem & { kind: 'row' };
  index: number;
}) {
  const rise = useRise(item.key, index);
  return (
    <Animated.View style={[s.row, { height: item.h }, rise]}>
      <RowCells row={item} onBlack={false} />
    </Animated.View>
  );
});

/** A showcase row: the same bento on black (no rise — the section is one
 *  staged block). */
export function ShowcaseRow({ row }: { row: Row }) {
  return (
    <View style={[s.row, s.flush, { height: row.h }]}>
      <RowCells row={row} onBlack />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginHorizontal: PAD,
    marginBottom: GAP,
  },
  flush: { marginBottom: 0 },
  col: { gap: GAP },
});
