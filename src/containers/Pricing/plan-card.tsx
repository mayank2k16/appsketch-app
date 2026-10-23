import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
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

function PriceWell({ plan, t, p }: Pick<Props, 'plan' | 't' | 'p'>) {
  return (
    <View style={[st.priceWell, { backgroundColor: p.priceBg }]}>
      {plan.free ? (
        <Text style={[st.price, { color: t.text }]}>Free</Text>
      ) : plan.price ? (
        <>
          <View style={st.priceRow}>
            <Text style={[st.price, { color: t.text }]}>{plan.price}</Text>
            <Text style={[st.period, { color: t.textSub }]}>{plan.period}</Text>
          </View>
          {plan.monthlyEquivalent ? (
            <Text style={[st.equiv, { color: t.textSub }]}>
              {plan.monthlyEquivalent}/month, billed yearly
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[st.unavailable, { color: t.textSub }]}>
          Not available right now
        </Text>
      )}
    </View>
  );
}

/** Show everything up to this many; beyond it, the first 6 + one tap. */
const FEATURES_INLINE = 8;
const FEATURES_FOLDED = 6;

function Features({ plan, t, p }: Pick<Props, 'plan' | 't' | 'p'>) {
  const [open, setOpen] = React.useState(false);
  const fold = plan.features.length > FEATURES_INLINE && !open;
  const shown = fold ? plan.features.slice(0, FEATURES_FOLDED) : plan.features;
  return (
    <View style={st.features}>
      {shown.map((feat) => (
        <View key={feat} style={st.featureRow}>
          <Ionicons name="checkmark" size={15} color={p.mark} style={st.tick} />
          <Text style={[st.featureText, { color: t.textSub }]}>{feat}</Text>
        </View>
      ))}
      {fold ? (
        <Text
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          style={[st.more, { color: t.text }]}
        >
          See all {plan.features.length} features
        </Text>
      ) : null}
    </View>
  );
}

/** Build credits per month and the AI models the plan unlocks. */
function Extras({ plan, t, p }: Pick<Props, 'plan' | 't' | 'p'>) {
  if (!plan.credits && !plan.models.length) return null;
  return (
    <View style={[st.extras, { borderColor: p.cardBorder }]}>
      {plan.credits ? (
        <View style={st.extraRow}>
          <Ionicons name="flash-outline" size={15} color={t.text} />
          <Text style={[st.extraText, { color: t.text }]}>{plan.credits}</Text>
        </View>
      ) : null}
      {plan.models.length ? (
        <View style={st.extraRow}>
          <Ionicons
            name="sparkles-outline"
            size={15}
            color={t.text}
            style={st.tick}
          />
          <Text style={[st.extraText, { color: t.textSub }]}>
            <Text style={{ color: t.text }}>AI models: </Text>
            {plan.models.join(', ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Cta({ plan, p, t, ctaLabel, busy, locked, onSubscribe }: Props) {
  if (plan.free) return null;
  if (plan.current) {
    return (
      <View style={[st.cta, st.ctaOutline, { borderColor: p.cardBorder }]}>
        <Ionicons name="checkmark-circle" size={16} color={p.success} />
        <Text style={[st.ctaText, { color: t.text }]}>Current plan</Text>
      </View>
    );
  }
  const enabled = !!plan.price && !locked;
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

/** One plan: name + description, the price well (App Store price on iOS),
 *  the feature list and its Subscribe. The highlighted plan (Growth) gets
 *  the ink border, the "Most popular" tab and the screen's one orange CTA. */
export function PlanCard(props: Props) {
  const { plan, t, p } = props;
  return (
    <View
      style={[
        st.card,
        {
          backgroundColor: p.cardBg,
          borderColor: plan.popular ? p.popularBorder : p.cardBorder,
        },
      ]}
    >
      {plan.popular ? (
        <View style={[st.badge, { backgroundColor: p.popularBadgeBg }]}>
          <Text style={[st.badgeText, { color: p.popularBadgeText }]}>
            Most popular
          </Text>
        </View>
      ) : null}
      <Text style={[st.name, { color: t.text }]}>{plan.name}</Text>
      {plan.description ? (
        <Text style={[st.desc, { color: t.textSub }]}>{plan.description}</Text>
      ) : null}
      <PriceWell plan={plan} t={t} p={p} />
      <Extras plan={plan} t={t} p={p} />
      <Features plan={plan} t={t} p={p} />
      <Cta {...props} />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  badgeText: { fontFamily: F.sans700, fontSize: 10.5, letterSpacing: 0.4 },
  name: { fontFamily: F.display900, fontSize: 21, letterSpacing: -0.3 },
  desc: {
    fontFamily: F.sans400,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  priceWell: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontFamily: F.display900, fontSize: 28, letterSpacing: -0.6 },
  period: { fontFamily: F.sans500, fontSize: 14 },
  unavailable: { fontFamily: F.sans600, fontSize: 14 },
  equiv: { fontFamily: F.sans500, fontSize: 12.5, marginTop: 4 },
  extras: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  extraRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  extraText: { flex: 1, fontFamily: F.sans600, fontSize: 13, lineHeight: 18 },
  more: {
    fontFamily: F.sans600,
    fontSize: 13,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  features: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  tick: { marginTop: 2 },
  featureText: {
    flex: 1,
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 19,
  },
  cta: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutline: { borderWidth: 1 },
  ctaText: { fontFamily: F.sans700, fontSize: 15 },
});
