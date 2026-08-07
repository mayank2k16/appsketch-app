import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: W } = Dimensions.get('window');

const CDN = 'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/';

const COLUMNS: {
  direction: 'up' | 'down';
  speed: number;
  heights: number[];
  images: string[];
}[] = [
    {
      direction: 'up', speed: 48, heights: [130, 100, 152, 118, 140],
      images: [
        `${CDN}an-elegant-and-sleek-layout-for-chinese-restaurants.webp`,
        `${CDN}a-website-template-for-grocery-and-supermarts.webp`,
        `${CDN}a-luxury-and-premium-wellness-brand-website.webp`,
        `${CDN}a-modern-sleek-and-elegant-real-estate-website.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_7.webp`,
      ],
    },
    {
      direction: 'down', speed: 56, heights: [108, 150, 120, 132, 100],
      images: [
        `${CDN}compressed_Screenshot_2026-01-12_at_10_10.webp`,
        `${CDN}Screenshot_2026-02-11_at_3.29.19PM.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_14.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_15.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_11.webp`,
      ],
    },
    {
      direction: 'up', speed: 50, heights: [144, 110, 130, 150, 118],
      images: [
        `${CDN}compressed_Screenshot_2026-01-12_at_10_16.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_3.webp`,
        `${CDN}a-premium-jewellery-website-for-enquiry-purposes.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_9_69PLQM7.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_13.webp`,
      ],
    },
    {
      direction: 'down', speed: 54, heights: [120, 140, 100, 150, 128],
      images: [
        `${CDN}a-sleek-website-for-beauty-and-skincare.webp`,
        `${CDN}a-modern-and-elegant-looking-grocery-store.webp`,
        `${CDN}compressed_Screenshot_2026-01-12_at_10_2.webp`,
        `${CDN}a-modern-beauty-brand-website.webp`,
        `${CDN}Screenshot_2026-01-13_at_12.45.22AM.webp`,
      ],
    },
  ];

const TRUSTED_BY = ['studio', 'atelier', 'collective', 'makers', 'lab'];

const IMG_GAP = 5;
const IMG_RADIUS = 7;

