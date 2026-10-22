import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { categoryOf, titleOf } from '@/containers/Home/TemplateReel/layout';
import { F } from '@/lib/fonts';

import { CtaBar } from './cta-bar';
import { Pill, pillsOf } from './template-info';
import type { PageTheme } from './theme';
import { useCtas } from './use-ctas';
import type { ProductMotion } from './use-product-transition';

/**
 * One template's details inside the box under the hero, compact enough to
 * never scroll: name, pills (+ "More" for the full description, tags and
 * ecosystem apps), a two-line description, and the CTAs at the bottom.
 * Panels of the neighbouring pages sit on top of each other and cross-fade
 * with a short parallax as the pager moves; only the centred one takes
 * touches.
 */

type Props = {
  template: MarketTemplate;
  i: number;
  x: SharedValue<number>;
  m: ProductMotion;
  current: boolean;
  t: PageTheme;
  dark: boolean;
  /** Position within the template's category, for "3 / 52". */
  n: number;
  of: number;
  /** The "Swipe ›" cue goes after the first swipe. */
  swiped: boolean;
  onMore: (template: MarketTemplate) => void;
};

/** "3 / 52 · Swipe ›" — fixed to its own width; the name truncates first. */
function Count({ p }: { p: Props }) {
  if (p.of < 1) return null;
  const color = p.t.muted;
  return (
    <View style={s.count}>
      <Text style={[s.countText, { color }]}>{`${p.n} / ${p.of}`}</Text>
      {p.swiped ? null : (
        <>
          <Text style={[s.countText, { color }]}>· Swipe</Text>
          <Ionicons name="chevron-forward" size={12} color={color} />
        </>
      )}
    </View>
  );
}

/** The template's own description; without one, its own category and tags
 *  (never invented copy), so there is no blank gap. */
function blurbOf(t: MarketTemplate) {
  const own = (t.description || '').trim();
  if (own) return own;
  const tags = t.kind === 'code' ? (t.tags ?? []) : [];
  return [categoryOf(t), tags.join(', ')].filter(Boolean).join(' · ');
}

function usePanelStyle({ i, x, m }: Props) {
  return useAnimatedStyle(() => {
    const d = i - x.value;
    const near = interpolate(Math.abs(d), [0, 0.5], [1, 0], 'clamp');
    return {
      opacity: near,
      transform: [
        { translateX: d * 44 },
        { translateY: (1 - m.reveal.value) * 14 },
      ],
    };
  });
}

function PillsRow(p: Props) {
  const { template, t } = p;
  return (
    <View style={s.pillsRow}>
      <View style={s.pills}>
        {pillsOf(template).map((label) => (
          <Pill key={label} label={label} dark={p.dark} />
        ))}
      </View>
      <PressableScale
        accessibilityLabel="More about this template"
        hitSlop={8}
        onPress={() => p.onMore(template)}
        style={[s.more, { borderColor: t.outline }]}
      >
        <Text style={[s.moreText, { color: t.ink }]}>More</Text>
      </PressableScale>
    </View>
  );
}

export const DetailsPanel = React.memo(function DetailsPanel(p: Props) {
  const { template, t } = p;
  const style = usePanelStyle(p);
  const ctas = useCtas(template);
  const blurb = blurbOf(template);
  return (
    <Animated.View
      pointerEvents={p.current ? 'box-none' : 'none'}
      style={[s.fill, style]}
    >
      <View style={s.titleRow}>
        <Text numberOfLines={1} style={[s.title, { color: t.ink }]}>
          {titleOf(template)}
        </Text>
        <Count p={p} />
      </View>
      <PillsRow {...p} />
      {blurb ? (
        <Text numberOfLines={2} style={[s.body, { color: t.muted }]}>
          {blurb}
        </Text>
      ) : null}
      <View style={s.flex} />
      <CtaBar t={t} primary={ctas.primary} secondary={ctas.secondary} />
    </Animated.View>
  );
});

const s = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingTop: 13,
  },
  flex: { flex: 1, minHeight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    flex: 1,
    fontFamily: F.display900,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.5,
    marginLeft: 2,
  },
  count: {
    flexShrink: 0,
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 2,
  },
  countText: {
    fontFamily: F.sans600,
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 8,
  },
  pills: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  more: {
    height: 24,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  moreText: { fontFamily: F.sans600, fontSize: 12 },
  body: {
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 8,
    marginHorizontal: 2,
  },
});
