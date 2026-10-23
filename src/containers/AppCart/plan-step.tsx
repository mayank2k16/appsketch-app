import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { type PlanView, usePricing } from '@/containers/Pricing/use-pricing';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import {
  appleProductId,
  buyPlan,
  isIos,
  type PlanInterval,
  reloadProducts,
  useIapStore,
} from '@/lib/iap';
import { useAppCart } from '@/lib/store/app-cart-store';
import { toast } from '@/lib/toast';

import { hasPaidPlan, useNeedsPlan } from './use-cart-totals';

/** Android keeps buying plans on the web (as the Pricing tab does). */
const WEB_PRICING = 'https://appsketch.ai/pricing';

/** "₹4,999.00" → "₹4,999" (whole-unit prices read cleaner in tiles). */
const trimZeros = (price: string) => price.replace(/[.,]00(?=\D*$)/, '');

const CYCLES: { key: PlanInterval; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function CycleToggle({
  s,
  value,
  onChange,
}: {
  s: ServicesPalette;
  value: PlanInterval;
  onChange: (v: PlanInterval) => void;
}) {
  return (
    <View style={[st.seg, { backgroundColor: s.inset }]}>
      {CYCLES.map((c) => {
        const on = c.key === value;
        return (
          <PressableScale
            key={c.key}
            haptic={on ? false : 'select'}
            onPress={() => onChange(c.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[st.segOpt, on && { backgroundColor: s.ink }]}
          >
            <Text style={[st.segText, { color: on ? s.onInk : s.sub }]}>
              {c.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Tier({
  s,
  v,
  on,
  onPress,
}: {
  s: ServicesPalette;
  v: PlanView;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic={on ? false : 'select'}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${v.name}${v.price ? `, ${v.price}${v.period}` : ''}`}
      style={[
        st.tier,
        {
          backgroundColor: s.raised,
          borderColor: on ? s.ink : s.hairline,
          borderWidth: on ? 1.5 : 1,
        },
      ]}
    >
      <Text style={[st.tierName, { color: s.text }]} numberOfLines={1}>
        {v.name}
      </Text>
      <Text
        style={[st.tierPrice, { color: s.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {v.price ? trimZeros(v.price) : '—'}
      </Text>
      <Text style={[st.tierPeriod, { color: s.muted }]}>
        {v.period.replace('/', 'per ')}
      </Text>
    </PressableScale>
  );
}

function useSubscribe() {
  const router = useRouter();
  const status = useAuth.use.status();
  return (v: PlanView, cycle: PlanInterval) => {
    if (status !== 'signIn') {
      toast.info('Sign in to choose a plan');
      router.push({ pathname: '/welcome', params: { return: '1' } });
      return;
    }
    if (isIos()) void buyPlan(v.tier, cycle);
    else Linking.openURL(WEB_PRICING).catch(() => {});
  };
}

function Unavailable({
  s,
  onRetry,
}: {
  s: ServicesPalette;
  onRetry: () => void;
}) {
  return (
    <View style={[st.note, { backgroundColor: s.inset }]}>
      <Text style={[st.noteText, { color: s.sub }]}>
        Plans aren&apos;t available right now.
      </Text>
      <PressableScale onPress={onRetry} hitSlop={6}>
        <Text style={[st.noteAction, { color: s.text }]}>Try again</Text>
      </PressableScale>
    </View>
  );
}

function SubscribeButton({
  s,
  picked,
  cycle,
}: {
  s: ServicesPalette;
  picked: PlanView;
  cycle: PlanInterval;
}) {
  const busySku = useIapStore((x) => x.busySku);
  const subscribe = useSubscribe();
  const busy = busySku === appleProductId(picked.tier, cycle);
  return (
    <>
      <PressableScale
        onPress={() => subscribe(picked, cycle)}
        disabled={busy || !picked.price}
        disabledOpacity={busy ? 1 : 0.5}
        style={[st.cta, { backgroundColor: s.ink }]}
        accessibilityLabel={`Subscribe to ${picked.name}`}
      >
        {busy ? (
          <ActivityIndicator color={s.onInk} />
        ) : (
          <>
            {isIos() ? (
              <Ionicons name="logo-apple" size={17} color={s.onInk} />
            ) : null}
            <Text
              style={[st.ctaText, { color: s.onInk }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {isIos() ? 'Subscribe with Apple' : 'Choose on appsketch.ai'}
              {picked.price
                ? ` · ${trimZeros(picked.price)}${picked.period}`
                : ''}
            </Text>
          </>
        )}
      </PressableScale>
      <Text style={[st.fine, { color: s.muted }]}>
        {isIos()
          ? 'Billed by the App Store, cancel anytime in Settings. The domain is paid below.'
          : 'Plans are bought on appsketch.ai. The domain is paid below.'}
      </Text>
    </>
  );
}

function Picker({
  s,
  cycle,
  setCycle,
}: {
  s: ServicesPalette;
  cycle: PlanInterval;
  setCycle: (c: PlanInterval) => void;
}) {
  const data = usePricing(cycle);
  // Paid tiers, smallest first (the website's order); three is plenty here.
  const tiers = data.views.filter((v) => !v.free).slice(0, 3);
  const [tier, setTier] = React.useState<string | null>(null);
  const picked = tiers.find((v) => v.tier === tier) ?? tiers[0];
  if (data.isLoading || (isIos() && data.storeStatus === 'connecting'))
    return <ActivityIndicator color={s.orange} style={st.loading} />;
  const unavailable =
    isIos() && data.storeStatus === 'unavailable' && !picked?.price;
  if (!picked || unavailable)
    return (
      <Unavailable
        s={s}
        onRetry={() => void (data.isError ? data.refetch() : reloadProducts())}
      />
    );
  return (
    <>
      <CycleToggle s={s} value={cycle} onChange={setCycle} />
      <View style={st.tiers}>
        {tiers.map((v) => (
          <Tier
            key={v.tier}
            s={s}
            v={v}
            on={v.tier === picked.tier}
            onPress={() => setTier(v.tier)}
          />
        ))}
      </View>
      <SubscribeButton s={s} picked={picked} cycle={cycle} />
    </>
  );
}

function Active({ s, cycle }: { s: ServicesPalette; cycle: PlanInterval }) {
  const sub = getUserSubscription(useAuth.use.user());
  const name = (sub?.plan?.display_name || sub?.plan?.tier || 'Plan').replace(
    /\s+plan$/i,
    ''
  );
  return (
    <View
      style={[
        st.active,
        {
          backgroundColor: tint(s.success, 0.08),
          borderColor: tint(s.success, 0.3),
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={18} color={s.success} />
      <Text style={[st.activeText, { color: s.text }]} numberOfLines={1}>
        {name} · {cycle === 'yearly' ? 'Yearly' : 'Monthly'} — active
      </Text>
    </View>
  );
}

/**
 * "Your domain comes with a plan": shown above Pay while the cart has a
 * domain and the user has no active paid plan (or checkout answered
 * `plan_required`). Plans are App Store subscriptions (`buyPlan`); once
 * verified the auth subscription turns active and this collapses to
 * "✓ Basic · Monthly — active", which unlocks Pay. Users who already have
 * a plan never see it.
 */
export function PlanStep({ s }: { s: ServicesPalette }) {
  const needs = useNeedsPlan();
  const forced = useAppCart((c) => c.planRequired);
  const setForced = useAppCart((c) => c.setPlanRequired);
  const sub = getUserSubscription(useAuth.use.user());
  const [cycle, setCycle] = React.useState<PlanInterval>('monthly');
  const [engaged, setEngaged] = React.useState(needs);
  const subAtForce = React.useRef(sub);
  React.useEffect(() => {
    if (needs) setEngaged(true);
  }, [needs]);
  // Forced by the server: a fresh activation (the subscription object
  // changes when a purchase verifies) clears it.
  React.useEffect(() => {
    if (!forced) subAtForce.current = sub;
    else if (sub !== subAtForce.current && hasPaidPlan(sub)) setForced(false);
  }, [forced, sub, setForced]);
  // Domain removed (nothing needed, no plan bought): nothing to show.
  if (!engaged || (!needs && !hasPaidPlan(sub))) return null;
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <View style={st.head}>
        <View style={[st.step, { backgroundColor: needs ? s.ink : s.success }]}>
          {needs ? (
            <Text style={[st.stepText, { color: s.onInk }]}>1</Text>
          ) : (
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          )}
        </View>
        <View style={st.headBody}>
          <Text style={[st.title, { color: s.text }]}>
            Your domain comes with a plan
          </Text>
          {needs ? (
            <Text style={[st.sub, { color: s.sub }]}>
              Any plan works — start with the smallest.
            </Text>
          ) : null}
        </View>
      </View>
      {needs ? (
        <Picker s={s} cycle={cycle} setCycle={setCycle} />
      ) : (
        <Active s={s} cycle={cycle} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: F.sans700, fontSize: 12 },
  headBody: { flex: 1 },
  title: { fontFamily: F.sans700, fontSize: 15 },
  sub: { fontFamily: F.sans400, fontSize: 12, lineHeight: 16, marginTop: 1 },
  seg: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 10,
    padding: 3,
  },
  segOpt: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: { fontFamily: F.sans600, fontSize: 12.5 },
  tiers: { flexDirection: 'row', gap: 8 },
  tier: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tierName: { fontFamily: F.sans600, fontSize: 12.5 },
  tierPrice: {
    fontFamily: F.sans700,
    fontSize: 15,
    letterSpacing: -0.2,
    marginTop: 3,
  },
  tierPeriod: { fontFamily: F.sans500, fontSize: 10.5, marginTop: 1 },
  cta: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: F.sans700, fontSize: 14.5, flexShrink: 1 },
  fine: {
    fontFamily: F.sans400,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: -2,
  },
  loading: { paddingVertical: 18 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  noteText: { flex: 1, fontFamily: F.sans500, fontSize: 12.5 },
  noteAction: { fontFamily: F.sans700, fontSize: 12.5 },
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  activeText: { flex: 1, fontFamily: F.sans700, fontSize: 13.5 },
});
