import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { AppColors } from '@/lib/theme';

import { type PillSkin, type PillTab, PillTabs } from './pill-tabs';
import type { PricingPalette } from './theme';

/** Card and band colours: a white card on a solid splash-orange band
 *  (white theme), a dark card on the same orange (dark theme). */
export type Skin = {
  frame: string;
  bg: string;
  text: string;
  sub: string;
  rule: string;
  price: string;
  check: string;
  ctaBg: string;
  ctaText: string;
  badgeBg: string;
  badgeText: string;
  /** Savings text ("17% OFF") on an unpicked tab. */
  off: string;
  /** The tab bar: white + orange (white theme), black + orange (dark). */
  tabs: PillSkin;
};

const SPLASH_ORANGE = '#EB4709';

export function skinFor(t: AppColors, p: PricingPalette): Skin {
  if (p.dark) {
    return {
      frame: SPLASH_ORANGE,
      bg: '#18181B',
      text: '#FFFFFF',
      sub: 'rgba(255,255,255,0.6)',
      rule: 'rgba(255,255,255,0.16)',
      price: SPLASH_ORANGE,
      check: '#3DD68C',
      ctaBg: '#FFFFFF',
      ctaText: '#0B0B0C',
      badgeBg: '#FFFFFF',
      badgeText: '#0B0B0C',
      off: '#3DD68C',
      tabs: {
        bar: '#0B0B0C',
        pill: SPLASH_ORANGE,
        text: '#FFFFFF',
        onPill: '#FFFFFF',
        off: '#3DD68C',
      },
    };
  }
  return {
    // The splash orange (#EB4709, app.config.ts) so launch and pricing match.
    frame: SPLASH_ORANGE,
    bg: '#FFFFFF',
    text: '#0B0B0C',
    sub: '#5C5D63',
    rule: '#E7E7E4',
    price: SPLASH_ORANGE,
    check: '#12A150',
    ctaBg: '#0B0B0C',
    ctaText: '#FFFFFF',
    badgeBg: '#0B0B0C',
    badgeText: '#FFFFFF',
    off: '#12A150',
    tabs: {
      bar: '#FFFFFF',
      pill: SPLASH_ORANGE,
      text: '#0B0B0C',
      onPill: '#FFFFFF',
      off: '#12A150',
    },
  };
}

const GUTTER = 8; // the band undoes the plan list's 8pt gutter
const PAD = 8; // band around the bar and the card

export type { PillTab as FolderTab };

const STRIPE = 10; // stripe and gap width, points (45°)

/** Diagonal stripes over the band: one path of parallelograms, sized from
 *  the band's layout (no SVG <Pattern>, which drew unreliably). */
function Stripes({ w, h }: { w: number; h: number }) {
  if (!w || !h) return null;
  const d: string[] = [];
  for (let x = -h; x < w; x += STRIPE * 2) {
    d.push(`M${x},${h}L${x + h},0L${x + h + STRIPE},0L${x + STRIPE},${h}Z`);
  }
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width={w}
      height={h}
    >
      <Path d={d.join('')} fill="rgba(255,255,255,0.13)" />
    </Svg>
  );
}

/** A full-width striped brand band: the pill tab bar, then the card for
 *  the picked tab (`children`). */
export function FolderCard({
  t,
  p,
  tabs,
  value,
  onPick,
  children,
}: {
  t: AppColors;
  p: PricingPalette;
  tabs: PillTab[];
  value: string;
  onPick: (key: string) => void;
  children: React.ReactNode;
}) {
  const k = skinFor(t, p);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  return (
    <View
      style={[st.band, { backgroundColor: k.frame }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h)
          setSize({ w: width, h: height });
      }}
    >
      <Stripes w={size.w} h={size.h} />
      <PillTabs tabs={tabs} value={value} onPick={onPick} k={k.tabs} />
      <View style={[st.card, { backgroundColor: k.bg }]}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  band: {
    marginHorizontal: -GUTTER,
    paddingHorizontal: PAD,
    paddingVertical: 14,
    gap: 12,
  },
  card: { borderRadius: 22, overflow: 'hidden' },
});
