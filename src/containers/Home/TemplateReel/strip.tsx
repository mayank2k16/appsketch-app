import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  type FrameInfo,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';

import { Card, cardColors } from './card';
import {
  type CardSpec,
  type Column,
  GAP,
  GRID_H,
  SMALL_W,
  spanH,
  SPEED,
  stripWidth,
  W,
} from './layout';

const COPIES = [0, 1] as const;

type StripProps = {
  columns: Column[];
  dark: boolean;
  running: boolean;
  onOpen: (template: MarketTemplate) => void;
  onDrag: () => void;
};

/** The strip's motion, all on the UI thread: ONE translateX for the whole
 *  grid, advanced per frame, dragged by a pan, wrapped every copy width. */
function useStripMotion(setW: number, running: boolean, onDrag: () => void) {
  const offset = useSharedValue(-setW / 3);
  const touching = useSharedValue(false);
  const step = React.useMemo(
    () => (delta: number) => {
      'worklet';
      if (setW <= 0) return;
      let o = (offset.get() + delta) % setW;
      if (o > 0) o -= setW;
      offset.set(o);
    },
    [setW, offset]
  );
  const frame = useFrameCallback((f: FrameInfo) => {
    if (touching.get()) return;
    const dt = Math.min(f.timeSincePreviousFrame ?? 16, 64) / 1000;
    step(-SPEED * dt);
  }, false);
  // Stopped outright while Home is unfocused or the app is backgrounded.
  React.useEffect(() => {
    frame.setActive(running && setW > 0);
  }, [frame, running, setW]);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-12, 12])
        .onBegin(() => touching.set(true))
        .onStart(() => runOnJS(onDrag)())
        .onChange((e) => step(e.changeX))
        .onFinalize(() => touching.set(false)),
    [step, touching, onDrag]
  );
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));
  return { pan, style, touching };
}

type ColumnProps = {
  column: Column;
  dark: boolean;
  touching: SharedValue<boolean>;
  onOpen: (template: MarketTemplate) => void;
};

const ColumnView = React.memo(function ColumnView({
  column,
  dark,
  touching,
  onOpen,
}: ColumnProps) {
  const card = (spec: CardSpec) => (
    <Card
      key={spec.key}
      spec={spec}
      dark={dark}
      touching={touching}
      onOpen={onOpen}
    />
  );
  return (
    <View style={[s.column, { width: column.w }]}>
      {column.items.map((item) =>
        Array.isArray(item) ? (
          <View key={item[0].key} style={s.pair}>
            {item.map(card)}
          </View>
        ) : (
          card(item)
        )
      )}
    </View>
  );
});

export const Strip = React.memo(function Strip({
  columns,
  dark,
  running,
  onOpen,
  onDrag,
}: StripProps) {
  const setW = React.useMemo(() => stripWidth(columns), [columns]);
  const { pan, style, touching } = useStripMotion(setW, running, onDrag);
  return (
    <GestureDetector gesture={pan}>
      <View style={s.clip}>
        <Reanimated.View style={[s.strip, style]}>
          {COPIES.map((copy) =>
            columns.map((column) => (
              <ColumnView
                key={`${copy}-${column.key}`}
                column={column}
                dark={dark}
                touching={touching}
                onOpen={onOpen}
              />
            ))
          )}
        </Reanimated.View>
      </View>
    </GestureDetector>
  );
});

/** Card-shaped blocks at the final grid size, painted immediately. */
export const StripSkeleton = React.memo(function StripSkeleton({
  dark,
}: {
  dark: boolean;
}) {
  const c = cardColors(dark);
  const block = [s.skeleton, { backgroundColor: c.card, borderColor: c.edge }];
  return (
    <View style={[s.clip, s.strip]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.column, { width: SMALL_W }]}>
          {i === 1 ? (
            <View style={[block, { height: spanH(3) }]} />
          ) : (
            [0, 1, 2].map((j) => (
              <View key={j} style={[block, { height: spanH(1) }]} />
            ))
          )}
        </View>
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  clip: { width: W, height: GRID_H, overflow: 'hidden' },
  strip: { flexDirection: 'row', paddingLeft: GAP },
  column: { marginRight: GAP, gap: GAP },
  pair: { flexDirection: 'row', gap: GAP },
  skeleton: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
});
