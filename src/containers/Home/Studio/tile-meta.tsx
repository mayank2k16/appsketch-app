import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { titleOf } from '../TemplateReel/layout';
import { pillTone } from '../TemplateReel/pills';
import { CHIP_LINE, CHIP_LINES, CHIPS_H, LABEL_H } from './geometry';
import { chipsOf, chipW, splitLabel } from './tags';
import { formatLikes, useLike } from './template-social';

/**
 * Under (or inside) every template tile: its name with the heart and like
 * count beside it, then its colour-coded chips — the category in full,
 * then its tags — wrapping onto a second line rather than cutting a word.
 * A chip that does not fit whole is left out; the category always shows.
 * Each label has one hue everywhere (`pillTone`, shared with the product
 * page): a soft tint with darker text in white, a deeper tint with light
 * text on black and in dark mode.
 *
 * The heart is a real button (like / take back, optimistic); when the
 * counts cannot be loaded there is no heart at all.
 */

export type MetaTone = { ink: string; sub: string; dark: boolean };

export const metaTone = (dark: boolean): MetaTone =>
  dark
    ? { ink: '#F4F4F5', sub: 'rgba(244,244,245,0.62)', dark }
    : { ink: '#0B0B0C', sub: '#5C5D63', dark };

const LIKED = '#FF375F';

export const Heart = React.memo(function Heart({
  template,
  tone,
}: {
  template: MarketTemplate;
  tone: MetaTone;
}) {
  const like = useLike(template);
  if (!like) return null;
  const name = titleOf(template);
  const color = like.liked ? LIKED : tone.sub;
  return (
    <PressableScale
      scaleTo={0.82}
      onPress={like.toggle}
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityState={{ selected: like.liked }}
      accessibilityLabel={`${like.liked ? 'Unlike' : 'Like'} ${name}, ${like.likes} likes`}
      style={s.heart}
    >
      <Ionicons
        name={like.liked ? 'heart' : 'heart-outline'}
        size={12}
        color={color}
      />
      <Text allowFontScaling={false} style={[s.count, { color }]}>
        {formatLikes(like.likes)}
      </Text>
    </PressableScale>
  );
});

function Chip({
  label,
  width,
  dark,
}: {
  label: string;
  width: number;
  dark: boolean;
}) {
  const tone = pillTone(label, dark);
  // Only a label wider than the whole tile wraps (inside its chip).
  const wraps = chipW(label) > width;
  return (
    <View
      style={[
        wraps ? s.chipWrap : s.chip,
        { backgroundColor: tone.bg, borderColor: tone.edge },
      ]}
    >
      {/* One Text per line: iOS drew only the first line of a wrapped or
          \n-broken label in these chips, so each line is its own Text. */}
      {(wraps ? splitLabel(label) : [label]).map((line) => (
        <Text
          key={line}
          allowFontScaling={false}
          numberOfLines={1}
          style={[s.chipText, { color: tone.fg }]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

/** The chips that fit whole in `width`, wrapping to a second line. */
export const Chips = React.memo(function Chips({
  template,
  width,
  dark,
}: {
  template: MarketTemplate;
  width: number;
  dark: boolean;
}) {
  const labels = React.useMemo(
    () => chipsOf(template, { width, lines: CHIP_LINES }),
    [template, width]
  );
  return (
    <View style={[s.chips, { width }]}>
      {labels.map((c) => (
        <Chip key={c} label={c} width={width} dark={dark} />
      ))}
    </View>
  );
});

/** The name and heart, then the chips: LABEL_H tall, under a phone /
 *  small / wide tile (and at the top of a site strip). `width` is the
 *  tile's. */
export const TileFoot = React.memo(function TileFoot({
  template,
  tone,
  width,
}: {
  template: MarketTemplate;
  tone: MetaTone;
  width: number;
}) {
  return (
    <View style={s.foot}>
      <View style={s.titleRow}>
        <Text numberOfLines={1} style={[s.title, { color: tone.ink }]}>
          {titleOf(template)}
        </Text>
        <Heart template={template} tone={tone} />
      </View>
      <Chips template={template} width={width - 4} dark={tone.dark} />
    </View>
  );
});

const s = StyleSheet.create({
  foot: { height: LABEL_H, paddingHorizontal: 2, paddingTop: 5, gap: 4 },
  titleRow: { height: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.15,
  },
  chips: {
    height: CHIPS_H,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 3,
    columnGap: 4,
    overflow: 'hidden',
  },
  chip: {
    height: CHIP_LINE,
    paddingHorizontal: 6,
    borderRadius: CHIP_LINE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  // A two-line chip (its label broken explicitly — tags.ts splitLabel).
  chipWrap: {
    maxWidth: '100%',
    minHeight: CHIP_LINE,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: F.sans600,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.05,
  },
  heart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 16,
  },
  count: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    fontVariant: ['tabular-nums'],
  },
});
