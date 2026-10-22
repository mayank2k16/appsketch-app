import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * What the hero shows until the live site has rendered (and what the tile
 * grows into): a flowing gradient. One oversized diagonal gradient, tinted
 * per template, drifts slowly across the panel while a second one in the
 * reverse order breathes in and out over it, so the colours keep shifting;
 * a soft light sheen sweeps across now and then. No shapes, no skeleton,
 * never a screenshot. `animate` only for the centred page; neighbours and
 * the flying copy show it still.
 */

const PALETTES: readonly (readonly [string, string, string])[] = [
  ['#FF8A4C', '#F472B6', '#A78BFA'],
  ['#38BDF8', '#818CF8', '#34D399'],
  ['#FBBF24', '#FB7185', '#F97316'],
  ['#2DD4BF', '#60A5FA', '#C084FC'],
  ['#A3E635', '#22D3EE', '#FACC15'],
  ['#F472B6', '#FB923C', '#E879F9'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const paletteOf = (seed: string) =>
  PALETTES[hash(seed) % PALETTES.length];

/** The gradient layers are this many panels wide/tall, so they can drift. */
const OVER = 3;

/** 0 → 1 on a loop (ping-pong when `reverse`), only while animating. */
function useLoop(animate: boolean, ms: number, reverse: boolean) {
  const p = useSharedValue(0);
  React.useEffect(() => {
    if (!animate) {
      cancelAnimation(p);
      return;
    }
    p.value = withRepeat(
      withTiming(1, {
        duration: ms,
        easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
      }),
      -1,
      reverse
    );
    return () => cancelAnimation(p);
  }, [animate, ms, reverse, p]);
  return p;
}

type Size = { w: number; h: number };

function Flow({
  colors,
  p,
  breathe,
  size,
}: {
  colors: readonly [string, string, string];
  p: SharedValue<number>;
  breathe?: SharedValue<number>;
  size: Size;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: breathe ? 0.15 + 0.7 * breathe.value : 1,
    transform: [
      { translateX: -(OVER - 1) * size.w * p.value },
      { translateY: -(OVER - 1) * size.h * (1 - p.value) },
    ],
  }));
  const [a, b, c] = colors;
  return (
    <Animated.View
      style={[s.flow, { width: size.w * OVER, height: size.h * OVER }, style]}
    >
      <LinearGradient
        colors={[a, b, c, a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function Sheen({ p, size }: { p: SharedValue<number>; size: Size }) {
  const band = size.w * 0.45;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -band + (size.w + band * 2) * p.value },
      { rotate: '18deg' },
    ],
  }));
  return (
    <Animated.View
      style={[s.sheen, { width: band, height: size.h * 1.5 }, style]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.32)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

type Props = { seed: string; dark: boolean; animate: boolean };

export const LiveLoader = React.memo(function LiveLoader(p: Props) {
  const colors = paletteOf(p.seed);
  const drift = useLoop(p.animate, 7000, true);
  const breathe = useLoop(p.animate, 3200, true);
  const sweep = useLoop(p.animate, 2600, false);
  const reversed = [colors[2], colors[0], colors[1]] as const;
  const [size, setSize] = React.useState<Size | null>(null);
  return (
    <View
      style={[s.root, { backgroundColor: colors[1] }]}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (!size || size.w !== w || size.h !== h) setSize({ w, h });
      }}
    >
      {size ? (
        <>
          <Flow colors={colors} p={drift} size={size} />
          <Flow colors={reversed} p={drift} breathe={breathe} size={size} />
          {p.dark ? <View style={[StyleSheet.absoluteFill, s.dim]} /> : null}
          {p.animate ? <Sheen p={sweep} size={size} /> : null}
        </>
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  flow: { position: 'absolute', top: 0, left: 0 },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheen: { position: 'absolute', top: '-25%', left: 0 },
});
