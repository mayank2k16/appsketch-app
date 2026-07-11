import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { AuthForm } from '@/components/AuthForm';
import { loginTheme } from '@/components/AuthForm/AuthTheme';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// appsketch.ai — showcase templates for the drifting montage
// ─────────────────────────────────────────────────────────────
const IMGS = [
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/an-elegant-and-sleek-layout-for-chinese-restaurants.webp?w=400', // 0 warm
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/a-website-template-for-grocery-and-supermarts.webp?w=400',        // 1 green
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/a-luxury-and-premium-wellness-brand-website.webp?w=400',          // 2 dark
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/a-modern-sleek-and-elegant-real-estate-website.webp?w=400',       // 3 dark
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/Screenshot_2026-04-22_at_8.54.13PM.png?w=400',                    // 4 neutral
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/Screenshot_2026-04-16_at_8.40.13PM.png?w=400',                    // 5 dark
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/Screenshot_2026-02-11_at_3.29.19PM.webp?w=400',                   // 6 neutral
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/compressed_Screenshot_2026-01-12_at_10_14.webp?w=400',            // 7 green
  'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/compressed_Screenshot_2026-01-12_at_10_15.webp?w=400',            // 8 neutral
];

const MONTAGE_COLS = 4;
const TILE_GAP = 8;
const GRID_W = width * 1.7;
const COL_W = (GRID_W - TILE_GAP * (MONTAGE_COLS + 1)) / MONTAGE_COLS;

const COLUMNS = [
  { order: [0, 2, 8, 3, 1, 6], goDown: true, speed: 16, tileH: 152 },
  { order: [7, 4, 5, 8, 0, 2], goDown: false, speed: 12, tileH: 138 },
  { order: [3, 1, 6, 2, 7, 4], goDown: true, speed: 18, tileH: 160 },
  { order: [8, 5, 0, 4, 3, 1], goDown: false, speed: 14, tileH: 146 },
];

function buildImgs(order: number[]): string[] {
  const base = order.map((i) => IMGS[i]);
  return [...base, ...base, ...base];
}

// ─────────────────────────────────────────────────────────────
// Drifting image column
// ─────────────────────────────────────────────────────────────
function ScrollColumn({
  order, goDown, speed, tileH,
}: {
  order: number[]; goDown: boolean; speed: number; tileH: number;
}) {
  const imgs = React.useMemo(() => buildImgs(order), [order]);
  const pageH = (imgs.length / 3) * (tileH + TILE_GAP);
  const anim = React.useRef(new Animated.Value(goDown ? 0 : -pageH)).current;

  React.useEffect(() => {
    const dur = (pageH / Math.max(speed, 1)) * 1000;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      anim.setValue(goDown ? 0 : -pageH);
      Animated.timing(anim, {
        toValue: goDown ? -pageH : 0,
        duration: dur,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }).start(({ finished }) => finished && loop());
    };
    loop();
    return () => { alive = false; anim.stopAnimation(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ width: COL_W, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        {imgs.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{
              width: COL_W, height: tileH,
              marginBottom: TILE_GAP, borderRadius: 12,
              backgroundColor: 'rgba(128,128,128,0.15)',
            }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Full-screen twinkling stars (dark mode only)
// ─────────────────────────────────────────────────────────────
type StarSpec = { x: number; y: number; size: number; delay: number; dur: number; base: number };

function makeStars(count: number): StarSpec[] {
  const out: StarSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.82 ? 1.5 : 2.5,
      delay: Math.random() * 2400,
      dur: 900 + Math.random() * 1600,
      base: 0.12 + Math.random() * 0.22,
    });
  }
  return out;
}

function TwinkleStar({ spec }: { spec: StarSpec }) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    anim.setValue(0);
    Animated.sequence([
      Animated.delay(spec.delay),
      Animated.timing(anim, {
        toValue: spec.base + 0.45, duration: 550,
        useNativeDriver: true, isInteraction: false,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: spec.base, duration: spec.dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true, isInteraction: false,
          }),
          Animated.timing(anim, {
            toValue: spec.base + 0.5, duration: spec.dur,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true, isInteraction: false,
          }),
        ])
      ),
    ]).start();
    return () => anim.stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size,
        backgroundColor: '#ffffff',
        opacity: anim,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

const DARK_BASE = '#050510';
const ORB_D = width * 1.6; // radial orb wider than screen so edges are invisible

export default function Login() {
  const { colorScheme } = useColorScheme();
  const t = loginTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const stars = React.useMemo(() => makeStars(48), []);

  return (
    <View style={[s.root, { backgroundColor: isDark ? DARK_BASE : t.panel }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      {/* ── Dark mode: circular radial glow + stars across full screen ── */}
      {isDark && (
        <>
          {/* #c084fc → #f9a8d4 → #60a5fa radial orb, centred on screen */}
          <Svg
            width={ORB_D}
            height={ORB_D}
            style={{ position: 'absolute', left: (width - ORB_D) / 2, top: (height - ORB_D) / 2 }}
            pointerEvents="none"
          >
            <Defs>
              <RadialGradient id="loginOrb" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#c084fc" stopOpacity="0.40" />
                <Stop offset="28%" stopColor="#f9a8d4" stopOpacity="0.24" />
                <Stop offset="58%" stopColor="#60a5fa" stopOpacity="0.12" />
                <Stop offset="100%" stopColor={DARK_BASE} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={ORB_D / 2} cy={ORB_D / 2} r={ORB_D / 2} fill="url(#loginOrb)" />
          </Svg>

          {/* Stars in both the montage zone and the auth panel zone */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {stars.map((star, i) => (
              <TwinkleStar key={i} spec={star} />
            ))}
          </View>
        </>
      )}

      {/* ── Zone A: drifting template montage ── */}
      <View style={[s.montage, { backgroundColor: 'transparent' }]}>
        <View style={s.gridWrap} pointerEvents="none">
          <View style={s.grid}>
            <View style={{ width: TILE_GAP }} />
            {COLUMNS.map((c, i) => (
              <React.Fragment key={i}>
                <ScrollColumn order={c.order} goDown={c.goDown} speed={c.speed} tileH={c.tileH} />
                <View style={{ width: TILE_GAP }} />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* top scrim for status-bar legibility */}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          style={s.topScrim}
          pointerEvents="none"
        />

      </View>

      {/* ── Zone B: auth panel — same background shows through ── */}
      <AuthForm />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },

  montage: { flex: 1, overflow: 'hidden' },
  gridWrap: {
    position: 'absolute',
    top: -0.18 * height,
    left: (width - GRID_W) / 2,
    width: GRID_W,
    height: height * 1.1,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    transform: [{ rotate: '-30deg' }, { scale: 1.15 }],
  },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
});