// ─── One continuously-scrolling column of images ───────────────────────────────
function MarqueeColumn({
  images,
  direction,
  speed,
  heights,
  colWidth,
  t,
}: {
  images: string[];
  direction: 'up' | 'down';
  speed: number;
  heights: number[];
  colWidth: number;
  t: HomeColors;
}) {
  const setHeight = heights.reduce((sum, h) => sum + h + IMG_GAP, 0);
  const translateY = React.useRef(
    new Animated.Value(direction === 'up' ? 0 : -setHeight)
  ).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateY, {
        toValue: direction === 'up' ? -setHeight : 0,
        duration: setHeight * speed,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [setHeight]);

  // Parallax removed. It cost a `useAnimatedScrollHandler` on the Home
  // ScrollView plus one worklet per column recomputing a transform on every
  // single scroll frame — for an effect that is invisible next to the
  // continuous marquee already running underneath it. Dropping it lets Home
  // scroll with no JS/UI scroll listener attached at all.
  //
  // Two sets, not three: the loop translates by exactly one `setHeight`, so
  // two sets always cover the clip window. The third set only existed to give
  // the parallax shift slack, and each set is 5 more decoded remote images.
  const items = [...heights, ...heights];

  return (
    <View style={{ width: colWidth, height: '100%', overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
          {items.map((imgH, i) => (
            <View
              key={i}
              style={{
                height: imgH,
                marginBottom: IMG_GAP,
                borderRadius: IMG_RADIUS,
                overflow: 'hidden',
                backgroundColor: t.agentTabBg,
              }}
            >
              <ExpoImage
                source={images[i % images.length]}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
            </View>
          ))}
      </Animated.View>
    </View>
  );
}

// ─── Centre content: heading, subtitle, CTAs — sits on the flat overlay ────────
function CenterContent({
  t,
  onStartPress,
  onLearnPress,
}: {
  t: HomeColors;
  onStartPress: () => void;
  onLearnPress: () => void;
}) {
  return (
    <View style={s.hole}>
      <Text style={[s.heading, { color: t.galleryOverlayText }]}>
        {'Create unlimited beautiful\n apps and websites'}
      </Text>
      <Text style={[s.subtitle, { color: t.galleryOverlayTextSub }]}>
        Browse a living gallery of apps and websites — every idea rendered,
        remixable, and ready to ship.
      </Text>
      <View style={s.btns}>
        <TouchableOpacity
          onPress={onStartPress}
          style={[s.btnPrimary, { backgroundColor: t.heroCtaBg }]}
          activeOpacity={0.85}
        >
          <Text style={[s.btnPrimaryTxt, { color: t.heroCtaText }]}>
            Get started →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLearnPress}
          style={[
            s.btnSecondary,
            { backgroundColor: t.heroSecondaryBg, borderColor: t.heroSecondaryBorder },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[s.btnSecondaryTxt, { color: t.heroSecondaryText }]}>
            Learn more
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── GallerySection ─────────────────────────────────────────────────────────────
export function GallerySection({
  onStartPress,
  onLearnPress,
}: {
  onStartPress?: () => void;
  onLearnPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  // 40:58 — full-bleed width, height derived from it (1.45× the width). Was
  // `min(H * 0.7, 560)`, which tracked screen height; deriving from width
  // instead keeps the proportions identical on every device rather than
  // varying with how tall the phone is.
  const gridHeight = Math.round((W * 58) / 40);
  const padH = 4;
  const colGap = 5;
  const colWidth = (W - padH * 2 - colGap * (COLUMNS.length - 1)) / COLUMNS.length;

  return (
    <View style={[s.section, { backgroundColor: t.bg }]}>
      {/* ── Image frame (moving columns) with empty centre ── */}
      <View style={{ height: gridHeight, overflow: 'hidden' }}>
        <View style={[s.columns, { paddingHorizontal: padH, gap: colGap }]}>
          {COLUMNS.map((c, i) => (
            <MarqueeColumn
              key={i}
              images={c.images}
              direction={c.direction}
              speed={c.speed}
              heights={c.heights}
              colWidth={colWidth}
              t={t}
            />
          ))}
        </View>

        {/* Scrim behind the TEXT BAND ONLY. This used to be a flat
            `backgroundColor: t.galleryOverlay` across `absoluteFill`, which
            dimmed the entire masonry. Now it's a vertical gradient that is
            fully transparent at the top and bottom edges and solid through the
            middle, so the images read at full strength and only the band the
            heading/subtitle/CTAs sit on is darkened — with no hard edge. */}
        {/* Stops track the text block, which (heading + subtitle + CTAs + its
            own padding) is ~46% of this band's height and vertically centred —
            so it spans roughly 27–73%. The scrim is solid across 26–74% to
            cover exactly that, ramps out either side, and is fully clear by
            10% / 90%, leaving the top and bottom of the masonry undimmed. */}
        <LinearGradient
          colors={t.galleryOverlayGradient as [string, string, ...string[]]}
          locations={[0, 0.1, 0.26, 0.74, 0.9, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={[StyleSheet.absoluteFill, s.centerWrap, { pointerEvents: 'box-none' }]}>
          <CenterContent
            t={t}
            onStartPress={onStartPress ?? (() => { })}
            onLearnPress={onLearnPress ?? (() => { })}
          />
        </View>
      </View>

      {/* ── Trusted-by band (separate, below the grid, with a divider) ── */}
      <View style={[s.trustedBand, { borderTopColor: t.border }]}>
        <Text style={[s.trustedLabel, { color: t.textMuted }]}>Trusted by</Text>
        {TRUSTED_BY.map((name) => (
          <Text key={name} style={[s.trustedName, { color: t.textSub }]}>
            {name}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  section: {
    width: W,
  },

  columns: {
    flex: 1,
    flexDirection: 'row',
  },

  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  hole: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 11,
  },

  subtitle: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },

  btns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },

  btnPrimary: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13,
    letterSpacing: 0.1,
  },

  btnSecondary: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTxt: {
    fontFamily: F.sans700,
    fontSize: 13,
    letterSpacing: 0.1,
  },

  trustedBand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  trustedLabel: {
    fontFamily: F.sans600,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  trustedName: {
    fontFamily: F.sans500,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
