import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient as SvgLinearGradient,
  Polygon,
  Stop,
} from 'react-native-svg';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Honeycomb geometry ──────────────────────────────────────────────────────
// Regular flat-top hexagons: all six sides equal, all angles 120°. For a
// point-to-point width W the side is W/2 and the flat-to-flat height is
// W·√3/2 — so the cell is always shorter than it is wide. The height is
// derived, never chosen; picking it independently is what turns the cells
// into stretched lozenges.
const HEX_W = SCREEN_W / 3.4;
const HEX_H = HEX_W * (Math.sqrt(3) / 2);
const COL_STEP = HEX_W * 0.75;
const ROWS = 4;
const GRID_H = ROWS * HEX_H;
// Hairline breathing room between neighbours — this is the channel the
// travelling light runs through.
const GAP = 2.5;
// Inset by scaling the whole cell, not by subtracting from each axis — a flat
// subtraction would shorten the horizontal radius more than the vertical one
// and quietly break the regularity the shape is built on.
const HEX_SHRINK = 1 - (2 * GAP) / HEX_W;
const HEX_R = (HEX_W / 2) * HEX_SHRINK;
const HEX_RY = (HEX_H / 2) * HEX_SHRINK;

// The strip is one set of columns rendered twice; drifting past one set width
// wraps back by exactly that amount, which is invisible because the two sets
// are identical. That is the whole infinite-scroll trick.
const COLS_PER_SET = 6;
const SET_W = COLS_PER_SET * COL_STEP;
const CONTENT_W = SET_W * 2;

const FADE_H = Math.round(HEX_H * 0.5);

const DRIFT_PX_S = 14; // right → left, slow enough to read as ambient
const BEAM_W = SCREEN_W * 0.34;
const BEAM_MS = 11000;

// One clip path, reused: every cell is a <G> translated into place and the
// clip resolves in that translated user space, so N cells need N transforms
// but only this single shape definition.
const HEX_POINTS = (() => {
  const cx = HEX_W / 2;
  const cy = HEX_H / 2;
  return [
    [cx - HEX_R, cy],
    [cx - HEX_R / 2, cy - HEX_RY],
    [cx + HEX_R / 2, cy - HEX_RY],
    [cx + HEX_R, cy],
    [cx + HEX_R / 2, cy + HEX_RY],
    [cx - HEX_R / 2, cy + HEX_RY],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
})();

// Same CDN + placeholder pattern as Gallery/MockupCard — reused screenshots
// standing in for real "shipped" business screenshots for now.
const CDN = 'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/';

const SHIPPED = [
  `${CDN}a-premium-and-elegant-beauty-store.webp`,
  `${CDN}a-website-for-healthcare-brands.webp`,
  `${CDN}a-modern-and-elegant-looking-grocery-store.webp`,
  `${CDN}a-portfolio-website-for-sports-academy.webp`,
  `${CDN}a-modern-sleek-and-elegant-real-estate-website.webp`,
  `${CDN}a-luxury-and-premium-wellness-brand-website.webp`,
  `${CDN}an-elegant-and-sleek-layout-for-chinese-restaurants.webp`,
  `${CDN}a-premium-jewellery-website-for-enquiry-purposes.webp`,
];

type Cell = { key: string; x: number; y: number; image: string };

// Offset columns leave a half-cell notch at the top of every odd column and at
// the bottom of every even one. Odd columns therefore start a row early and run
// a row long: the band ends up fully tiled and the SVG viewport crops the
// overhang, so no empty black wedges survive at the edges.
const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  let n = 0;
  for (let col = 0; col < COLS_PER_SET * 2; col += 1) {
    const odd = col % 2 === 1;
    const first = odd ? -1 : 0;
    const last = ROWS - 1;
    for (let row = first; row <= last; row += 1) {
      out.push({
        key: `${col}-${row}`,
        x: col * COL_STEP,
        y: row * HEX_H + (odd ? HEX_H / 2 : 0),
        image: SHIPPED[n % SHIPPED.length],
      });
      n += 1;
    }
    // Both copies of the set must draw the same images or the wrap would jump.
    if (col === COLS_PER_SET - 1) n = 0;
  }
  return out;
})();

const AnimatedGradient = Reanimated.createAnimatedComponent(SvgLinearGradient);

