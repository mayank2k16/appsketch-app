import { useIsFocused } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { TwinkleDots } from './TwinkleDots';

/**
 * White theme's hero dots: the dark theme's grid (same pitch and size), its
 * colour melting slowly through soft brand pastels. One TwinkleDots field per
 * colour, cross-faded by opacity on the UI thread — no re-render, no
 * per-frame JS.
 *
 * Every instance reads the same wall clock, so two fields (the one behind the
 * header and the one on the hero band) are always the same colour at the
 * same moment and never show a seam where they meet.
 */
export const DOT_COLORS = ['#FFB37F', '#F9A8D4', '#C4B5FD', '#93C5FD'] as const;

/** Each colour holds, then melts into the next. */
const STEP_MS = 3200;
const CYCLE_MS = STEP_MS * DOT_COLORS.length;
const EPOCH = Date.now();

function Layer({
  k,
  t,
  children,
}: {
  k: number;
  t: SharedValue<number>;
  children: React.ReactNode;
}) {
  const n = DOT_COLORS.length;
  const style = useAnimatedStyle(() => {
    let d = Math.abs(t.value - k);
    d = Math.min(d, n - d);
    // Full while the cycle sits on this colour, a ~60% cross-fade either side.
    return { opacity: Math.min(1, Math.max(0, 1.3 - d * 1.3)) };
  });
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]}>
      {children}
    </Reanimated.View>
  );
}

export function ShiftingDots({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const focused = useIsFocused();
  const t = useSharedValue(0);

  React.useEffect(() => {
    if (!focused) return;
    const n = DOT_COLORS.length;
    // Start where the shared clock is, then run linearly round the cycle.
    const at = (((Date.now() - EPOCH) % CYCLE_MS) / CYCLE_MS) * n;
    t.value = at;
    t.value = withTiming(
      n,
      {
        duration: ((n - at) / n) * CYCLE_MS,
        easing: Easing.linear,
      },
      (done) => {
        if (!done) return;
        t.value = 0;
        t.value = withRepeat(
          withTiming(n, { duration: CYCLE_MS, easing: Easing.linear }),
          -1,
          false
        );
      }
    );
    return () => cancelAnimation(t);
  }, [focused, t]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOT_COLORS.map((color, k) => (
        <Layer key={color} k={k} t={t}>
          <TwinkleDots
            width={width}
            height={height}
            color={color}
            spacing={31}
            radius={1.1}
            baseOpacity={0.55}
            peakOpacity={1}
          />
        </Layer>
      ))}
    </View>
  );
}
