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

// A steep -40° tilt leaves the top-right/top corners empty unless the band of
// columns is WIDE enough to reach into them. Rather than scaling the tiles up
// (which makes each huge and shows fewer of them), we use MORE columns so the
// diagonal band is wide enough to fill every corner while individual tiles
// stay a sensible size. The middle ~4 columns read as the "main" ones; the
// outer columns are partly cut at the screen edges (which the user is fine
// with) and exist mainly to fill the corners.
const MONTAGE_COLS = 6;
const TILE_GAP = 5;
const GRID_W = width * 1.7;
const COL_W = (GRID_W - TILE_GAP * (MONTAGE_COLS + 1)) / MONTAGE_COLS;

// Shorter, wider tiles (was 140) — less height, more width.
const TILE_H = 104;

const COLUMNS = [
  { order: [0, 2, 8, 3, 1, 6], goDown: true, speed: 12, tileH: TILE_H },
  { order: [7, 4, 5, 8, 0, 2], goDown: false, speed: 12, tileH: TILE_H },
  { order: [3, 1, 6, 2, 7, 4], goDown: true, speed: 12, tileH: TILE_H },
  { order: [8, 5, 0, 4, 3, 1], goDown: false, speed: 12, tileH: TILE_H },
  { order: [1, 6, 3, 0, 8, 5], goDown: true, speed: 12, tileH: TILE_H },
  { order: [4, 7, 2, 5, 1, 0], goDown: false, speed: 12, tileH: TILE_H },
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
              backgroundColor: '#000',
              opacity: 1,
            }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Twinkling stars scattered over the montage
// ─────────────────────────────────────────────────────────────
type StarSpec = { x: number; y: number; size: number; delay: number; dur: number; base: number };

// The opaque AuthForm panel covers roughly the bottom half of the screen, so
// stars generated below this line are hidden behind it and wasted — keep
// them within the actually-visible montage band, and bias extra weight into
// its lowest slice (just above the fade into the panel) so twinkles are
// visible near the bottom of the images too, not just up top.
const VISIBLE_MONTAGE_H = height * 0.55;

function makeStars(count: number): StarSpec[] {
  const out: StarSpec[] = [];
  const bands = 6;
  for (let i = 0; i < count; i++) {
    const band = i % bands;
    const bandH = VISIBLE_MONTAGE_H / bands;
    const isBottomBand = band === bands - 1;
    out.push({
      x: Math.random() * width,
      y: band * bandH + Math.random() * bandH,
      // Slightly bigger/brighter in the bottom band so twinkles read clearly
      // over the darker fade zone just above the panel.
      size: isBottomBand ? (Math.random() < 0.6 ? 2 : 3) : (Math.random() < 0.82 ? 1.5 : 2.5),
      delay: Math.random() * 2400,
      dur: 900 + Math.random() * 1600,
      base: isBottomBand ? 0.25 + Math.random() * 0.3 : 0.12 + Math.random() * 0.22,
    });
  }
  return out;
}

function TwinkleStar({ spec }: { spec: StarSpec }) {
  // Start at the star's base opacity (not 0) so it stays visible even if the
  // looping animation ever fails to run on this device — matches the caution
  // documented around one-shot animations elsewhere in the auth flow.
  const anim = React.useRef(new Animated.Value(spec.base)).current;

  React.useEffect(() => {
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

export default function Login() {
  const { colorScheme } = useColorScheme();
  const t = loginTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const stars = React.useMemo(() => makeStars(72), []);

  return (
    <View style={[s.root, { backgroundColor: isDark ? DARK_BASE : t.panel }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      {/* ── Zone A: drifting template montage (shown clearly, no dimming
          overlay — the only fade is the seamless one owned by AuthForm at the
          montage/panel boundary) ── */}
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
      </View>

      {/* ── Zone B: auth panel — same background shows through ── */}
      <AuthForm />

      {/* Twinkling stars — rendered ABOVE the AuthForm fade so they stay
          visible in the dark fade band near the bottom of the montage (if
          they lived under AuthForm, its top-fade gradient would paint over
          them and no stars would show at the bottom). Height-capped to the
          visible montage band + fade so they never cover the buttons. */}
      <View style={s.starsLayer} pointerEvents="none">
        {stars.map((spec, i) => (
          <TwinkleStar key={i} spec={spec} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },

  montage: { flex: 1, overflow: 'hidden', position: "absolute", top: 0, width: '100%', height: "100%" },
  gridWrap: {
    position: 'absolute',
    // Steep -40° tilt needs a generously oversized + scaled frame so the
    // rotated band still fills every corner (top-left/top-right and down to
    // the montage's bottom edge) with no empty triangles.
    top: -0.22 * height,
    left: (width - GRID_W) / 2,
    width: GRID_W,
    height: height * 1.7,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    transform: [{ rotate: '-40deg' }, { scale: 1.5 }],
  },
  // Stars occupy the visible montage band + a little into the fade, and sit
  // above the AuthForm fade so they read in the dark transition at the bottom.
  starsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: VISIBLE_MONTAGE_H + 40,
  },
});
