import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { isIos } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

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

function Price({ plan, t }: Pick<Props, 'plan' | 't'>) {
  if (plan.free) return <Text style={[st.price, { color: t.text }]}>Free</Text>;
  if (!plan.price)
    return (
      <Text style={[st.unavailable, { color: t.textSub }]}>
        Not available right now
      </Text>
    );
  // Yearly leads with the per-month figure; the yearly total sits below.
  const lead = plan.monthlyEquivalent
    ? { amount: plan.monthlyEquivalent, unit: '/month' }
    : { amount: plan.price, unit: plan.period };
  return (
    <View style={st.priceCol}>
      <Text style={[st.price, { color: t.text }]}>
        {lead.amount}
        <Text style={[st.period, { color: t.textSub }]}>{lead.unit}</Text>
      </Text>
      {plan.monthlyEquivalent ? (
        <Text style={[st.equiv, { color: t.textSub }]}>
          {plan.price} billed yearly
        </Text>
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
      <Ionicons name={icon} size={15} color={color} style={st.rowIcon} />
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
function Features({ plan, t, p }: Pick<Props, 'plan' | 't' | 'p'>) {
  const [open, setOpen] = React.useState(false);
  // The credits row already says it; the API also lists it as a feature.
  const all = plan.credits
    ? plan.features.filter((f) => !/build credits/i.test(f))
    : plan.features;
  if (!plan.credits && !plan.models.length && !all.length) return null;
  const shown = open ? all : all.slice(0, FOLDED);
  const hidden = all.length - shown.length;
  return (
    <View style={[st.features, { borderTopColor: p.cardBorder }]}>
      {plan.credits ? (
        <FeatureRow
          icon="flash"
          label={plan.credits}
          color={p.primaryBg}
          strong
          text={t.text}
        />
      ) : null}
      {plan.models.length ? (
        <FeatureRow
          icon="sparkles"
          label={`AI: ${plan.models.join(', ')}`}
          color={p.primaryBg}
          strong
          text={t.text}
        />
      ) : null}
      {shown.map((f) => (
        <FeatureRow
          key={f}
          icon="checkmark-circle"
          label={f}
          color={p.success}
          text={t.text}
        />
      ))}
      {all.length > FOLDED ? (
        <Text
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          style={[st.more, { color: t.textSub }]}
        >
          {open ? 'Show less' : `Show all ${all.length} features (+${hidden})`}
        </Text>
      ) : null}
    </View>
  );
}

function Cta({ plan, p, ctaLabel, busy, locked, onSubscribe }: Props) {
  if (plan.free) return null;
  if (plan.current) {
    return (
      <View style={[st.cta, { backgroundColor: p.currentSoft }]}>
        <Ionicons name="checkmark-circle" size={17} color={p.currentInk} />
        <Text style={[st.ctaText, { color: p.currentInk }]}>
          You&apos;re on this plan
        </Text>
      </View>
    );
  }
  // iOS sells through StoreKit only: no App Store product, no Subscribe.
  const enabled = !!plan.price && !locked && (!isIos() || !!plan.sku);
  const bg = plan.popular ? p.primaryBg : p.secondaryBg;
  const fg = plan.popular ? '#FFFFFF' : p.secondaryText;
  return (
    <PressableScale
      onPress={onSubscribe}
      disabled={!enabled}
      disabledOpacity={busy ? 1 : 0.4}
      haptic={enabled ? 'press' : false}
      accessibilityRole="button"
      accessibilityLabel={`${ctaLabel} to ${plan.name} ${plan.price ?? ''}${plan.period}`}
      style={[st.cta, { backgroundColor: bg }]}
    >
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[st.ctaText, { color: fg }]}>{ctaLabel}</Text>
      )}
    </PressableScale>
  );
}

/** One plan: name + description beside the price, the features as a
 *  ticked list, and Subscribe. The user's own plan gets the orange border,
 *  a tinted card and a "Your plan" badge; otherwise the highlighted plan
 *  (Growth) gets the ink border, the "Most popular" tab and the orange CTA. */
export function PlanCard(props: Props) {
  const { plan, t, p } = props;
  const border = plan.current
    ? p.currentBorder
    : plan.popular
      ? p.popularBorder
      : p.cardBorder;
  return (
    <View
      style={[
        st.card,
        {
          backgroundColor: plan.current ? p.currentBg : p.cardBg,
          borderColor: border,
          borderWidth: plan.current ? 2 : 1,
        },
      ]}
    >
      <View style={st.head}>
        <View style={st.headText}>
          <View style={st.nameRow}>
            <Text style={[st.name, { color: t.text }]}>{plan.name}</Text>
            {plan.current ? (
              <View style={[st.badge, { backgroundColor: p.currentInk }]}>
                <Text style={[st.badgeText, { color: '#FFFFFF' }]}>
                  YOUR PLAN
                </Text>
              </View>
            ) : plan.popular ? (
              <View style={[st.badge, { backgroundColor: p.popularBadgeBg }]}>
                <Text style={[st.badgeText, { color: p.popularBadgeText }]}>
                  Most popular
                </Text>
              </View>
            ) : null}
          </View>
          {plan.description ? (
            <Text style={[st.desc, { color: t.textSub }]} numberOfLines={2}>
              {plan.description}
            </Text>
          ) : null}
        </View>
        <Price plan={plan} t={t} />
      </View>
      <Features plan={plan} t={t} p={p} />
      <Cta {...props} />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: F.sans700, fontSize: 9.5, letterSpacing: 0.4 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headText: { flex: 1 },
  name: { fontFamily: F.display900, fontSize: 18, letterSpacing: -0.3 },
  desc: { fontFamily: F.sans400, fontSize: 12, lineHeight: 16, marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontFamily: F.sans700, fontSize: 18, letterSpacing: -0.3 },
  period: { fontFamily: F.sans500, fontSize: 12 },
  unavailable: {
    fontFamily: F.sans600,
    fontSize: 12,
    maxWidth: 110,
    textAlign: 'right',
  },
  equiv: { fontFamily: F.sans500, fontSize: 11, marginTop: 1 },
  features: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 7,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowIcon: { marginTop: 1 },
  rowText: { flex: 1, fontFamily: F.sans400, fontSize: 13, lineHeight: 18 },
  rowStrong: { fontFamily: F.sans600 },
  more: { fontFamily: F.sans600, fontSize: 12.5, paddingTop: 2 },
  cta: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: F.sans700, fontSize: 14 },
});
