import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { isIos } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';
import type { PlanView } from './use-pricing';

type Props = {
  plan: PlanView;
  /** Every plan, for the folder tabs along the top of the frame. */
  plans: PlanView[];
  onPick: (tier: string) => void;
  t: AppColors;
  p: PricingPalette;
  ctaLabel: string;
  busy: boolean;
  locked: boolean;
  onSubscribe: () => void;
};

/** Card and frame colours. Every plan uses the same card in a full-width
 *  striped band: a white card on orange (white theme), a dark card on the
 *  accent (dark theme). */
type Skin = {
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
};

function skinFor(t: AppColors, p: PricingPalette): Skin {
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
  };
}

function Price({ plan, k }: { plan: PlanView; k: Skin }) {
  if (plan.free) return <Text style={[st.big, { color: k.text }]}>Free</Text>;
  if (!plan.price)
    return (
      <Text style={[st.unavailable, { color: k.sub }]}>
        Not available right now
      </Text>
    );
  // Yearly leads with the per-month figure; the yearly total sits below.
  const lead = plan.monthlyEquivalent
    ? { amount: plan.monthlyEquivalent, unit: '/month' }
    : { amount: plan.price, unit: plan.period };
  return (
    <View>
      <View style={st.priceRow}>
        {plan.compareAt ? (
          <Text style={[st.strike, { color: k.sub }]}>{plan.compareAt}</Text>
        ) : null}
        <Text style={[st.big, { color: k.price }]}>{lead.amount}</Text>
        <Text style={[st.unit, { color: k.sub }]}>{lead.unit}</Text>
      </View>
      {plan.monthlyEquivalent ? (
        <Text style={[st.billed, { color: k.sub }]}>
          {plan.price} billed yearly
        </Text>
      ) : null}
      {plan.saveAmount ? (
        <View style={[st.saveLine, { backgroundColor: `${k.check}22` }]}>
          <Ionicons name="trending-down" size={14} color={k.check} />
          <Text style={[st.saveLineText, { color: k.check }]}>
            You save {plan.saveAmount} a year vs monthly
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const FOLDED = 5;

function FeatureRow({
  icon,
  label,
  color,
  strong,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  strong?: boolean;
  text: string;
}) {
  return (
    <View style={st.row}>
      <Ionicons name={icon} size={16} color={color} style={st.rowIcon} />
      <Text
        style={[st.rowText, strong && st.rowStrong, { color: text }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

/** Credits and AI models first, then each feature on its own ticked row;
 *  long lists fold to five with a "Show all" toggle. */
function Features({
  plan,
  k,
  accent,
}: {
  plan: PlanView;
  k: Skin;
  accent: string;
}) {
  const [open, setOpen] = React.useState(false);
  // The credits row already says it; the API also lists it as a feature.
  const all = plan.credits
    ? plan.features.filter((f) => !/build credits/i.test(f))
    : plan.features;
  if (!plan.credits && !plan.models.length && !all.length) return null;
  const shown = open ? all : all.slice(0, FOLDED);
  const hidden = all.length - shown.length;
  return (
    <View style={st.features}>
      {plan.credits ? (
        <FeatureRow
          icon="flash"
          label={plan.credits}
          color={accent}
          strong
          text={k.text}
        />
      ) : null}
      {plan.models.length ? (
        <FeatureRow
          icon="sparkles"
          label={`AI: ${plan.models.join(', ')}`}
          color={accent}
          strong
          text={k.text}
        />
      ) : null}
      {shown.map((f) => (
        <FeatureRow
          key={f}
          icon="checkmark-circle"
          label={f}
          color={k.check}
          text={k.text}
        />
      ))}
      {all.length > FOLDED ? (
        <Text
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          style={[st.more, { color: k.sub }]}
        >
          {open ? 'Show less' : `Show all ${all.length} features (+${hidden})`}
        </Text>
      ) : null}
    </View>
  );
}

function Cta({
  plan,
  p,
  k,
  ctaLabel,
  busy,
  locked,
  onSubscribe,
}: Props & { k: Skin }) {
  if (plan.free) return null;
  if (plan.current) {
    return (
      <View style={[st.cta, { backgroundColor: p.currentSoft }]}>
        <Ionicons name="checkmark-circle" size={18} color={p.currentInk} />
        <Text style={[st.ctaText, { color: p.currentInk }]}>
          You&apos;re on this plan
        </Text>
      </View>
    );
  }
  // iOS sells through StoreKit only: no App Store product, no Subscribe.
  const enabled = !!plan.price && !locked && (!isIos() || !!plan.sku);
  return (
    <PressableScale
      onPress={onSubscribe}
      disabled={!enabled}
      disabledOpacity={busy ? 1 : 0.45}
      haptic={enabled ? 'press' : false}
      accessibilityRole="button"
      accessibilityLabel={`${ctaLabel} to ${plan.name} ${plan.price ?? ''}${plan.period}`}
      style={[st.cta, { backgroundColor: k.ctaBg }]}
    >
      {busy ? (
        <ActivityIndicator color={k.ctaText} size="small" />
      ) : (
        <Text style={[st.ctaText, { color: k.ctaText }]}>{ctaLabel}</Text>
      )}
    </PressableScale>
  );
}

function Body(props: Props & { k: Skin }) {
  const { plan, p, k } = props;
  return (
    <>
      <View style={st.nameRow}>
        <Text style={[st.name, { color: k.text }]}>{plan.name}</Text>
        {plan.current ? (
          <View style={[st.badge, { backgroundColor: k.frame }]}>
            <Text style={[st.badgeText, { color: '#FFFFFF' }]}>YOUR PLAN</Text>
          </View>
        ) : plan.popular ? (
          <View style={[st.badge, { backgroundColor: k.badgeBg }]}>
            <Text style={[st.badgeText, { color: k.badgeText }]}>
              MOST POPULAR
            </Text>
          </View>
        ) : null}
      </View>
      {plan.description ? (
        <Text style={[st.desc, { color: k.sub }]} numberOfLines={2}>
          {plan.description}
        </Text>
      ) : null}
      <Price plan={plan} k={k} />
      <View style={[st.dash, { borderColor: k.rule }]} />
      <Features plan={plan} k={k} accent={k.price} />
      <Cta {...props} p={p} />
    </>
  );
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

/** The band: brand colour with diagonal stripes, full width, the card cut as a folder
 *  whose raised tab is the selected plan. */
function Frame({
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
  const lines: number[] = [];
  for (let x = -h; x < w; x += 13) lines.push(x);
  return (
    <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
      <Rect width={w} height={h} fill={k.frame} />
      {lines.map((x) => (
        <Line
          key={x}
          x1={x}
          y1={h}
          x2={x + h}
          y2={0}
          stroke="#FFFFFF"
          strokeOpacity={0.2}
          strokeWidth={5}
        />
      ))}
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

/** Basic / Growth / 100X as folder tabs: the picked one is part of the card,
 *  the others sit on the stripes. Each says what yearly saves. */
function FolderTabs({
  plans,
  value,
  onPick,
  k,
}: {
  plans: PlanView[];
  value: string;
  onPick: (tier: string) => void;
  k: Skin;
}) {
  return (
    <View style={st.tabs}>
      {plans.map((plan) => {
        const on = plan.tier === value;
        const note = plan.savePct
          ? `Save ${plan.savePct}%`
          : plan.popular
            ? 'Popular'
            : null;
        return (
          <PressableScale
            key={plan.tier}
            onPress={() => onPick(plan.tier)}
            haptic="tap"
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={st.tab}
          >
            <View style={st.tabRow}>
              <Text
                style={[st.tabName, { color: on ? k.text : '#FFFFFF' }]}
                numberOfLines={1}
              >
                {plan.name}
              </Text>
              {plan.current ? (
                <View style={[st.dot, { backgroundColor: k.check }]} />
              ) : null}
            </View>
            {note ? (
              <Text
                style={[
                  st.tabNote,
                  on ? { color: k.price } : { color: '#FFFFFF', opacity: 0.85 },
                ]}
              >
                {note}
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

/** One plan in the immersive folder style: a striped brand frame whose
 *  top edge carries the plan tabs, the picked tab rising out of a dark
 *  card with the struck-through monthly price, the per-month price, the
 *  yearly saving, a ticked feature list and a white pill CTA. */
export function PlanCard(props: Props) {
  const { plan, plans, onPick, t, p } = props;
  const k = skinFor(t, p);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const index = Math.max(
    0,
    plans.findIndex((v) => v.tier === plan.tier)
  );
  return (
    <View
      style={st.frame}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h)
          setSize({ w: width, h: height });
      }}
    >
      <Frame size={size} k={k} index={index} count={plans.length || 1} />
      <FolderTabs plans={plans} value={plan.tier} onPick={onPick} k={k} />
      <View style={st.card}>
        <Body {...props} k={k} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    marginHorizontal: -GUTTER,
    paddingHorizontal: PAD_X,
    paddingVertical: PAD_Y,
  },
  tabs: { flexDirection: 'row', height: TAB },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabName: { fontFamily: F.sans800, fontSize: 15, letterSpacing: -0.2 },
  tabNote: { fontFamily: F.sans700, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 12,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: F.display900, fontSize: 22, letterSpacing: -0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontFamily: F.sans800, fontSize: 9.5, letterSpacing: 0.6 },
  desc: { fontFamily: F.sans400, fontSize: 13, lineHeight: 18, marginTop: -6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  strike: {
    fontFamily: F.sans600,
    fontSize: 17,
    textDecorationLine: 'line-through',
  },
  // 10% bigger and a weight heavier than before (18 / 700).
  big: { fontFamily: F.sans800, fontSize: 30, letterSpacing: -0.8 },
  unit: { fontFamily: F.sans600, fontSize: 14 },
  billed: { fontFamily: F.sans600, fontSize: 13, marginTop: 2 },
  saveLine: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveLineText: { fontFamily: F.sans700, fontSize: 12.5 },
  unavailable: { fontFamily: F.sans600, fontSize: 13 },
  dash: { borderTopWidth: 1, borderStyle: 'dashed' },
  features: { gap: 9 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowIcon: { marginTop: 1 },
  rowText: { flex: 1, fontFamily: F.sans500, fontSize: 14, lineHeight: 19 },
  rowStrong: { fontFamily: F.sans700 },
  more: { fontFamily: F.sans600, fontSize: 13, paddingTop: 2 },
  cta: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaText: { fontFamily: F.sans800, fontSize: 15 },
});
