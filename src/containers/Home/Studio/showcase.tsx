import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { GAP, SHOWCASE_FOOT, SHOWCASE_HEAD, SHOWCASE_TOP, W } from './geometry';
import type { Row } from './recipes';
import { ShowcaseRow } from './rows';
import { useStudioActions } from './studio-context';

/**
 * The feed's ONE black section, like a product shot: a curated bento of
 * silver phones and silver-framed websites on black (the sites play live
 * when the live budget picks them), under one heading, with a "Create
 * yours" pill at the foot. It is the only black in the feed; as it scrolls
 * through the viewport, Home turns the header and the tab bar black with it
 * (see `chromeTone`). Faint neutral spotlights (static SVG) give the black
 * some depth.
 */

const Spotlight = React.memo(function Spotlight({ h }: { h: number }) {
  return (
    <Svg width={W} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="showcase-spot" cx="50%" cy="22%" r="60%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.09} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="showcase-spot-2" cx="50%" cy="72%" r="55%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={h} fill="url(#showcase-spot)" />
      <Rect width={W} height={h} fill="url(#showcase-spot-2)" />
    </Svg>
  );
});

function Head() {
  return (
    <View style={s.head}>
      <Text style={s.eyebrow}>APPS AND WEBSITES</Text>
      <Text style={s.title}>Built to feel{'\n'}like the real thing.</Text>
      <Text style={s.sub}>
        Native iOS and Android apps and live websites, made with AppSketch.
      </Text>
    </View>
  );
}

export const Showcase = React.memo(function Showcase({
  rows,
  h,
}: {
  rows: Row[];
  h: number;
}) {
  const { create } = useStudioActions();
  return (
    <View style={[s.root, { height: h }]}>
      <Spotlight h={h} />
      <Head />
      <View style={s.rows}>
        {rows.map((row, i) => (
          <ShowcaseRow key={i} row={row} />
        ))}
      </View>
      <View style={s.foot}>
        <PressableScale
          onPress={create}
          accessibilityRole="button"
          accessibilityLabel="Create your own app or website"
          style={s.cta}
        >
          <Text style={s.ctaText}>Create yours</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </PressableScale>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    width: W,
    marginBottom: GAP,
    paddingTop: SHOWCASE_TOP,
    backgroundColor: '#000000',
  },
  head: {
    height: SHOWCASE_HEAD,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 6,
  },
  eyebrow: {
    fontFamily: F.sans600,
    fontSize: 11,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.55)',
  },
  title: {
    fontFamily: F.sans800,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.9,
    color: '#FFFFFF',
  },
  sub: { fontFamily: F.sans500, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  rows: { gap: GAP },
  foot: {
    height: SHOWCASE_FOOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: { fontFamily: F.sans600, fontSize: 13, color: '#FFFFFF' },
});
