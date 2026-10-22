import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
} from 'react-native';
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

import { GradientText } from '@/components/ui/GradientText';
import { hydrateAuth, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { haptic, type HapticKind } from '@/lib/haptics';

const { width, height } = Dimensions.get('window');

const HOLD_MS = 2600;

// White splash: assets/lottie/splash-white.json (made by
// scripts/make-splash-lottie.py, 100 frames at 30fps). The app moves on when
// it finishes; the timer is only a safety net if it never reports.
const WHITE_SPLASH = require('../../assets/lottie/splash-white.json');
/** The app's own gradient icon, which the orange drop resolves into. */
const SPLASH_ICON = require('../../assets/splash-mark.png');
const WHITE_FALLBACK_MS = 4600;
/** Haptics on the beats (30fps Lottie): the drop lands (f10), the flood
 *  starts (f17) and fills (f34), the flood collapses to a point (f52), the
 *  icon springs in, and the wordmark rises. */
const SPLASH_HAPTICS = [
  [333, 'press'],
  [560, 'soft'],
  [1130, 'soft'],
  [1720, 'rigid'],
  [1900, 'tap'],
  [2450, 'success'],
] as const;
/** Dark: a soft touch as the wordmark surfaces, a crisp one as it lands. */
const DARK_HAPTICS = [
  [120, 'soft'],
  [1000, 'success'],
] as const;

/** Plays a haptic sequence once `active` turns true; cancelled on unmount. */
function useHapticSequence(
  steps: readonly (readonly [number, HapticKind])[],
  active: boolean
) {
  React.useEffect(
    () => (active ? haptic.sequence(steps) : undefined),
    [steps, active]
  );
}
// The Lottie is 360x640 and drawn with resizeMode="cover", so it scales by
// height; its tile centre sits at y=300 of 640.
const LOTTIE_SCALE = Math.max(width / 360, height / 640);
const TILE_CENTRE_Y = height / 2 + (300 - 320) * LOTTIE_SCALE;
const ICON = Math.round(112 * LOTTIE_SCALE);
/** The icon appears the frame the orange point vanishes (f52 ≈ 1.73s). */
const ICON_DELAY = 1720;

// Dark is the original splash, unchanged. White is the default theme: the
// same honeycomb as a hairline on the warm canvas, the wordmark in ink.
const SPLASH = {
  dark: {
    bg: '#000000',
    hex: '#3A3A3D',
    word: ['#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0.35)'] as const,
    dot: 'rgba(255,255,255,0.62)',
    bar: 'light-content' as const,
  },
  light: {
    bg: '#FAFAF8',
    hex: '#E7E7E4',
    word: ['#0B0B0C', '#0B0B0C', 'rgba(11,11,12,0.32)'] as const,
    dot: 'rgba(11,11,12,0.55)',
    bar: 'dark-content' as const,
  },
};
type SplashColors = (typeof SPLASH)['dark'] | (typeof SPLASH)['light'];

// ─────────────────────────────────────────────────────────────
// Honeycomb — a flat grid of regular (pointy-top) hexagons, grey
// hairline borders, no fill. Just geometry, no animation.
// ─────────────────────────────────────────────────────────────
const HEX_R = 34; // circumradius
const HEX_W = HEX_R * Math.sqrt(3); // flat-to-flat width of a pointy-top hex
const HEX_H = HEX_R * 2;
const HEX_V_SPACING = HEX_H * 0.75; // vertical distance between row centres

function hexPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first vertex straight up (-90deg).
    const angle = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function HoneycombField({ stroke }: { stroke: string }) {
  // Extra rows/cols of overhang so offset rows and edge cuts never leave a
  // gap, then the whole field is centered on the screen (rather than grown
  // from the top-left) so hexes are cut symmetrically on every edge instead
  // of a full hex on one side and a sliver on the other.
  const cols = Math.ceil(width / HEX_W) + 2;
  const rows = Math.ceil(height / HEX_V_SPACING) + 2;
  const gridW = cols * HEX_W;
  const gridH = rows * HEX_V_SPACING;
  const xOffset = (width - gridW) / 2;
  const yOffset = (height - gridH) / 2;

  const hexes: { key: string; points: string }[] = [];
  for (let row = -1; row < rows; row++) {
    const rowOffset = row % 2 !== 0 ? HEX_W / 2 : 0;
    for (let col = -1; col < cols; col++) {
      const cx = xOffset + col * HEX_W + rowOffset;
      const cy = yOffset + row * HEX_V_SPACING;
      hexes.push({ key: `${row}:${col}`, points: hexPoints(cx, cy, HEX_R) });
    }
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {hexes.map(({ key, points }) => (
        <Polygon
          key={key}
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth={0.45}
        />
      ))}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Initializing dots — 3-dot loader beneath the wordmark
// ─────────────────────────────────────────────────────────────
function LoaderDot({ index, color }: { index: number; color: string }) {
  const o = useSharedValue(0.25);

  React.useEffect(() => {
    o.value = withDelay(
      1300 + index * 160,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420 }),
          withTiming(0.25, { duration: 420 })
        ),
        -1,
        false
      )
    );
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <ReAnimated.View style={[styles.dot, { backgroundColor: color }, st]} />
  );
}

