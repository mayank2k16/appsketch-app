import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { usePricing } from '@/containers/Pricing/use-pricing';
import { useCloneAndOpen } from '@/containers/TemplateProduct/use-use-template';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { appleProductId, isIos, useIapStore } from '@/lib/iap';
import { type TemplateBuy, useAppCart } from '@/lib/store/app-cart-store';

import { useSubscribe } from './plan-step';
import { hasPaidPlan } from './use-cart-totals';

/** "Buy now" sells a template with the Basic plan, billed yearly. */
const TIER = 'basic';
const CYCLE = 'yearly' as const;

/** "₹4,999.00" → "₹4,999". */
const trimZeros = (price: string) => price.replace(/[.,]00(?=\D*$)/, '');

/**
 * Once the plan is active (the Apple purchase verified, or the user was
 * already paid), the bought template is copied and the builder opens in
 * place of the cart — the user carries on with their app, not Home.
 */
export function useContinueTemplateBuy() {
  const buy = useAppCart((c) => c.templateBuy);
  const setTemplateBuy = useAppCart((c) => c.setTemplateBuy);
  const paid = hasPaidPlan(getUserSubscription(useAuth.use.user()));
  const { copy, usingKey } = useCloneAndOpen({ replace: true });
  const started = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!buy || !paid || started.current === buy.key) return;
    started.current = buy.key;
    setTemplateBuy(null);
    copy(buy);
  }, [buy, paid, copy, setTemplateBuy]);
  return { copying: !!usingKey };
}

function Head({ s, buy }: { s: ServicesPalette; buy: TemplateBuy }) {
  const what = buy.ecosystem ? 'Ecosystem' : buy.mobile ? 'App' : 'Website';
  return (
    <View style={st.head}>
      {buy.thumb ? (
        <Image
          source={{ uri: buy.thumb }}
          contentFit="cover"
          contentPosition="top"
          style={[st.thumb, { borderColor: s.hairline }]}
        />
      ) : (
        <View style={[st.thumb, { backgroundColor: s.inset }]} />
      )}
      <View style={st.headBody}>
        <Text style={[st.kind, { color: s.muted }]}>{what} template</Text>
        <Text style={[st.name, { color: s.text }]} numberOfLines={2}>
          {buy.title}
        </Text>
      </View>
    </View>
  );
}

function PlanLine({ s }: { s: ServicesPalette }) {
  const data = usePricing(CYCLE);
  const v = data.views.find((x) => x.tier === TIER);
  const monthly = v?.monthlyEquivalent ?? '₹1,250';
  return (
    <View style={[st.plan, { backgroundColor: s.inset }]}>
      <View style={st.planBody}>
        <Text style={[st.planName, { color: s.text }]}>
          {v?.name ?? 'Basic'} plan · yearly
        </Text>
        <Text style={[st.planSub, { color: s.sub }]}>
          {v?.price
            ? `${trimZeros(v.price)}${v.period}, cancel anytime`
            : 'Billed yearly, cancel anytime'}
        </Text>
      </View>
      <Text style={[st.planPrice, { color: s.text }]}>
        {trimZeros(monthly)}
        <Text style={[st.planPer, { color: s.muted }]}>/month</Text>
      </Text>
    </View>
  );
}

function BuyButton({ s }: { s: ServicesPalette }) {
  const data = usePricing(CYCLE);
  const v = data.views.find((x) => x.tier === TIER);
  const subscribe = useSubscribe();
  const busySku = useIapStore((x) => x.busySku);
  const busy = busySku === appleProductId(TIER, CYCLE);
  const ready = !!v?.price;
  return (
    <PressableScale
      onPress={() => v && subscribe(v, CYCLE)}
      disabled={busy || !ready}
      disabledOpacity={busy ? 1 : 0.5}
      style={[st.cta, { backgroundColor: s.ink }]}
      accessibilityLabel="Buy now"
    >
      {busy || data.isLoading ? (
        <ActivityIndicator color={s.onInk} />
      ) : (
        <>
          {isIos() ? (
            <Ionicons name="logo-apple" size={17} color={s.onInk} />
          ) : null}
          <Text style={[st.ctaText, { color: s.onInk }]} numberOfLines={1}>
            {isIos() ? 'Buy now with Apple' : 'Buy on appsketch.ai'}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

/** The template bought with "Buy now", with its plan and the buy button. */
export function TemplateBuyCard({ s }: { s: ServicesPalette }) {
  const buy = useAppCart((c) => c.templateBuy);
  const setTemplateBuy = useAppCart((c) => c.setTemplateBuy);
  const { copying } = useContinueTemplateBuy();
  if (copying)
    return (
      <View
        style={[
          st.card,
          { backgroundColor: s.raised, borderColor: s.hairline },
        ]}
      >
        <ActivityIndicator color={s.orange} />
      </View>
    );
  if (!buy) return null;
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Head s={s} buy={buy} />
      <PlanLine s={s} />
      <View style={[st.note, { backgroundColor: tint(s.success, 0.08) }]}>
        <Ionicons name="sparkles" size={14} color={s.success} />
        <Text style={[st.noteText, { color: s.text }]}>
          After you pay, it opens in the builder as your own copy.
        </Text>
      </View>
      <BuyButton s={s} />
      <Text style={[st.fine, { color: s.muted }]}>
        {isIos()
          ? 'Billed by the App Store, cancel anytime in Settings.'
          : 'Plans are bought on appsketch.ai.'}
      </Text>
      <PressableScale onPress={() => setTemplateBuy(null)} hitSlop={6}>
        <Text style={[st.remove, { color: s.sub }]}>Remove</Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 14, borderWidth: 1 },
  headBody: { flex: 1, gap: 2 },
  kind: { fontFamily: F.sans600, fontSize: 11.5, letterSpacing: 0.3 },
  name: { fontFamily: F.sans700, fontSize: 16 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  planBody: { flex: 1, gap: 2 },
  planName: { fontFamily: F.sans700, fontSize: 14 },
  planSub: { fontFamily: F.sans400, fontSize: 12 },
  planPrice: { fontFamily: F.sans800, fontSize: 18, letterSpacing: -0.3 },
  planPer: { fontFamily: F.sans500, fontSize: 12 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  noteText: { flex: 1, fontFamily: F.sans500, fontSize: 12.5 },
  cta: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: F.sans700, fontSize: 15 },
  fine: {
    fontFamily: F.sans400,
    fontSize: 11,
    textAlign: 'center',
    marginTop: -4,
  },
  remove: { fontFamily: F.sans600, fontSize: 12.5, textAlign: 'center' },
});
