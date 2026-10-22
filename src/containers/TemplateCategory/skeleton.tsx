import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  COL_W,
  GAP,
  PAD,
  RADIUS,
  SHORT,
  SPAN2,
  TALL,
  W,
} from '../Home/Studio/geometry';
import type { CatColors } from './theme';

/**
 * Loading: the bento's own shapes as quiet ghost tiles (a feature row, a
 * strip, three phones), with one soft light band flowing diagonally across
 * the whole grid on the UI thread. Neutral only — no colour pools.
 */

type Ghost = { w: number; h: number };
const ROWS: Ghost[][] = [
  [
    { w: SPAN2, h: TALL },
    { w: COL_W, h: TALL },
  ],
  [
    { w: COL_W, h: SHORT },
    { w: SPAN2, h: SHORT },
  ],
  [
    { w: COL_W, h: TALL },
    { w: COL_W, h: TALL },
    { w: COL_W, h: TALL },
  ],
];

const BAND = W * 0.9;
/** White at 0 alpha (plain 'transparent' is black at 0, which greys the band). */
const CLEAR = 'rgba(255,255,255,0)';

function Sheen({ t, light }: { t: SharedValue<number>; light: string }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -BAND + t.value * (W + BAND * 2) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[s.band, style]}>
      <LinearGradient
        colors={[CLEAR, light, CLEAR]}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 1, y: 0.65 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export const SkeletonGrid = React.memo(function SkeletonGrid({
  c,
}: {
  c: CatColors;
}) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [t]);
  const ghost = c.dark ? '#151517' : '#EFEFEC';
  const light = c.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)';
  return (
    <View style={s.root} accessibilityLabel="Loading templates">
      {ROWS.map((row, i) => (
        <View key={i} style={s.row}>
          {row.map((g, k) => (
            <View
              key={k}
              style={[
                s.ghost,
                { width: g.w, height: g.h, backgroundColor: ghost },
              ]}
            />
          ))}
        </View>
      ))}
      <Sheen t={t} light={light} />
    </View>
  );
});

const s = StyleSheet.create({
  root: { overflow: 'hidden', paddingHorizontal: PAD, gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  ghost: { borderRadius: RADIUS, borderCurve: 'continuous' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, width: BAND },
});
