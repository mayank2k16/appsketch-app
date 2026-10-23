import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type DiscountOffer,
  offerLabel,
  useDiscountOffers,
} from '@/api/app-cart';
import { type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';

import { useCartDiscount } from './use-cart-totals';

function OfferChip({
  s,
  o,
  on,
  ok,
  onPress,
}: {
  s: ServicesPalette;
  o: DiscountOffer;
  on: boolean;
  /** The applied code validated (green); applied but not valid = ink. */
  ok: boolean;
  onPress: () => void;
}) {
  const green = on && ok;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${o.assigned ? 'Your offer, ' : ''}${o.code}, ${offerLabel(o)}`}
      style={[
        st.chip,
        {
          backgroundColor: green ? tint(s.success, 0.1) : s.raised,
          borderColor: green ? tint(s.success, 0.4) : on ? s.ink : s.hairline,
        },
      ]}
    >
      <Ionicons
        name={green ? 'checkmark-circle' : 'pricetag-outline'}
        size={13}
        color={green ? s.success : s.orange}
      />
      <Text style={[st.code, { color: green ? s.success : s.text }]}>
        {o.code}
      </Text>
      <Text style={[st.label, { color: s.sub }]} numberOfLines={1}>
        {offerLabel(o)}
      </Text>
      {o.assigned ? (
        <View style={[st.badge, { backgroundColor: tint(s.orange, 0.12) }]}>
          <Text style={[st.badgeText, { color: s.orange }]}>Your offer</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/** "Offers for you": public codes plus codes assigned to this user (badged
 *  "Your offer"), from `GET account/discounts/offers/?channel=app`. Tap to
 *  apply (tap the applied one again to remove). Hidden while loading, on
 *  error and when there are none. Plan codes never show (App Store rule). */
export function OffersRow({ s }: { s: ServicesPalette }) {
  const offers = useDiscountOffers();
  const code = useAppCart((c) => c.discountCode);
  const setCode = useAppCart((c) => c.setDiscountCode);
  const ok = !!useCartDiscount().result?.valid;
  const list = offers.data ?? [];
  if (!list.length) return null;
  // Assigned first: they are the reason this row exists for most people.
  // The order is fixed (not by the applied code) so chips never jump.
  const sorted = [...list].sort((a, b) => +b.assigned - +a.assigned);
  return (
    <View style={st.wrap}>
      <Text style={[st.title, { color: s.muted }]}>Offers for you</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.chips}
        keyboardShouldPersistTaps="handled"
      >
        {sorted.map((o) => {
          const on = code === o.code.toUpperCase();
          return (
            <OfferChip
              key={o.code}
              s={s}
              o={o}
              on={on}
              ok={ok}
              onPress={() => {
                haptic.select();
                setCode(on ? null : o.code);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginBottom: 4 },
  title: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  chips: { gap: 6, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 9,
    paddingRight: 10,
    maxWidth: 300,
  },
  code: { fontFamily: F.sans700, fontSize: 12, letterSpacing: 0.4 },
  label: { fontFamily: F.sans500, fontSize: 12, flexShrink: 1 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    height: 18,
    justifyContent: 'center',
    marginLeft: 1,
  },
  badgeText: { fontFamily: F.sans700, fontSize: 10 },
});
