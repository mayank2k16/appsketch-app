import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Placeholder splash images — swap seeds for real assets later ─────────────
const splashUri = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Six full-width columns of images. A background-coloured block in the middle
// (see CenterHole) carves out an empty area for the text, giving the reference's
// "4-sided frame": image rows across the top & bottom, columns down the sides.
const COLUMNS: {
  seed: string;
  direction: 'up' | 'down';
  speed: number;
  heights: number[];
}[] = [
    { seed: 'sk-a', direction: 'up', speed: 48, heights: [130, 100, 152, 118, 140] },
    { seed: 'sk-b', direction: 'down', speed: 56, heights: [108, 150, 120, 132, 100] },
    { seed: 'sk-c', direction: 'up', speed: 50, heights: [144, 110, 130, 150, 118] },
    { seed: 'sk-d', direction: 'down', speed: 54, heights: [120, 140, 100, 150, 128] },
  ];

const TRUSTED_BY = ['studio', 'atelier', 'collective', 'makers', 'lab'];

const IMG_GAP = 5;
const IMG_RADIUS = 7;

// ─── One continuously-scrolling column of images ───────────────────────────────
function MarqueeColumn({
  seed,
  direction,
  speed,
  heights,
  colWidth,
}: {
  seed: string;
  direction: 'up' | 'down';
  speed: number;
  heights: number[];
  colWidth: number;
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

  // Doubled set so the loop wraps seamlessly.
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
            }}
          >
            <Image
              source={{
                uri: splashUri(`${seed}-${i % heights.length}`, Math.round(colWidth * 2), imgH * 2),
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Centre content: the empty (bg-coloured) hole + heading, subtitle, CTAs ────
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
    <View style={[s.hole, { backgroundColor: t.bg }]}>
      <Text style={[s.heading, { color: t.text }]}>
        {'Create unlimited\n'}
        <Text style={{ color: t.heroHeadingFade }}>beautiful images.</Text>
      </Text>
      <Text style={[s.subtitle, { color: t.textSub }]}>
        Browse a living gallery of screens and prototypes — every idea rendered,
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

  const gridHeight = Math.min(H * 0.7, 560);
  const padH = 4;
  const colGap = 5;
  const colWidth = (W - padH * 2 - colGap * (COLUMNS.length - 1)) / COLUMNS.length;

  return (
    <View style={[s.section, { backgroundColor: t.bg }]}>
      {/* ── Image frame (moving columns) with empty centre ── */}
      <View style={{ height: gridHeight, overflow: 'hidden' }}>
        <View style={[s.columns, { paddingHorizontal: padH, gap: colGap }]}>
          {COLUMNS.map((c) => (
            <MarqueeColumn
              key={c.seed}
              seed={c.seed}
              direction={c.direction}
              speed={c.speed}
              heights={c.heights}
              colWidth={colWidth}
            />
          ))}
        </View>

        {/* Empty bg-coloured centre + text sits inside it */}
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
    paddingHorizontal: 20,
  },

  hole: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 22,
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 26,
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
