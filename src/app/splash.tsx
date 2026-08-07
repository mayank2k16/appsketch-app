import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

import { hydrateAuth, useAuth } from '@/hooks/useAuth';
import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';

const { width, height } = Dimensions.get('window');

const HOLD_MS = 2600;

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

function HoneycombField() {
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
          stroke="#3A3A3D"
          strokeWidth={0.45}
        />
      ))}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Initializing dots — 3-dot loader beneath the wordmark
// ─────────────────────────────────────────────────────────────
function LoaderDot({ index }: { index: number }) {
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

  return <ReAnimated.View style={[styles.dot, st]} />;
}

function InitLoader() {
  const op = useSharedValue(0);

  React.useEffect(() => {
    op.value = withDelay(1100, withTiming(1, { duration: 500 }));
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <ReAnimated.View style={[styles.dots, st]} pointerEvents="none">
      <LoaderDot index={0} />
      <LoaderDot index={1} />
      <LoaderDot index={2} />
    </ReAnimated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────
export default function BrandSplashScreen() {
  const router = useRouter();
  const navigated = React.useRef(false);

  // Wordmark rises out of the screen: starts slightly back (scaled down,
  // invisible) and drifts forward into full size/opacity, as if the honeycomb
  // itself parted to reveal it.
  const wordOp = useSharedValue(0);
  const wordScale = useSharedValue(0.85);

  React.useEffect(() => {
    hydrateAuth();
    SplashScreen.hideAsync().catch(() => {});

    wordOp.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    wordScale.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.exp) });

    const t = setTimeout(doExit, HOLD_MS);
    return () => clearTimeout(t);
  }, []);

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
    <Pressable style={styles.screen} onPress={doExit}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <HoneycombField />

      <ReAnimated.View style={[styles.brandBlock, wordStyle]} pointerEvents="none">
        <GradientText
          style={styles.wordmark}
          colors={['#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0.35)']}
          locations={[0, 0.52, 1]}
        >
          appsketch.ai
        </GradientText>
        <InitLoader />
      </ReAnimated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
});
