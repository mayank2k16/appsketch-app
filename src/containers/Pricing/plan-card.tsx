import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { isIos } from '@/lib/iap';
import { type AppColors, brandGradient } from '@/lib/theme';

import type { PricingPalette } from './theme';
import type { PlanView } from './use-pricing';

type Props = {
  plan: PlanView;
  t: AppColors;
  p: PricingPalette;
  ctaLabel: string;
  busy: boolean;
  locked: boolean;
  onSubscribe: () => void;
};

/** One card's colours. The featured plan (Growth) is the immersive one: a
 *  solid ink card on the white theme, a brand-gradient ring on dark. */
type Skin = {
  bg: string;
  border: string;
  text: string;
  sub: string;
  rule: string;
  price: string;
  check: string;
  ctaBg: string;
  ctaText: string;
};

function skinFor(plan: PlanView, t: AppColors, p: PricingPalette): Skin {
  const featured = plan.popular && !plan.current;
  if (p.dark) {
    return {
      bg: featured ? '#1A1A1D' : '#121214',
      border: plan.current ? p.currentBorder : 'rgba(255,255,255,0.10)',
      text: '#F6F7FA',
      sub: 'rgba(255,255,255,0.58)',
      rule: 'rgba(255,255,255,0.12)',
      price: t.accent,
      check: p.success,
      ctaBg: '#FFFFFF',
      ctaText: '#0B0B0C',
    };
  }
  if (featured) {
    return {
      bg: '#0B0B0C',
      border: '#0B0B0C',
      text: '#FFFFFF',
      sub: 'rgba(255,255,255,0.62)',
      rule: 'rgba(255,255,255,0.16)',
      price: '#FF7A2F',
      check: '#3DD68C',
      ctaBg: '#F2600C',
      ctaText: '#FFFFFF',
    };
  }
  return {
    bg: plan.current ? p.currentBg : '#FFFFFF',
    border: plan.current ? p.currentBorder : '#E7E7E4',
    text: '#0B0B0C',
    sub: '#5C5D63',
    rule: '#E7E7E4',
    price: '#F2600C',
    check: '#12A150',
    ctaBg: '#0B0B0C',
    ctaText: '#FFFFFF',
  };
}

/** "Save 17%" corner tag on diagonal stripes. */
function SaveTag({ pct, color }: { pct: number; color: string }) {
  // Diagonal stripes as thin rotated bars, clipped by the tag.
  return (
    <View style={[st.save, { backgroundColor: color }]}>
      {STRIPES.map((i) => (
        <View key={i} style={[st.stripe, { left: i * 12 - 20 }]} />
      ))}
      <Text style={st.saveText}>Save {pct}%</Text>
    </View>
  );
}

const STRIPES = Array.from({ length: 10 }, (_, i) => i);

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
  const { plan, t, p, k } = props;
  return (
    <>
      <View style={st.nameRow}>
        <Text style={[st.name, { color: k.text }]}>{plan.name}</Text>
        {plan.current ? (
          <View style={[st.badge, { backgroundColor: p.currentInk }]}>
            <Text style={[st.badgeText, { color: '#FFFFFF' }]}>YOUR PLAN</Text>
          </View>
        ) : plan.popular ? (
          <View
            style={[
              st.badge,
              { backgroundColor: p.dark ? t.accent : '#FFFFFF' },
            ]}
          >
            <Text
              style={[st.badgeText, { color: p.dark ? '#FFFFFF' : '#0B0B0C' }]}
            >
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
      <Cta {...props} />
    </>
  );
}

/** One plan, in the immersive style: name and badge, the struck-through
 *  monthly price beside the per-month price, a dashed rule, the features as
 *  a ticked list and a pill CTA. A yearly saving shows as a striped corner
 *  tag. The user's own plan gets the orange ring and "Your plan". */
export function PlanCard(props: Props) {
  const { plan, t, p } = props;
  const k = skinFor(plan, t, p);
  const tag = plan.savePct ? (
    <SaveTag pct={plan.savePct} color={p.dark ? t.accent : '#F2600C'} />
  ) : null;
  const card = (
    <View
      style={[
        st.card,
        !p.dark && st.shadow,
        {
          backgroundColor: k.bg,
          borderColor: k.border,
          borderWidth: plan.current ? 2 : 1,
        },
      ]}
    >
      {tag}
      <Body {...props} k={k} />
    </View>
  );
  // Dark: the featured plan sits in a brand-gradient ring.
  if (p.dark && plan.popular && !plan.current) {
    return (
      <LinearGradient
        colors={brandGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.ring}
      >
        {React.cloneElement(card, {
          style: [card.props.style, { borderWidth: 0 }],
        })}
      </LinearGradient>
    );
  }
  return card;
}

const st = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 12,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#0B0B0C',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  ring: { borderRadius: 25, padding: 1.5 },
  save: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: -20,
    width: 4,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '35deg' }],
  },
  saveText: { fontFamily: F.sans800, fontSize: 12, color: '#FFFFFF' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 84,
  },
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