function InitLoader({ color }: { color: string }) {
  const op = useSharedValue(0);

  React.useEffect(() => {
    op.value = withDelay(1100, withTiming(1, { duration: 500 }));
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <ReAnimated.View style={[styles.dots, st]} pointerEvents="none">
      <LoaderDot index={0} color={color} />
      <LoaderDot index={1} color={color} />
      <LoaderDot index={2} color={color} />
    </ReAnimated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────
/** Leaves the splash once: to /home when signed in, else /login. */
function useSplashExit() {
  const router = useRouter();
  const navigated = React.useRef(false);
  return React.useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    const authStatus = useAuth.getState().status;
    const isLoggedOut = authStatus === 'guest' || authStatus === 'signOut';
    router.replace(isLoggedOut ? '/login' : '/home');
  }, [router]);
}

/**
 * Hides the native launch screen and reports when it is gone. The Lottie
 * mounts only after that: the launch screen covers the first seconds of a
 * cold start, and an animation (and its timers) started underneath it played
 * unseen, then exited the moment it showed.
 */
function useNativeSplashGone() {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    hydrateAuth();
    let alive = true;
    const reveal = () => {
      if (alive) setShown(true);
    };
    // A hide asked for before the native root view has attached its launch
    // screen is lost, so ask again shortly after; extra calls are no-ops.
    const hide = () => SplashScreen.hideAsync().catch(() => {});
    hide().then(reveal);
    const retries = [120, 400, 900].map((ms) => setTimeout(hide, ms));
    // Never wait on the native splash for longer than this.
    const safety = setTimeout(reveal, 1500);
    return () => {
      alive = false;
      clearTimeout(safety);
      retries.forEach(clearTimeout);
    };
  }, []);

  return shown;
}

/** The white splash's timeline once it is visible: the wordmark rises as the
 *  logo finishes, the haptics follow the Lottie, and a fallback exit. */
function useWhiteIntro(shown: boolean, doExit: () => void) {
  const wordOp = useSharedValue(0);
  const wordY = useSharedValue(14);
  const icon = useSharedValue(0);

  React.useEffect(() => {
    if (!shown) return;
    // The icon blooms out of the point the flood collapsed into.
    icon.value = withDelay(
      ICON_DELAY,
      withSpring(1, { damping: 14, stiffness: 170, mass: 0.8 })
    );
    // The wordmark rises once the icon has landed.
    const ease = { duration: 700, easing: Easing.out(Easing.cubic) };
    wordOp.value = withDelay(2100, withTiming(1, ease));
    wordY.value = withDelay(2100, withTiming(0, ease));
    // Started synchronously, so it can never read a zero start time.
    const t = setTimeout(doExit, WHITE_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [shown, doExit, wordOp, wordY, icon]);
  useHapticSequence(SPLASH_HAPTICS, shown);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOp.value,
    transform: [{ translateY: wordY.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, icon.value * 2),
    transform: [{ scale: 0.4 + 0.6 * icon.value }],
  }));

  return { wordStyle, iconStyle };
}

