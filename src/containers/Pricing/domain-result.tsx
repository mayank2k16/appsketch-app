import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DomainSearchResult } from '@/api/app-domains';
import { inr, type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';
import { toast } from '@/lib/toast';

function YearChips({
  s,
  r,
  years,
  onPick,
}: {
  s: ServicesPalette;
  r: DomainSearchResult;
  years: number;
  onPick: (y: number) => void;
}) {
  if (r.years.length < 2) return null;
  return (
    <View style={st.chips}>
      {r.years.slice(0, 5).map((y) => {
        const on = y.years === years;
        return (
          <PressableScale
            key={y.years}
            onPress={() => onPick(y.years)}
            haptic={on ? false : 'select'}
            style={[st.chip, { backgroundColor: on ? s.ink : s.inset }]}
          >
            <Text style={[st.chipText, { color: on ? s.onInk : s.text }]}>
              {y.years} yr
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function useAdd(r: DomainSearchResult, years: number) {
  const router = useRouter();
  const inCart = useAppCart((c) => c.domain?.name === r.domain);
  const setDomain = useAppCart((c) => c.setDomain);
  const price =
    r.years.find((y) => y.years === years)?.price_inr ?? r.price_inr ?? 0;
  const add = () => {
    if (inCart) return router.push('/cart');
    const had = useAppCart.getState().domain;
    setDomain({
      name: r.domain,
      years,
      price_inr: price,
      tenant_id: null,
      options: r.years,
    });
    haptic.success();
    toast.success(
      had ? `Swapped for ${r.domain}` : `${r.domain} added to cart`
    );
  };
  return { inCart, price, add };
}

/** One search result: name, Available/Taken, price for the chosen years. */
export function DomainResult({
  s,
  r,
}: {
  s: ServicesPalette;
  r: DomainSearchResult;
}) {
  const [years, setYears] = React.useState(r.years[0]?.years ?? 1);
  const { inCart, price, add } = useAdd(r, years);
  const ok = r.available && price > 0;
  const tone = r.available ? s.success : s.muted;
  return (
    <View style={[st.row, { borderColor: s.hairline }]}>
      <View style={st.top}>
        <Text style={[st.name, { color: s.text }]} numberOfLines={1}>
          {r.domain}
        </Text>
        <View
          style={[
            st.badge,
            { backgroundColor: tint(r.available ? s.success : '#9C9DA3', 0.1) },
          ]}
        >
          <Text style={[st.badgeText, { color: tone }]}>
            {r.available ? (r.premium ? 'Premium' : 'Available') : 'Taken'}
          </Text>
        </View>
      </View>
      {ok ? (
        <View style={st.bottom}>
          <Text style={[st.price, { color: s.text }]}>
            {inr(price)}
            <Text style={[st.per, { color: s.muted }]}> / {years} yr</Text>
          </Text>
          <PressableScale
            onPress={add}
            style={[st.add, { backgroundColor: inCart ? s.inset : s.ink }]}
            accessibilityLabel={
              inCart ? 'View cart' : `Add ${r.domain} to cart`
            }
          >
            <Text style={[st.addText, { color: inCart ? s.text : s.onInk }]}>
              {inCart ? 'In cart ✓' : 'Add to cart'}
            </Text>
          </PressableScale>
        </View>
      ) : null}
      {ok ? <YearChips s={s} r={r} years={years} onPick={setYears} /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: F.sans700, fontSize: 14 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontFamily: F.sans700, fontSize: 10.5 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontFamily: F.sans600, fontSize: 14 },
  per: { fontFamily: F.sans500, fontSize: 11 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 7,
    height: 26,
    justifyContent: 'center',
  },
  chipText: { fontFamily: F.sans600, fontSize: 11 },
  add: {
    borderRadius: 10,
    paddingHorizontal: 11,
    height: 30,
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  addText: { fontFamily: F.sans700, fontSize: 12 },
});
