import { BlurView } from 'expo-blur';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BRAND_ORANGE } from './theme';

/**
 * The website hero's loader: a round cluster of brand-orange dots (the
 * Home hero's dot grid, gathered up) with a ripple running out from the
 * centre — each dot swells and brightens as the wave passes it. One
 * shared clock per cluster drives every dot's style on the UI thread (no
 * per-dot timers, no JS per frame).
 *
 * - `DotSurface`: the panel's resting surface while the site's first
 *   screen paints (and what the grow flies in).
 * - `DotVeil`: over the old viewport while a Mobile / Tablet / Desktop
 *   switch loads — it frosts and dims the old view and sits the cluster on
 *   a soft frosted chip. It appears in the frame the tap lands.
 */

const PITCH = 12;
const DOT = 5;
const GRID = 5;
/** One ripple, centre to rim. */
const CYCLE_MS = 1500;
/** Grid cells (from the centre) out to the round cluster's rim. */
const RIM = 2.3;
const TAU = Math.PI * 2;

const MID = (GRID - 1) / 2;
const DOTS = Array.from({ length: GRID * GRID }, (_, k) => {
  const cx = (k % GRID) - MID;
  const cy = Math.floor(k / GRID) - MID;
  return { k, cx, cy, dist: Math.hypot(cx, cy) };
}).filter((d) => d.dist <= RIM);

function Dot({
  clock,
  cx,
  cy,
  dist,
}: {
  clock: SharedValue<number>;
  cx: number;
  cy: number;
  dist: number;
}) {
  const style = useAnimatedStyle(() => {
    // The crest leaves the centre and travels out; cubed so it reads as a
    // crisp ring rather than a wash.
    const c = 0.5 + 0.5 * Math.cos(clock.value * TAU - dist * 1.35);
    const v = c * c * c;
    return {
      opacity: 0.2 + 0.8 * v,
      transform: [{ scale: 0.55 + 0.75 * v }],
    };
  });
  return (
    <Animated.View
      style={[
        s.dot,
        { left: (cx + MID) * PITCH, top: (cy + MID) * PITCH },
        style,
      ]}
    />
  );
}

/** The ripple clock: 0 → 1 on a loop while `animate`. */
function useClock(animate: boolean) {
  const clock = useSharedValue(0);
  React.useEffect(() => {
    if (!animate) {
      cancelAnimation(clock);
      return;
    }
    clock.set(0);
    clock.set(
      withRepeat(
        withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
        -1,
        false
      )
    );
    return () => cancelAnimation(clock);
  }, [animate, clock]);
  return clock;
}

/** The cluster at rest (the ripple's first frame), as plain views: a page
 *  that is not animating its loader — every neighbour in the pager, the
 *  grow's flying copy — mounts 21 static views instead of 21 animated
 *  styles (each one a UI-thread mapper), which made a swipe's new
 *  neighbour cost a burst of work as the spring started. */
const STILL = DOTS.map((d) => {
  const c = 0.5 + 0.5 * Math.cos(-d.dist * 1.35);
  const v = c * c * c;
  return {
    k: d.k,
    style: {
      left: (d.cx + MID) * PITCH,
      top: (d.cy + MID) * PITCH,
      opacity: 0.2 + 0.8 * v,
      transform: [{ scale: 0.55 + 0.75 * v }],
    },
  };
});

const StillCluster = React.memo(function StillCluster() {
  return (
    <View pointerEvents="none" style={s.cluster}>
      {STILL.map((d) => (
        <View key={d.k} style={[s.dot, d.style]} />
      ))}
    </View>
  );
});

export function DotCluster({ animate }: { animate: boolean }) {
  if (!animate) return <StillCluster />;
  return <RippleCluster />;
}

function RippleCluster() {
  const clock = useClock(true);
  return (
    <View pointerEvents="none" style={s.cluster}>
      {DOTS.map((d) => (
        <Dot key={d.k} clock={clock} cx={d.cx} cy={d.cy} dist={d.dist} />
      ))}
    </View>
  );
}

/** The panel at rest while a website's first screen paints. */
export function DotSurface({
  dark,
  animate,
}: {
  dark: boolean;
  animate: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[s.fill, { backgroundColor: dark ? '#141416' : '#FAFAF9' }]}
    >
      <DotCluster animate={animate} />
    </View>
  );
}

/** Over the old viewport while the next device's site loads. */
export function DotVeil({ dark }: { dark: boolean }) {
  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(120)}
      style={s.fill}
    >
      <BlurView
        intensity={22}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark
              ? 'rgba(10,10,12,0.42)'
              : 'rgba(255,255,255,0.42)',
          },
        ]}
      />
      <View
        style={[
          s.chip,
          {
            backgroundColor: dark
              ? 'rgba(28,28,31,0.72)'
              : 'rgba(255,255,255,0.78)',
            borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <DotCluster animate />
      </View>
    </Animated.View>
  );
}

const SIDE = (GRID - 1) * PITCH + DOT;

const s = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cluster: { width: SIDE, height: SIDE },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: BRAND_ORANGE,
  },
  chip: {
    width: SIDE + 40,
    height: SIDE + 40,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
