import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

/** Card and band colours: a white card on a solid orange band (white
 *  theme), a dark card on the accent (dark theme). */
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
  /** "17% OFF" pill on the picked tab. */
  off: string;
};

export function skinFor(t: AppColors, p: PricingPalette): Skin {
  if (p.dark) {
    return {
      frame: t.accent,
      bg: '#18181B',
      text: '#FFFFFF',
      sub: 'rgba(255,255,255,0.6)',
      rule: 'rgba(255,255,255,0.16)',
      price: t.accent,
      check: '#3DD68C',
      ctaBg: '#FFFFFF',
      ctaText: '#0B0B0C',
      badgeBg: '#FFFFFF',
      badgeText: '#0B0B0C',
      off: '#3DD68C',
    };
  }
  return {
    frame: '#F2600C',
    bg: '#FFFFFF',
    text: '#0B0B0C',
    sub: '#5C5D63',
    rule: '#E7E7E4',
    price: '#F2600C',
    check: '#12A150',
    ctaBg: '#0B0B0C',
    ctaText: '#FFFFFF',
    badgeBg: '#0B0B0C',
    badgeText: '#FFFFFF',
    off: '#12A150',
  };
}

const PAD_X = 8; // striped band beside the card (its gutter to the screen)
const PAD_Y = 14; // striped band above and below the card
/** The band runs edge to edge: it undoes the plan list's 8pt gutter. */
const GUTTER = 8;
const TAB = 54; // height of the folder tabs
const RADIUS = 22; // card corners
const TAB_R = 16; // tab top corners
const FLARE = 14; // concave shoulder where the tab meets the card

/** The card outline: a rounded body whose top rises into a folder tab
 *  spanning [a, b] (a = 0 / b = w put the tab flush on that corner). */
function folderPath(
  { w, h }: { w: number; h: number },
  [a, b]: [number, number]
) {
  const x0 = PAD_X;
  const top = PAD_Y;
  const body = PAD_Y + TAB;
  const right = PAD_X + w;
  const bottom = PAD_Y + h;
  const R = RADIUS;
  const r = TAB_R;
  const c = FLARE;
  const d: string[] = [];
  if (a <= 0) {
    d.push(`M${x0},${top + r}`, `Q${x0},${top} ${x0 + r},${top}`);
  } else {
    d.push(
      `M${x0},${body + R}`,
      `Q${x0},${body} ${x0 + R},${body}`,
      `L${x0 + a - c},${body}`,
      `Q${x0 + a},${body} ${x0 + a},${body - c}`,
      `L${x0 + a},${top + r}`,
      `Q${x0 + a},${top} ${x0 + a + r},${top}`
    );
  }
  d.push(`L${x0 + b - r},${top}`);
  if (b >= w) {
    d.push(`Q${right},${top} ${right},${top + r}`);
  } else {
    d.push(
      `Q${x0 + b},${top} ${x0 + b},${top + r}`,
      `L${x0 + b},${body - c}`,
      `Q${x0 + b},${body} ${x0 + b + c},${body}`,
      `L${right - R},${body}`,
      `Q${right},${body} ${right},${body + R}`
    );
  }
  d.push(
    `L${right},${bottom - R}`,
    `Q${right},${bottom} ${right - R},${bottom}`,
    `L${x0 + R},${bottom}`,
    `Q${x0},${bottom} ${x0},${bottom - R}`,
    'Z'
  );
  return d.join(' ');
}

/** One folder tab: the name, an optional "17% OFF" pill and a dot on the
 *  user's own plan. */
export type FolderTab = {
  key: string;
  name: string;
  off?: string | null;
  dot?: boolean;
};

/** The band: solid brand colour, edge to edge, with the card cut as a
 *  folder whose raised tab is the picked one. */
function Shape({
  size,
  k,
  index,
  count,
}: {
  size: { w: number; h: number };
  k: Skin;
  index: number;
  count: number;
}) {
  const { w, h } = size;
  if (!w || !h) return null;
  const inner = w - PAD_X * 2;
  const step = inner / count;
  return (
    <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
      <Path
        d={folderPath({ w: inner, h: h - PAD_Y * 2 }, [
          index * step,
          (index + 1) * step,
        ])}
        fill={k.bg}
      />
    </Svg>
  );
}

function Tab({
  tab,
  on,
  k,
  onPick,
}: {
  tab: FolderTab;
  on: boolean;
  k: Skin;
  onPick: (key: string) => void;
}) {
  return (
    <PressableScale
      onPress={() => onPick(tab.key)}
      haptic="tap"
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={tab.off ? `${tab.name}, ${tab.off}` : tab.name}
      style={st.tab}
    >
      <View style={st.tabRow}>
        <Text
          style={[st.tabName, { color: on ? k.text : '#FFFFFF' }]}
          numberOfLines={1}
        >
          {tab.name}
        </Text>
        {tab.dot ? (
          <View
            style={[st.dot, { backgroundColor: on ? k.check : '#FFFFFF' }]}
          />
        ) : null}
      </View>
      {tab.off ? (
        // Picked: a solid green pill; others: a white pill on the band.
        <View style={[st.off, { backgroundColor: on ? k.off : '#FFFFFF' }]}>
          <Text style={[st.offText, { color: on ? '#FFFFFF' : k.frame }]}>
            {tab.off}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/** A full-width brand band whose top edge carries folder tabs; the picked
 *  tab rises out of the card below it, which renders `children`. */
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
  tabs: FolderTab[];
  value: string;
  onPick: (key: string) => void;
  children: React.ReactNode;
}) {
  const k = skinFor(t, p);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const index = Math.max(
    0,
    tabs.findIndex((x) => x.key === value)
  );
  return (
    <View
      style={[st.band, { backgroundColor: k.frame }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h)
          setSize({ w: width, h: height });
      }}
    >
      <Shape size={size} k={k} index={index} count={tabs.length || 1} />
      <View style={st.tabs}>
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            tab={tab}
            on={tab.key === value}
            k={k}
            onPick={onPick}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  band: {
    marginHorizontal: -GUTTER,
    paddingHorizontal: PAD_X,
    paddingVertical: PAD_Y,
  },
  tabs: { flexDirection: 'row', height: TAB },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabName: { fontFamily: F.sans800, fontSize: 15, letterSpacing: -0.2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  off: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  offText: { fontFamily: F.sans900, fontSize: 10.5, letterSpacing: 0.3 },
});
