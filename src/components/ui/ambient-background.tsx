import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
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
 * The Home hero's background in white (docs/white-theme.md), after the
 * appsketch.ai landing pages. It lives inside the scroll content behind the
 * hero, so it scrolls away with it and the rest of the page keeps its own
 * colours. Above `startY` it is clean canvas; from there soft pastel light
 * pools — mint, butter, lilac, sky — each drifting slowly while its colour
 * melts through three pastels; over its last stretch it melts back into the
 * canvas. Both edges are long gradients, so no line ever shows.
 *
 * Cheap by construction: every pool is one small white radial-gradient image
 * (assets/home/glow.png, the same stops the SVG used: 1 → 0.55 at 45% → 0)
 * scaled up and tinted on the GPU — twelve full-size SVG layers were ~100 MB
 * of backing store. Only transforms and opacities animate, on the UI thread,
 * and only while `live` (Home focused, hero on screen).
 *
 * Renders nothing in dark.
 */
const CANVAS = '#FAFAF8';
const CANVAS_CLEAR = 'rgba(250,250,248,0)';
const { width: W } = Dimensions.get('window');
/** How far the colour takes to rise in, and to melt away at the bottom. */
const FADE_IN = 150;
const FADE_OUT = 170;
const SIZE = Math.round(W * 1.25);

type Pool = {
  /** centre: x as a share of the width, y as a share of the colour band */
  x: number;
  y: number;
  /** the colours this pool cycles through, in order */
  colors: readonly [string, string, string];
  /** drift distance (px) and period (ms) */
  dx: number;
  dy: number;
  ms: number;
};

const POOLS: readonly Pool[] = [
  {
    x: 0.05,
    y: 0.15,
    colors: ['#C6EDD3', '#C9DEFF', '#FFE7A8'], // mint → sky → butter
    dx: 34,
    dy: 26,
    ms: 17000,
  },
  {
    x: 0.95,
    y: 0.3,
    colors: ['#FFE7A8', '#FFD0BA', '#DCCFFF'], // butter → peach → lilac
    dx: -30,
    dy: 34,
    ms: 21000,
  },
  {
    x: 0.9,
    y: 0.72,
    colors: ['#DCCFFF', '#C6EDD3', '#FFD0BA'], // lilac → mint → peach
    dx: -38,
    dy: -24,
    ms: 19000,
  },
  {
    x: 0.08,
    y: 0.85,
    colors: ['#C9DEFF', '#EDD2FF', '#C6EDD3'], // sky → orchid → mint
    dx: 30,
    dy: -30,
    ms: 23000,
  },
];

/** Each colour holds briefly, then melts into the next over ~6s. */
const STEP_MS = 7000;
const STEPS = 3;

const GLOW = require('../../../assets/home/glow.png');

const Glow = React.memo(function Glow({ color }: { color: string }) {
  return (
    <Image
      source={GLOW}
      resizeMode="stretch"
      style={[styles.glow, { tintColor: color }]}
    />
  );
});

/** One colour of a pool; its opacity peaks when the cycle reaches it. */
function Shade({
  color,
  k,
  index,
  t,
}: {
  color: string;
  k: number;
  index: number;
  t: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    // t runs 0→STEPS and wraps; pools are offset so they never change in step.
    const p = (t.value + index * 0.75) % STEPS;
    let d = Math.abs(p - k);
    d = Math.min(d, STEPS - d);
    return { opacity: Math.min(1, Math.max(0, 1.25 - d * 1.25)) };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Glow color={color} />
    </Animated.View>
  );
}

function PoolView({
  pool,
  index,
  t,
  bandTop,
  bandH,
  live,
}: {
  pool: Pool;
  index: number;
  t: SharedValue<number>;
  bandTop: number;
  bandH: number;
  live: boolean;
}) {
  const drift = useSharedValue(0);
  React.useEffect(() => {
    if (!live) {
      cancelAnimation(drift);
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: pool.ms, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(drift);
  }, [drift, pool.ms, live]);

  const move = useAnimatedStyle(() => ({
    transform: [
      { translateX: pool.dx * drift.value },
      { translateY: pool.dy * drift.value },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.pool,
        {
          left: pool.x * W - SIZE / 2,
          top: bandTop + pool.y * bandH - SIZE / 2,
        },
        move,
      ]}
    >
      {pool.colors.map((color, k) => (
        <Shade key={k} color={color} k={k} index={index} t={t} />
      ))}
    </Animated.View>
  );
}

/** The pools' colour clock: 0 → STEPS, wrapping; frozen while not live. */
function useColourCycle(live: boolean) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    if (!live) {
      cancelAnimation(t);
      return;
    }
    // Resume from wherever the cycle froze.
    const left = STEPS - (t.value % STEPS);
    t.value = t.value % STEPS;
    t.value = withTiming(
      STEPS,
      { duration: STEP_MS * left, easing: Easing.linear },
      (done) => {
        if (!done) return;
        t.value = 0;
        t.value = withRepeat(
          withTiming(STEPS, {
            duration: STEP_MS * STEPS,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      }
    );
    return () => cancelAnimation(t);
  }, [t, live]);
  return t;
}

export const AmbientBackground = React.memo(function AmbientBackground({
  height,
  startY,
  children,
  live = true,
}: {
  /** Drawn over the colour (e.g. a dot field), melting out with it. */
  children?: React.ReactNode;
  /** Total height to cover, from the top of the scroll content. */
  height: number;
  /** Where the colour begins rising in (e.g. the prompt card's middle). */
  startY: number;
  /** False while off screen / not focused: the drift and colours freeze. */
  live?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const t = useColourCycle(live);

  if (colorScheme === 'dark' || height <= 0) return null;
  const bandTop = startY;
  const bandH = Math.max(1, height - startY);
  return (
    <View pointerEvents="none" style={[styles.root, { height }]}>
      {POOLS.map((pool, i) => (
        <PoolView
          key={i}
          pool={pool}
          index={i}
          t={t}
          bandTop={bandTop}
          bandH={bandH}
          live={live}
        />
      ))}
      {/* Clean canvas above startY, the colour rising in below it. */}
      <View style={[styles.cover, { height: Math.max(0, startY - 40) }]} />
      <LinearGradient
        colors={[CANVAS, CANVAS_CLEAR]}
        style={[
          styles.edge,
          { top: Math.max(0, startY - 40), height: FADE_IN },
        ]}
      />
      {children}
      {/* …and melting back into the canvas at the bottom. */}
      <LinearGradient
        colors={[CANVAS_CLEAR, CANVAS]}
        style={[styles.edge, { top: height - FADE_OUT, height: FADE_OUT }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W,
    backgroundColor: CANVAS,
    overflow: 'hidden',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: CANVAS,
  },
  edge: { position: 'absolute', left: 0, right: 0 },
  pool: { position: 'absolute', width: SIZE, height: SIZE },
  glow: { position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE },
});
