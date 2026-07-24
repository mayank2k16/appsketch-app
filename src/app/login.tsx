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
const GRID_W = width * 1.4;
const COL_W = (GRID_W - TILE_GAP * (MONTAGE_COLS + 1)) / MONTAGE_COLS;

const COLUMNS = [
  { order: [0, 2, 8, 3, 1, 6], goDown: true, speed: 12, tileH: 140 },
  { order: [7, 4, 5, 8, 0, 2], goDown: false, speed: 12, tileH: 140 },
  { order: [3, 1, 6, 2, 7, 4], goDown: true, speed: 12, tileH: 140 },
  { order: [8, 5, 0, 4, 3, 1], goDown: false, speed: 12, tileH: 140 },
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

const FADE_H = 700;
const FADE_LOCATIONS = [0, 0.1, 0.2, 0.3, 0.42, 1];
const FADE_STOPS = [0, 0.08, 0.25, 0.55, 1, 1];

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Brand tint used for the faint mid-fade color shift — same hue in both themes.
const ACCENT_TINT = '#6C5CE7';

const FADE_ALPHAS = [0, 0.005, 0.01, 0.02, 0.04, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99, 1] as const;
const FADE_LOCATIONS_MAIN = [0, 0.03, 0.06, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.42, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00] as const;

// Builds the montage → panel fade, keeping the same alpha/location proportions
// in both themes but basing the color on the theme's panel bg (dark: near-black,
// light: white) instead of a hardcoded dark value.
function buildMontageFade(baseHex: string): [string, string, ...string[]] {
  return FADE_ALPHAS.map((alpha, i) =>
    i === 2 ? hexToRgba(ACCENT_TINT, alpha) : hexToRgba(baseHex, alpha)
  ) as [string, string, ...string[]];
}

export default function Login() {
  const { colorScheme } = useColorScheme();
  const t = loginTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const stars = React.useMemo(() => makeStars(48), []);
  const montageFadeColors = React.useMemo(() => buildMontageFade(t.panel), [t.panel]);
  const topScrimColors: [string, string] = isDark
    ? ['rgba(0,0,0,0.5)', 'transparent']
    : ['rgba(255,255,255,0.05)', 'transparent'];

  return (
    <View style={[s.root, { backgroundColor: isDark ? DARK_BASE : t.panel }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

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
          colors={topScrimColors}
          style={s.topScrim}
          pointerEvents="none"
        />


        <LinearGradient
          colors={montageFadeColors}
          locations={FADE_LOCATIONS_MAIN}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 350,
            height: 360,
          }}
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

  montage: { flex: 1, overflow: 'hidden', position: "absolute", top: 0, width: '100%', height: "100%" },
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
    transform: [{ rotate: '-30deg' }, { scale: 1.1 }],
  },
  topScrim: { position: 'absolute', left: 0, right: 0, height: "100%", bottom: 0 },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_H },
});
