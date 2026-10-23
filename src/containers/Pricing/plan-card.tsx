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

function Price({ plan, t }: Pick<Props, 'plan' | 't'>) {
  if (plan.free) return <Text style={[st.price, { color: t.text }]}>Free</Text>;
  if (!plan.price)
    return (
      <Text style={[st.unavailable, { color: t.textSub }]}>
        Not available right now
      </Text>
    );
  return (
    <View style={st.priceCol}>
      <Text style={[st.price, { color: t.text }]}>
        {plan.price}
        <Text style={[st.period, { color: t.textSub }]}>{plan.period}</Text>
      </Text>
      {plan.monthlyEquivalent ? (
        <Text style={[st.equiv, { color: t.textSub }]}>
          {plan.monthlyEquivalent}/mo, billed yearly
        </Text>
      ) : null}
    </View>
  );
}

/** Features fold to a few lines (one dot-separated paragraph); tap to open. */
function Features({ plan, t }: Pick<Props, 'plan' | 't'>) {
  const [open, setOpen] = React.useState(false);
  const lead = [
    plan.credits,
    plan.models.length ? `AI: ${plan.models.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (!lead && !plan.features.length) return null;
  return (
    <Text
      onPress={() => setOpen((o) => !o)}
      numberOfLines={open ? undefined : 3}
      accessibilityRole="button"
      accessibilityHint={
        open ? 'Collapses the features' : 'Shows every feature'
      }
      style={[st.features, { color: t.textSub }]}
    >
      {lead ? <Text style={[st.lead, { color: t.text }]}>{lead}</Text> : null}
      {lead && plan.features.length ? '  ·  ' : ''}
      {plan.features.join('  ·  ')}
    </Text>
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

/** One plan, compact: name + description beside the App Store price, the
 *  features folded to three lines, and Subscribe. The highlighted plan
 *  (Growth) gets the ink border, the "Most popular" tab and the orange CTA. */
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
      <View style={st.head}>
        <View style={st.headText}>
          <View style={st.nameRow}>
            <Text style={[st.name, { color: t.text }]}>{plan.name}</Text>
            {plan.popular ? (
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
      <Features plan={plan} t={t} />
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
  features: { fontFamily: F.sans400, fontSize: 12, lineHeight: 17 },
  lead: { fontFamily: F.sans600 },
  cta: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutline: { borderWidth: 1 },
  ctaText: { fontFamily: F.sans700, fontSize: 14 },
});
