import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { F } from '@/lib/fonts';
import { hydrateAuth, useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const HORIZON_Y = height * 0.5; // where the orb sits / horizon line
const ORB_SIZE = Math.min(width * 0.86, 320); // soft glow diameter

// Palette
const C = {
  bgTop: '#000000',
  bgMid: '#070912',
  bgLow: '#0d0a12',
  amber: '#FF7A18',
  amberSoft: '#FFB070',
  amberHot: '#FFE9CE',
  ink: '#F5F1EA',
  muted: 'rgba(255,255,255,0.5)',
  loader: 'rgba(255,196,150,0.75)',
};

// How long the whole intro takes before we start holding / navigating
const HOLD_MS = 3200;

// ─────────────────────────────────────────────────────────────
// Starfield
// ─────────────────────────────────────────────────────────────
type StarSpec = {
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
  base: number;
};

function makeStars(count: number): StarSpec[] {
  const out: StarSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * width,
      // keep stars mostly in the upper sky, thinning near the horizon
      y: Math.random() * (HORIZON_Y - 40),
      size: Math.random() < 0.85 ? 1.5 : 2.5,
      delay: Math.random() * 2200,
      dur: 900 + Math.random() * 1600,
      base: 0.15 + Math.random() * 0.25,
    });
  }
  return out;
}

