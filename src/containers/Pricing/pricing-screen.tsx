import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { GradientText } from '@/components/ui/GradientText';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { buyPlan, isIos, type PlanInterval, useIapStore } from '@/lib/iap';
import { type AppColors, useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { BillingToggle } from './billing-toggle';
import { PlanCard } from './plan-card';
import { PlanSkeleton } from './plan-skeleton';
import { CurrentPlan, StoreUnavailable } from './status-notes';
import { StoreFooter } from './store-footer';
import { type PricingPalette, pricingPalette } from './theme';
import { type PlanView, usePricing } from './use-pricing';

/** Android keeps the pre-IAP behaviour (plans are bought on the web). iOS
 *  never reaches this — digital plans there are App Store only (3.1.1). */
const ANDROID_PRICING_URL = 'https://appsketch.ai/pricing';

function Hero({ t, p }: { t: AppColors; p: PricingPalette }) {
  return (
    <View style={st.hero}>
      <Text style={[st.eyebrow, { color: p.eyebrow }]}>AppSketch plans</Text>
      <Text style={[st.title, { color: t.text }]}>Build more with</Text>
      <GradientText style={st.title} colors={p.titleColors}>
        the right plan
      </GradientText>
      <Text style={[st.sub, { color: t.textSub }]}>
        More AI, more apps, more room to grow. Switch plans or cancel anytime.
      </Text>
    </View>
  );
}

function usePlanPress(cycle: PlanInterval) {
  const router = useRouter();
  const status = useAuth.use.status();
  return React.useCallback(
    (plan: PlanView) => {
      if (status !== 'signIn') {
        toast.info('Sign in to choose a plan');
        router.push({ pathname: '/welcome', params: { return: '1' } });
        return;
      }
      if (isIos()) void buyPlan(plan.tier, cycle);
      else Linking.openURL(ANDROID_PRICING_URL).catch(() => {});
    },
    [cycle, router, status]
  );
}

function PlanList({
  t,
  p,
  cycle,
}: {
  t: AppColors;
  p: PricingPalette;
  cycle: PlanInterval;
}) {
  const data = usePricing(cycle);
  const busySku = useIapStore((s) => s.busySku);
  const onPress = usePlanPress(cycle);
  if (data.isLoading) {
    return (
      <View style={st.list}>
        {[0, 1, 2].map((i) => (
          <PlanSkeleton key={i} t={t} p={p} />
        ))}
      </View>
    );
  }
  if (data.isError) {
    return (
      <Text
        style={[st.error, { color: p.error }]}
        onPress={() => void data.refetch()}
      >
        Couldn&apos;t load the plans. Tap to try again.
      </Text>
    );
  }
  return (
    <View style={st.list}>
      {isIos() && data.storeStatus === 'unavailable' ? (
        <StoreUnavailable t={t} p={p} />
      ) : null}
      {data.views.map((plan) => (
        <PlanCard
          key={plan.tier}
          plan={plan}
          t={t}
          p={p}
          ctaLabel={isIos() ? 'Subscribe' : 'Get the plan'}
          busy={!!plan.sku && busySku === plan.sku}
          locked={!!busySku}
          onSubscribe={() => onPress(plan)}
        />
      ))}
    </View>
  );
}

/** The Pricing tab: hero, current plan, Monthly/Yearly, the plan cards and —
 *  on iOS — StoreKit subscriptions with Restore and the 3.1.2 disclosures. */
export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const tabBarH = useTabBarHeight();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const p = pricingPalette(t);
  const [cycle, setCycle] = React.useState<PlanInterval>('yearly');
  const signedIn = useAuth.use.status() === 'signIn';
  const { saving, activePlanName } = usePricing(cycle);
  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingBottom: tabBarH + 28,
        }}
      >
        <Hero t={t} p={p} />
        {signedIn && activePlanName ? (
          <View style={st.pad}>
            <CurrentPlan t={t} p={p} name={activePlanName} manage={isIos()} />
          </View>
        ) : null}
        <View style={st.toggle}>
          <BillingToggle
            p={p}
            sub={t.textSub}
            value={cycle}
            saving={saving}
            onChange={setCycle}
          />
        </View>
        <PlanList t={t} p={p} cycle={cycle} />
        {isIos() ? <StoreFooter t={t} p={p} signedIn={signedIn} /> : null}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  eyebrow: {
    fontFamily: F.sans600,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: F.display900,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.9,
  },
  sub: { fontFamily: F.sans400, fontSize: 14, lineHeight: 20, marginTop: 10 },
  pad: { paddingHorizontal: 16, paddingBottom: 4 },
  toggle: { paddingTop: 18, paddingBottom: 22 },
  list: { paddingHorizontal: 16, gap: 16 },
  error: {
    fontFamily: F.sans600,
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
});
