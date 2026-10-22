import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import {
  CAPTION_H,
  CARD_PAD,
  type CardSpec,
  categoryOf,
  kindOf,
  MEDIA_GAP,
  PHONE_FILL,
  PHONE_RATIO,
  thumbOf,
  titleOf,
} from './layout';
import { PhoneFrame } from './phone-frame';
import { pillTone } from './pills';
import { Shot } from './shot';

/**
 * One masonry card, as on the web /templates gallery: a flat card (hairline,
 * no shadow) with the media on top and a caption row below — title, then
 * category pill(s). Websites fill the media area with their screenshot;
 * mobile apps stand in the silver (graphite in dark) iPhone on a soft stage.
 * Nothing is laid over any image: the Featured tag lives in the caption row.
 */

export type CardColors = {
  card: string;
  edge: string;
  stage: string;
  title: string;
};

export const cardColors = (dark: boolean): CardColors =>
  dark
    ? {
        card: '#111113',
        edge: 'rgba(255,255,255,0.08)',
        stage: '#1a1a1c',
        title: '#F4F4F5',
      }
    : { card: '#FFFFFF', edge: '#E7E7E4', stage: '#F4F4F2', title: '#0B0B0C' };

const Pill = React.memo(function Pill({
  label,
  dark,
  max,
}: {
  label: string;
  dark: boolean;
  max: number;
}) {
  const tone = pillTone(label, dark);
  return (
    <View
      style={[
        s.pill,
        { maxWidth: max, backgroundColor: tone.bg, borderColor: tone.edge },
      ]}
    >
      <Text numberOfLines={1} style={[s.pillText, { color: tone.fg }]}>
        {label}
      </Text>
    </View>
  );
});

type CaptionProps = { spec: CardSpec; dark: boolean; c: CardColors };

const Caption = React.memo(function Caption({ spec, dark, c }: CaptionProps) {
  const category = categoryOf(spec.template);
  const kind = kindOf(spec.template);
  // Two pills when the card is wide enough (and not also carrying the
  // Featured tag), else the most telling one. The title always keeps at
  // least ~40% of the row: pills are capped and shrink, the title doesn't
  // vanish (a featured big card once squeezed it to nothing).
  const two = spec.w >= 300 && !!category && !spec.featured;
  const pills = two && category ? [category, kind] : [category ?? kind];
  const inner = spec.w - CARD_PAD * 2 - 4;
  const max = Math.round(inner * (two ? 0.24 : 0.42));
  return (
    <View style={s.caption}>
      {spec.featured ? (
        <View style={s.featured}>
          <Text style={s.featuredText}>FEATURED</Text>
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        style={[s.title, { color: c.title, minWidth: Math.round(inner * 0.4) }]}
      >
        {titleOf(spec.template)}
      </Text>
      {pills.map((p) => (
        <Pill key={p} label={p} dark={dark} max={max} />
      ))}
    </View>
  );
});

const Media = React.memo(function Media({ spec, dark, c }: CaptionProps) {
  const uri = thumbOf(spec.template);
  const mediaH = spec.h - CARD_PAD * 2 - CAPTION_H - MEDIA_GAP;
  if (!spec.mobile) {
    return (
      <View style={s.media}>
        <Shot uri={uri} bg={c.stage} />
      </View>
    );
  }
  const phoneW = Math.round(mediaH * PHONE_FILL * PHONE_RATIO);
  return (
    <View style={[s.media, s.stage, { backgroundColor: c.stage }]}>
      <PhoneFrame uri={uri} w={phoneW} dark={dark} />
    </View>
  );
});

type CardProps = {
  spec: CardSpec;
  dark: boolean;
  touching: SharedValue<boolean>;
  onOpen: (template: MarketTemplate) => void;
};

export const Card = React.memo(function Card({
  spec,
  dark,
  touching,
  onOpen,
}: CardProps) {
  const c = cardColors(dark);
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityLabel={`Open ${titleOf(spec.template)}`}
      onPressIn={() => touching.set(true)}
      onPressOut={() => touching.set(false)}
      onPress={() => onOpen(spec.template)}
      style={[
        s.card,
        {
          width: spec.w,
          height: spec.h,
          backgroundColor: c.card,
          borderColor: c.edge,
        },
      ]}
    >
      <Media spec={spec} dark={dark} c={c} />
      <Caption spec={spec} dark={dark} c={c} />
    </PressableScale>
  );
});

const s = StyleSheet.create({
  card: {
    borderRadius: 13,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: CARD_PAD,
    gap: MEDIA_GAP,
  },
  media: {
    flex: 1,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  stage: { alignItems: 'center', justifyContent: 'center' },
  caption: {
    height: CAPTION_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  title: { flex: 1, fontFamily: F.sans600, fontSize: 13, letterSpacing: -0.1 },
  pill: {
    flexShrink: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: { fontFamily: F.sans600, fontSize: 11, lineHeight: 13 },
  featured: {
    backgroundColor: '#F2600C',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  featuredText: {
    fontFamily: F.sans700,
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