/** `#RRGGBB` → `rgba(r,g,b,a)`, so a fade can end on the exact page colour. */
function fade(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function Honeycomb({ t }: { t: HomeColors }) {
  const offset = useSharedValue(0);
  const dragging = useSharedValue(false);
  const beam = useSharedValue(0);

  // Per-frame drift rather than a timing animation, so a drag can take over
  // mid-flight and hand control straight back on release.
  useFrameCallback((f) => {
    if (dragging.value) return;
    const dt = Math.min(f.timeSincePreviousFrame ?? 16, 50) / 1000;
    let v = offset.value - DRIFT_PX_S * dt;
    if (v <= -SET_W) v += SET_W;
    offset.value = v;
  }, true);

  React.useEffect(() => {
    beam.value = withRepeat(
      withTiming(1, { duration: BEAM_MS, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(beam);
  }, [beam]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragging.value = true;
    })
    .onChange((e) => {
      let v = offset.value + e.changeX;
      if (v <= -SET_W) v += SET_W;
      if (v > 0) v -= SET_W;
      offset.value = v;
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  // Slides the gradient's own coordinates across the strip — the seam strokes
  // are painted with it, so only the channels between cells light up.
  // Subtracting the drift converts a screen-space path into content space, so
  // the line crosses the visible band once per cycle instead of wandering off
  // with the honeycomb and disappearing for most of the loop.
  const beamProps = useAnimatedProps(() => {
    const x = interpolate(beam.value, [0, 1], [-BEAM_W, SCREEN_W]) - offset.value;
    return { x1: x, x2: x + BEAM_W };
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={s.strip}>
        <Reanimated.View style={[{ width: CONTENT_W, height: GRID_H }, stripStyle]}>
          <Svg width={CONTENT_W} height={GRID_H}>
            <Defs>
              <ClipPath id="hcClip">
                <Polygon points={HEX_POINTS} />
              </ClipPath>
              <AnimatedGradient
                id="hcBeam"
                gradientUnits="userSpaceOnUse"
                y1={0}
                y2={GRID_H * 0.6}
                animatedProps={beamProps}
              >
                <Stop offset="0" stopColor="#6C5CE7" stopOpacity="0" />
                <Stop offset="0.42" stopColor="#6C5CE7" stopOpacity="0.35" />
                <Stop offset="0.48" stopColor="#8B7CFF" stopOpacity="0.9" />
                <Stop offset="0.5" stopColor="#E9EDFF" stopOpacity="1" />
                <Stop offset="0.52" stopColor="#8B7CFF" stopOpacity="0.9" />
                <Stop offset="0.58" stopColor="#6C5CE7" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#6C5CE7" stopOpacity="0" />
              </AnimatedGradient>
            </Defs>

            {CELLS.map((c) => (
              <G key={c.key} x={c.x} y={c.y}>
                <G clipPath="url(#hcClip)">
                  <SvgImage
                    href={{ uri: c.image }}
                    x={0}
                    y={0}
                    width={HEX_W}
                    height={HEX_H}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </G>
                <Polygon
                  points={HEX_POINTS}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
                <Polygon
                  points={HEX_POINTS}
                  fill="none"
                  stroke="url(#hcBeam)"
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                />
              </G>
            ))}
          </Svg>
        </Reanimated.View>

        {/* Melts the sliced top and bottom rows into the page so the band has
            no hard cut line across the combs. */}
        <LinearGradient
          colors={[t.bg, fade(t.bg, 0)]}
          style={[s.fade, { top: 0, height: FADE_H }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[fade(t.bg, 0), t.bg]}
          style={[s.fade, { bottom: 0, height: FADE_H }]}
          pointerEvents="none"
        />
      </View>
    </GestureDetector>
  );
}

const LLM_CHIPS: { name: string; gradient: [string, string]; core?: boolean }[] = [
  { name: 'AppSketch LLM', gradient: ['#8B5CF6', '#6C5CE7'], core: true },
  { name: 'Claude', gradient: ['#3B82F6', '#22D3EE'] },
  { name: 'GPT-5', gradient: ['#EC4899', '#F97316'] },
  { name: 'Gemini', gradient: ['#22D3EE', '#8B5CF6'] },
];

export function ShippedSection() {
  const { colorScheme } = useColorScheme();
  const t: HomeColors = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as the other new sections, so the
    // shared TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <SectionHeading
        eyebrow="SHIPPED TO PRODUCTION"
        lines={['Real apps, running', 'live.']}
        t={t}
        style={s.inset}
      />

      <Honeycomb t={t} />

      {/* ── Model strip ── */}
      <Text style={[s.stripLabel, s.inset, { color: t.textMuted }]}>
        STRUCTURED BY OUR PROPRIETARY LLM
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {LLM_CHIPS.map((chip) => (
          <View
            key={chip.name}
            style={[s.chip, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
          >
            <LinearGradient
              colors={chip.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.chipIcon}
            />
            <Text style={[s.chipName, { color: t.text }]}>{chip.name}</Text>
            {chip.core && (
              <View style={[s.coreBadge, { backgroundColor: t.templatesTagBg }]}>
                <Text style={[s.coreText, { color: t.templatesTagText }]}>core</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  inset: {
    paddingHorizontal: 8,
  },

  strip: {
    height: GRID_H,
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  stripLabel: {
    fontFamily: F.sans700,
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 34,
    marginBottom: 14,
  },
  chips: {
    paddingHorizontal: 8,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
  },
  chipName: {
    fontFamily: F.sans700,
    fontSize: 15,
  },
  coreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  coreText: {
    fontFamily: F.sans600,
    fontSize: 10.5,
  },
});