function Star({ spec }: { spec: StarSpec }) {
  const o = useSharedValue(0);

  React.useEffect(() => {
    // fade in, then twinkle forever
    o.value = withDelay(
      spec.delay,
      withSequence(
        withTiming(spec.base + 0.5, { duration: 600 }),
        withRepeat(
          withSequence(
            withTiming(spec.base, { duration: spec.dur }),
            withTiming(spec.base + 0.55, { duration: spec.dur })
          ),
          -1,
          true
        )
      )
    );
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <ReAnimated.View
      style={[
        {
          position: 'absolute',
          left: spec.x,
          top: spec.y,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size,
          backgroundColor: '#fff',
        },
        st,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Per-letter reveal for the wordmark
// ─────────────────────────────────────────────────────────────
function Letter({
  char,
  delay,
  color,
}: {
  char: string;
  delay: number;
  color: string;
}) {
  const o = useSharedValue(0);
  const ty = useSharedValue(16);

  React.useEffect(() => {
    o.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(0, { duration: 620, easing: Easing.out(Easing.exp) }));
  }, []);

  const st = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <ReAnimated.Text style={[styles.wordChar, { color }, st]}>
      {char}
    </ReAnimated.Text>
  );
}

function Wordmark() {
  // "appsketch" white, ".ai" amber — appearing left→right
  const white = 'Appsketch'.split('');
  const amber = '.ai'.split('');
  const step = 55; // ms between letters
  const amberStart = 1150 + white.length * step + 120;

  return (
    <View style={styles.wordRow}>
      {white.map((ch, i) => (
        <Letter key={`w${i}`} char={ch} delay={1150 + i * step} color={C.ink} />
      ))}
      {amber.map((ch, i) => (
        <Letter key={`a${i}`} char={ch} delay={amberStart + i * step} color={C.amber} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Loader dots
// ─────────────────────────────────────────────────────────────
function Dot({ index }: { index: number }) {
  const o = useSharedValue(0.25);

  React.useEffect(() => {
    o.value = withDelay(
      2400 + index * 160,
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

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────
export default function BrandSplashScreen() {
  const router = useRouter();
  const status = useAuth.use.status();

  const stars = React.useMemo(() => makeStars(46), []);
  const navigated = React.useRef(false);

  // intro shared values
  const skyOp = useSharedValue(0); // background + stars container
  const orbScale = useSharedValue(0.15);
  const orbOp = useSharedValue(0);
  const horizonSX = useSharedValue(0); // horizon line draws outward
  const beamSY = useSharedValue(0.1); // beam sweeps open
  const beamOp = useSharedValue(0);
  const tagOp = useSharedValue(0);
  const tagSpace = useSharedValue(10);
  const loaderOp = useSharedValue(0);
  const flashOp = useSharedValue(0); // exit bloom

  React.useEffect(() => {
    hydrateAuth();

    // 1. sky fades up
    skyOp.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });

    // 2. orb ignites from a pinpoint → blooms, then breathes forever
    orbOp.value = withDelay(400, withTiming(1, { duration: 700 }));
    orbScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.out(Easing.exp) }),
        withRepeat(
          withSequence(
            withTiming(0.97, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      )
    );

    // 3. horizon line draws outward from centre
    horizonSX.value = withDelay(
      650,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    // 4. vertical beam sweeps open, then gently pulses
    beamOp.value = withDelay(900, withTiming(0.9, { duration: 700 }));
    beamSY.value = withDelay(
      900,
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withRepeat(
          withSequence(
            withTiming(0.94, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      )
    );

    // 5. tagline tracks-in (letters settle together)
    tagOp.value = withDelay(1900, withTiming(1, { duration: 700 }));
    tagSpace.value = withDelay(1900, withTiming(3.5, { duration: 900, easing: Easing.out(Easing.cubic) }));

    // 6. loader fades in
    loaderOp.value = withDelay(2350, withTiming(1, { duration: 600 }));

    // 7. auto - advance
    const t = setTimeout(doExit, HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  const doExit = () => {
    if (navigated.current) return;
    navigated.current = true;

    // quick amber bloom, then navigate
    flashOp.value = withTiming(1, { duration: 360, easing: Easing.in(Easing.quad) });
    setTimeout(() => {
      if (status === 'signIn') {
        router.replace('/storefront');
      } else {
        router.replace('/login');
      }
    }, 340);
  };

  // animated styles
  const skyStyle = useAnimatedStyle(() => ({ opacity: skyOp.value }));
  const orbStyle = useAnimatedStyle(() => ({
    opacity: orbOp.value,
    transform: [{ scale: orbScale.value }],
  }));
  const horizonStyle = useAnimatedStyle(() => ({
    opacity: skyOp.value,
    transform: [{ scaleX: horizonSX.value }],
  }));
  const beamStyle = useAnimatedStyle(() => ({
    opacity: beamOp.value,
    transform: [{ scaleY: beamSY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOp.value,
    letterSpacing: tagSpace.value,
  }));
  const loaderStyle = useAnimatedStyle(() => ({ opacity: loaderOp.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOp.value }));

  return (
    <Pressable style={styles.screen} onPress={doExit}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Deep-space background */}
      <ReAnimated.View style={[StyleSheet.absoluteFill, skyStyle]}>
        <LinearGradient
          colors={[C.bgTop, C.bgMid, C.bgLow, '#120a10']}
          locations={[0, 0.45, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient warm glow low-centre */}
        <View style={styles.ambientWrap} pointerEvents="none">
          <Svg width={width * 1.6} height={width * 1.6}>
            <Defs>
              <RadialGradient id="ambient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={C.amber} stopOpacity="0.35" />
                <Stop offset="45%" stopColor={C.amber} stopOpacity="0.10" />
                <Stop offset="100%" stopColor={C.amber} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={width * 0.8} cy={width * 0.8} r={width * 0.8} fill="url(#ambient)" />
          </Svg>
        </View>

        {/* Stars */}
        {stars.map((s, i) => (
          <Star key={i} spec={s} />
        ))}
      </ReAnimated.View>

      {/* Vertical light beam through the orb */}
      <ReAnimated.View style={[styles.beam, beamStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,150,60,0.0)', 'rgba(255,170,90,0.55)', 'rgba(255,150,60,0.0)', 'transparent']}
          locations={[0, 0.28, 0.5, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ReAnimated.View>

      {/* Horizon line — draws outward from centre */}
      <ReAnimated.View style={[styles.horizon, horizonStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', C.amberSoft, C.amberHot, C.amberSoft, 'transparent']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </ReAnimated.View>

      {/* The glowing orb */}
      <ReAnimated.View style={[styles.orbWrap, orbStyle]} pointerEvents="none">
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="10%" stopColor={C.amberHot} stopOpacity="1" />
              <Stop offset="24%" stopColor="#FFB265" stopOpacity="0.95" />
              <Stop offset="42%" stopColor={C.amber} stopOpacity="0.75" />
              <Stop offset="70%" stopColor="#8f2f00" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={ORB_SIZE / 2} fill="url(#orb)" />
        </Svg>
      </ReAnimated.View>

      {/* Wordmark + tagline */}
      <View style={styles.brandBlock} pointerEvents="none">
        <Wordmark />
        <ReAnimated.Text style={[styles.tagline, tagStyle]}>
          SKETCH · BUILD · LAUNCH
        </ReAnimated.Text>
      </View>

      {/* Loader */}
      <ReAnimated.View style={[styles.loaderWrap, loaderStyle]} pointerEvents="none">
        <Text style={styles.loaderText}>INITIALIZING</Text>
        <View style={styles.dots}>
          <Dot index={0} />
          <Dot index={1} />
          <Dot index={2} />
        </View>
      </ReAnimated.View>

      {/* Exit bloom */}
      <ReAnimated.View
        style={[styles.flash, flashStyle]}
        pointerEvents="none"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bgTop,
  },

  ambientWrap: {
    position: 'absolute',
    left: width / 2 - width * 0.8,
    top: HORIZON_Y - width * 0.8,
  },

  beam: {
    position: 'absolute',
    left: width / 2 - 2,
    top: 0,
    width: 4,
    height,
  },

  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HORIZON_Y - 0.5,
    height: 1.5,
  },

  orbWrap: {
    position: 'absolute',
    left: width / 2 - ORB_SIZE / 2,
    top: HORIZON_Y - ORB_SIZE / 2,
  },

  brandBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HORIZON_Y - 108,
    alignItems: 'center',
  },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  wordChar: {
    fontFamily: F.sans400,
    fontSize: Math.min(width * 0.11, 44),
    letterSpacing: 1,
    marginHorizontal: 2.5,
    color: C.ink,
    includeFontPadding: false,
  },

  tagline: {
    marginTop: 14,
    fontFamily: F.sans400,
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },

  loaderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 64 : 48,
    alignItems: 'center',
  },

  loaderText: {
    fontFamily: F.sans400,
    fontSize: 10,
    letterSpacing: 4,
    color: C.loader,
    marginBottom: 10,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.loader,
  },

  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFE9CE',
  },
});
