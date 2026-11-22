import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { StoreIcon } from '@/containers/AppCart/plan-step';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { buyPlan, storeName, useIapStore } from '@/lib/iap';
import { useAppCart } from '@/lib/store/app-cart-store';
import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { sameTier, usePricingPick } from './pricing-pick';
import { type PlanView, usePricing } from './use-pricing';

/** Scroll room the bar needs under the plans. */
export const PAY_BAR_SPACE = 96;

const ORANGE = '#EB4709';

/** "₹14,999.00" → "₹14,999". */
const trimZeros = (price: string) => price.replace(/[.,]00(?=\D*$)/, '');

/** The plan the folder card is showing: the pick, else the user's / the
 *  popular / the first paid plan (the card's own fallback). */
function usePickedView(): PlanView | null {
  const tier = usePricingPick((x) => x.tier);
  const cycle = usePricingPick((x) => x.cycle);
  const { views } = usePricing(cycle);
  const paid = views.filter((v) => !v.free);
  return (
    paid.find((v) => sameTier(v.tier, tier)) ??
    paid.find((v) => v.current) ??
    paid.find((v) => v.popular) ??
    paid[0] ??
    null
  );
}

/** What Pay now does: sign in first, then the store's purchase sheet. */
function usePay(view: PlanView | null) {
  const router = useRouter();
  const cycle = usePricingPick((x) => x.cycle);
  const busySku = useIapStore((x) => x.busySku);
  const busy = !!view?.sku && busySku === view.sku;
  // Another plan's purchase is in flight: wait, like the Subscribe buttons.
  const locked = !!busySku && !busy;
  const ready = !!view?.sku && !!view.price;
  const pay = () => {
    if (!view) return;
    if (useAuth.getState().status !== 'signIn') {
      router.push({ pathname: '/welcome', params: { return: '1' } } as never);
      return;
    }
    if (!ready) {
      toast.info(`${storeName()} purchases are not available right now.`);
      return;
    }
    void buyPlan(view.tier, cycle);
  };
  // "Basic · ₹14,999/year" — the period already says which cycle.
  const line = view
    ? view.price
      ? `${view.name} · ${trimZeros(view.price)}${view.period}`
      : `${view.name} · ${cycle === 'yearly' ? 'Yearly' : 'Monthly'}`
    : 'Pick a plan';
  return { pay, busy: busy || locked, ready: ready && !locked, line };
}

function Thumb({ uri }: { uri?: string | null }) {
  return uri ? (
    <Image
      source={{ uri }}
      contentFit="cover"
      contentPosition="top"
      style={st.thumb}
    />
  ) : (
    <View style={[st.thumb, st.thumbEmpty]}>
      <Ionicons name="sparkles" size={16} color="#FFF" />
    </View>
  );
}

function PayButton({
  busy,
  ready,
  line,
  onPress,
}: {
  busy: boolean;
  ready: boolean;
  line: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      haptic="press"
      onPress={onPress}
      disabled={busy}
      disabledOpacity={1}
      accessibilityLabel={`Pay now: ${line}`}
      style={[st.pay, !ready && st.payOff]}
    >
      {busy ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          <StoreIcon color="#FFFFFF" />
          <Text style={st.payText}>Pay now</Text>
        </>
      )}
    </PressableScale>
  );
}

/**
 * Floats over the Pricing tab while a template bought with "Buy plan" waits
 * for its plan: the template, the picked plan and cycle (Basic, yearly by
 * default), and Pay now — the App Store subscription on iOS, Google Play on
 * Android (`buyPlan` picks the store). Once the plan is active the template
 * opens in the builder (useContinueTemplateBuy on the Pricing screen).
 */
export function PayNowBar({ t, bottom }: { t: AppColors; bottom: number }) {
  const buy = useAppCart((c) => c.templateBuy);
  const setTemplateBuy = useAppCart((c) => c.setTemplateBuy);
  const { pay, busy, ready, line } = usePay(usePickedView());
  if (!buy) return null;
  return (
    <View pointerEvents="box-none" style={[st.wrap, { bottom }]}>
      <View style={[st.bar, { backgroundColor: t.text, shadowColor: '#000' }]}>
        <Thumb uri={buy.thumb} />
        <View style={st.text}>
          <Text style={[st.title, { color: t.bg }]} numberOfLines={1}>
            {buy.title}
          </Text>
          <Text style={[st.sub, { color: t.bg }]} numberOfLines={1}>
            {line}
          </Text>
        </View>
        <PressableScale
          onPress={() => setTemplateBuy(null)}
          hitSlop={8}
          accessibilityLabel="Cancel buying this template"
          style={st.close}
        >
          <Ionicons name="close" size={15} color={t.bg} style={st.dim} />
        </PressableScale>
        <PayButton busy={busy} ready={ready} line={line} onPress={pay} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingLeft: 8,
    borderRadius: 22,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  thumb: { width: 44, height: 44, borderRadius: 12 },
  thumbEmpty: {
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: F.sans700, fontSize: 14 },
  sub: { fontFamily: F.sans500, fontSize: 12, opacity: 0.72, marginTop: 1 },
  close: { padding: 4 },
  dim: { opacity: 0.6 },
  pay: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  payOff: { opacity: 0.55 },
  payText: { fontFamily: F.sans800, fontSize: 14.5, color: '#FFFFFF' },
});
