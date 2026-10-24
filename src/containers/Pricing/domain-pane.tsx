import * as React from 'react';
import { StyleSheet, Text, type TextInput, View } from 'react-native';

import { useDiscountOffers, useMoney } from '@/api/app-cart';
import { type ServicesPalette } from '@/components/services';
import { F } from '@/lib/fonts';

import { DomainCard } from './domain-card';
import { capOf, OfferStrip, pickOffer } from './planner/offer-strip';

/** What a domain order is: a name, a subscription with it (the backend
 *  refuses a domain without an active plan) and a discount code. */
function useSteps(): string[] {
  const offers = useDiscountOffers();
  const { money } = useMoney();
  const o = pickOffer(offers.data ?? [], ['domain', 'order']);
  const off = o
    ? o.type === 'percent'
      ? `${o.value}% off${capOf(o, money)}`
      : `${money(o.value)} off`
    : null;
  return [
    'Search and pick a name',
    'Add any plan: every domain comes with a subscription',
    o && off
      ? `Use ${o.code} at checkout: ${off}`
      : 'Apply a discount code at checkout',
  ];
}

function Step({
  s,
  n,
  label,
}: {
  s: ServicesPalette;
  n: number;
  label: string;
}) {
  return (
    <View style={st.step}>
      <View style={[st.num, { backgroundColor: s.ink }]}>
        <Text style={[st.numText, { color: s.onInk }]}>{n}</Text>
      </View>
      <Text style={[st.stepText, { color: s.text }]}>{label}</Text>
    </View>
  );
}

/** The Domain folder tab: how a domain order works, the best domain (or
 *  whole-order) offer, then the search. Paid in the cart, where the plan
 *  step and the discount code already live. */
export function DomainPane({
  s,
  inputRef,
}: {
  s: ServicesPalette;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const steps = useSteps();
  return (
    <View style={st.pane}>
      <Text style={[st.lead, { color: s.sub }]}>
        Your app live on your own domain in minutes, HTTPS included.
      </Text>
      <View style={st.steps}>
        {steps.map((label, i) => (
          <Step key={label} s={s} n={i + 1} label={label} />
        ))}
      </View>
      <OfferStrip s={s} only={['domain', 'order']} />
      <DomainCard s={s} inputRef={inputRef} bare />
    </View>
  );
}

const st = StyleSheet.create({
  pane: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 14,
  },
  lead: { fontFamily: F.sans500, fontSize: 14, lineHeight: 19 },
  steps: { gap: 9 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: F.sans800, fontSize: 12 },
  stepText: { flex: 1, fontFamily: F.sans600, fontSize: 13.5, lineHeight: 18 },
});
