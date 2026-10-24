import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { isIos } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

import { type Skin, skinFor } from './folder-card';
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

/** Credits and AI models first, then every feature on its own ticked row
 *  (all of them, never folded). */
function Features({
  plan,
  k,
  accent,
}: {
  plan: PlanView;
  k: Skin;
  accent: string;
}) {
  // The credits row already says it; the API also lists it as a feature.
  const all = plan.credits
    ? plan.features.filter((f) => !/build credits/i.test(f))
    : plan.features;
  if (!plan.credits && !plan.models.length && !all.length) return null;
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
      {all.map((f) => (
        <FeatureRow
          key={f}
          icon="checkmark-circle"
          label={f}
          color={k.check}
          text={k.text}
        />
      ))}
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
      {/* The folder tab already names the plan: no second heading. */}
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

/** One plan's body inside the folder card: badge and description, the
 *  struck-through monthly price beside the per-month price, the yearly
 *  saving, a ticked feature list and a pill CTA. */
export function PlanCard(props: Props) {
  const { t, p } = props;
  return (
    <View style={st.card}>
      <Body {...props} k={skinFor(t, p)} />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeText: { fontFamily: F.sans800, fontSize: 9.5, letterSpacing: 0.6 },
  desc: { fontFamily: F.sans500, fontSize: 14, lineHeight: 19 },
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