/**
 * White theme (the default): the orange Lottie — a dot drops, floods the
 * screen, springs back into the AppSketch tile and the logo draws itself —
 * then the wordmark rises beneath the tile.
 */
function WhiteSplash() {
  const doExit = useSplashExit();
  const shown = useNativeSplashGone();
  const { wordStyle, iconStyle } = useWhiteIntro(shown, doExit);

  return (
    <Pressable
      style={[styles.screen, { backgroundColor: SPLASH.light.bg }]}
      onPress={doExit}
      accessibilityLabel="Skip intro"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      {shown && (
        <LottieView
          source={WHITE_SPLASH}
          autoPlay
          loop={false}
          resizeMode="cover"
          // The main-thread engine draws the size-morphing tile reliably;
          // Core Animation can drop huge animated shapes on device.
          renderMode={Platform.OS === 'ios' ? 'SOFTWARE' : 'AUTOMATIC'}
          // iOS reports a cancelled finish when autoPlay restarts the
          // animation as props settle; only a real finish leaves.
          onAnimationFinish={(cancelled) => {
            if (!cancelled) setTimeout(doExit, 450);
          }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ReAnimated.View
        pointerEvents="none"
        style={[
          styles.whiteIcon,
          { top: TILE_CENTRE_Y - ICON / 2, left: (width - ICON) / 2 },
          iconStyle,
        ]}
      >
        <Image source={SPLASH_ICON} style={styles.whiteIconImg} />
      </ReAnimated.View>
      <ReAnimated.View
        pointerEvents="none"
        style={[
          styles.whiteWord,
          { top: TILE_CENTRE_Y + ICON / 2 + 22 },
          wordStyle,
        ]}
      >
        <GradientText
          style={styles.wordmark}
          colors={[...SPLASH.light.word]}
          locations={[0, 0.52, 1]}
        >
          appsketch.ai
        </GradientText>
      </ReAnimated.View>
    </Pressable>
  );
}

export default function BrandSplashScreen() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? <DarkSplash /> : <WhiteSplash />;
}

/** The original splash, unchanged: honeycomb and the white wordmark. */
function DarkSplash() {
  const router = useRouter();
  const navigated = React.useRef(false);
  const c: SplashColors = SPLASH.dark;

  // Wordmark rises out of the screen: starts slightly back (scaled down,
  // invisible) and drifts forward into full size/opacity, as if the honeycomb
  // itself parted to reveal it.
  const wordOp = useSharedValue(0);
  const wordScale = useSharedValue(0.85);

  React.useEffect(() => {
    hydrateAuth();
    SplashScreen.hideAsync().catch(() => {});

    wordOp.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
    wordScale.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.exp),
    });

    const t = setTimeout(doExit, HOLD_MS);
    return () => clearTimeout(t);
  }, []);
  useHapticSequence(DARK_HAPTICS, true);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOp.value,
    transform: [{ scale: wordScale.value }],
  }));

  const doExit = () => {
    if (navigated.current) return;
    navigated.current = true;

    const authStatus = useAuth.getState().status;
    const isLoggedOut = authStatus === 'guest' || authStatus === 'signOut';
    router.replace(isLoggedOut ? '/login' : '/home');
  };

  return (
    <Pressable
      style={[styles.screen, { backgroundColor: c.bg }]}
      onPress={doExit}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle={c.bar} />

      <HoneycombField stroke={c.hex} />

      <ReAnimated.View
        style={[styles.brandBlock, wordStyle]}
        pointerEvents="none"
      >
        <GradientText
          style={styles.wordmark}
          colors={[...c.word]}
          locations={[0, 0.52, 1]}
        >
          appsketch.ai
        </GradientText>
        <InitLoader color={c.dot} />
      </ReAnimated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },

  whiteIcon: { position: 'absolute', width: ICON, height: ICON },
  whiteIconImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  whiteWord: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  brandBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 36 -> 43.2, rounded, per the +20% ask.
  wordmark: {
    fontFamily: F.display900,
    fontSize: 43,
    letterSpacing: -1.4,
    textAlign: 'center',
    lineHeight: 50,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
