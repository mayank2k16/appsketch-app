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
import { categoryOf } from '@/containers/Home/TemplateReel/layout';
import { pillTone } from '@/containers/Home/TemplateReel/pills';
import { F } from '@/lib/fonts';

import { CtaBar } from './cta-bar';
import { highlightsOf } from './template-info';
import type { PageTheme } from './theme';
import { useCtas } from './use-ctas';
import type { ProductMotion } from './use-product-transition';

/**
 * One template's details inside the short box under the hero: what KIND of
 * template it is, as highlight chips (category + its own tags, e.g.
 * "E-commerce", "Fashion" — the name is in the breadcrumb above), a one-line
 * description with "More" (full description, tags, ecosystem apps), and the
 * CTAs at the bottom.
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

/** One highlight: the label's own category colour, bolder than a pill. */
function Highlight({ label, dark }: { label: string; dark: boolean }) {
  const tone = pillTone(label, dark);
  return (
    <View
      style={[s.chip, { backgroundColor: tone.bg, borderColor: tone.edge }]}
    >
      <Text numberOfLines={1} style={[s.chipText, { color: tone.fg }]}>
        {label}
      </Text>
    </View>
  );
}

function Highlights(p: Props) {
  return (
    <View style={s.topRow}>
      <View style={s.chips}>
        {highlightsOf(p.template).map((label) => (
          <Highlight key={label} label={label} dark={p.dark} />
        ))}
      </View>
      <Count p={p} />
    </View>
  );
}

function BlurbRow(p: Props & { blurb: string }) {
  const { template, t } = p;
  return (
    <View style={s.blurbRow}>
      <Text numberOfLines={1} style={[s.body, { color: t.muted }]}>
        {p.blurb}
      </Text>
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
      <Highlights {...p} />
      <BlurbRow {...p} blurb={blurb} />
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
    padding: 11,
  },
  flex: { flex: 1, minHeight: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // One line of WHOLE chips: one that does not fit wraps onto a second
  // line, which the fixed height hides (never a chip cut mid-word).
  chips: {
    flex: 1,
    height: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    overflow: 'hidden',
  },
  chip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontFamily: F.sans700, fontSize: 12, letterSpacing: -0.1 },
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
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  blurbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  more: {
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  moreText: { fontFamily: F.sans600, fontSize: 12 },
  body: {
    flex: 1,
    fontFamily: F.sans400,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 2,
  },
});
