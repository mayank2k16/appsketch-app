import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  type DiscountOffer,
  offerLabel,
  useDiscountOffers,
  useMoney,
} from '@/api/app-cart';
import { type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';

/** Build codes first (this is the builds planner), then whole-order and
 *  domain codes; an assigned code wins a tie. */
const RANK: Record<string, number> = { build: 0, order: 1, domain: 2 };

/** " (up to ₹500)" / " (up to $6)" for a capped percent code; `money` is
 *  useMoney's (the cap is in rupees). */
export function capOf(
  o: DiscountOffer,
  money: (amountInr: number) => string
): string {
  if (o.type !== 'percent' || !o.max_discount_inr) return '';
  return ` (up to ${money(o.max_discount_inr)})`;
}

export function pickOffer(
  list: DiscountOffer[],
  only?: string[]
): DiscountOffer | null {
  const rank = (o: DiscountOffer) =>
    only ? only.indexOf(o.applies_to) : (RANK[o.applies_to] ?? 9);
  return (
    [...list]
      .filter((o) => !only || only.includes(o.applies_to))
      .sort((a, b) => rank(a) - rank(b) || +b.assigned - +a.assigned)[0] ?? null
  );
}

/**
 * A slim "BUILD20 · 20% off your app builds" strip at the top of the assisted
 * planner when there are offers. Tapping it adds nothing to the cart — it
 * only pre-fills the code in the cart store, so the cart opens with it
 * applied. Hidden while loading, on error and without offers.
 */
export function OfferStrip({
  s,
  only,
}: {
  s: ServicesPalette;
  /** Only these targets, in this order of preference (e.g. the Domain tab). */
  only?: string[];
}) {
  const offers = useDiscountOffers();
  const code = useAppCart((c) => c.discountCode);
  const setCode = useAppCart((c) => c.setDiscountCode);
  const { money } = useMoney();
  const o = pickOffer(offers.data ?? [], only);
  if (!o) return null;
  const saved = code === o.code.toUpperCase();
  return (
    <PressableScale
      onPress={() => {
        if (saved) return;
        haptic.select();
        setCode(o.code);
      }}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={
        saved
          ? `${o.code} saved for checkout`
          : `Use code ${o.code}, ${offerLabel(o, money)}`
      }
      style={[
        st.strip,
        {
          backgroundColor: saved ? tint(s.success, 0.08) : tint(s.orange, 0.07),
          borderColor: saved ? tint(s.success, 0.3) : tint(s.orange, 0.28),
        },
      ]}
    >
      <Ionicons
        name={saved ? 'checkmark-circle' : 'pricetag'}
        size={13}
        color={saved ? s.success : s.orange}
      />
      <Text style={[st.text, { color: s.text }]} numberOfLines={1}>
        <Text style={st.code}>{o.code}</Text>
        {` · ${offerLabel(o, money)}`}
      </Text>
      <View style={st.end}>
        <Text
          style={[st.action, { color: saved ? s.success : s.orange }]}
          numberOfLines={1}
        >
          {saved ? 'Saved' : 'Use code'}
        </Text>
      </View>
    </PressableScale>
  );
}

const st = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  text: { flex: 1, fontFamily: F.sans500, fontSize: 12.5 },
  code: { fontFamily: F.sans700, letterSpacing: 0.4 },
  end: { flexShrink: 0 },
  action: { fontFamily: F.sans700, fontSize: 12 },
});
