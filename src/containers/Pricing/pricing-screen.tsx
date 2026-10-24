import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  type LayoutChangeEvent,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalogue } from '@/api/app-cart';
import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { type ServicesPalette, servicesPalette } from '@/components/services';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { buyPlan, isIos, type PlanInterval, useIapStore } from '@/lib/iap';
import { type AppColors, useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { BillingToggle } from './billing-toggle';
import { CartButton } from './cart-button';
import { CustomCard } from './custom-card';
import { DomainCard } from './domain-card';
import { PlanCard } from './plan-card';
import { PlanSkeleton } from './plan-skeleton';
import { PlannerCard } from './planner/planner-card';
import { StickySummary } from './planner/summary-bar';
import { usePlanner } from './planner/use-planner';
import { CurrentPlan, StoreUnavailable } from './status-notes';
import { StoreFooter } from './store-footer';
import { type PricingPalette, pricingPalette } from './theme';
import { type PlanView, usePricing } from './use-pricing';

/** Android keeps the pre-IAP behaviour (plans are bought on the web). iOS
 *  never reaches this — digital plans there are App Store only (3.1.1). */
const ANDROID_PRICING_URL = 'https://appsketch.ai/pricing';

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
        <StoreUnavailable t={t} p={p} detail={data.storeDetail} />
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

/** "Build with AI": the App Store plans (Yearly first), compact cards and
 *  the 3.1.2 block (Restore, auto-renew text, Terms, Privacy). */
function PlansSection({ t, p }: { t: AppColors; p: PricingPalette }) {
  const [cycle, setCycle] = React.useState<PlanInterval>('yearly');
  const signedIn = useAuth.use.status() === 'signIn';
  const { saving, activePlanName } = usePricing(cycle);
  return (
    <View>
      <SectionHead
        t={t}
        first
        title="Build with AI"
        sub="Self-serve plans. Switch or cancel anytime."
      />
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
    </View>
  );
}

function SectionHead({
  t,
  title,
  sub,
  first,
}: {
  t: AppColors;
  title: string;
  sub: string;
  first?: boolean;
}) {
  return (
    <View style={[st.section, first && st.sectionFirst]}>
      <Text style={[st.sectionTitle, { color: t.text }]}>{title}</Text>
      <Text style={[st.sectionSub, { color: t.textSub }]}>{sub}</Text>
    </View>
  );
}

function Hero({ s }: { s: ServicesPalette }) {
  return (
    <View style={st.hero}>
      <View style={st.heroText}>
        <Text style={[st.title, { color: s.text }]}>Pricing</Text>
        <Text style={[st.sub, { color: s.sub }]} numberOfLines={1}>
          Launch with our team, or build it yourself with AI.
        </Text>
      </View>
      <CartButton s={s} />
    </View>
  );
}

/** Scroll offset, viewport height and the in-card bar's y — all UI-thread
 *  values, so the sticky summary never re-renders React while scrolling. */
function useStickyGeometry() {
  const scrollY = useSharedValue(0);
  const viewH = useSharedValue(0);
  const inlineY = useSharedValue(0);
  const cardY = React.useRef(0);
  const barY = React.useRef(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const sync = () => {
    inlineY.value = cardY.current + barY.current;
  };
  return {
    scrollY,
    viewH,
    inlineY,
    onScroll,
    onRoot: (e: LayoutChangeEvent) => {
      viewH.value = e.nativeEvent.layout.height;
    },
    onCard: (e: LayoutChangeEvent) => {
      cardY.current = e.nativeEvent.layout.y;
      sync();
    },
    onBar: (e: LayoutChangeEvent) => {
      // the slot's y inside the card's padding box
      barY.current = e.nativeEvent.layout.y;
      sync();
    },
  };
}

/** `/pricing?section=domain` scrolls to the domain card and focuses search. */
function useDomainJump(scroll: React.RefObject<Animated.ScrollView | null>) {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const input = React.useRef<TextInput>(null);
  const y = React.useRef(0);
  React.useEffect(() => {
    if (section !== 'domain') return;
    const id = setTimeout(() => {
      scroll.current?.scrollTo({
        y: Math.max(0, y.current - 60),
        animated: true,
      });
      input.current?.focus();
    }, 350);
    return () => clearTimeout(id);
  }, [section, scroll]);
  return {
    input,
    onLayout: (e: LayoutChangeEvent) => {
      y.current = e.nativeEvent.layout.y;
    },
  };
}

/** The Pricing tab: compact hero, the self-serve plans (App Store on iOS)
 *  with the user's current plan on top, then the "Launch with our team"
 *  planner (services, Razorpay via the cart), the domain search and custom
 *  solutions. */
export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const tabBarH = useTabBarHeight();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const p = pricingPalette(t);
  const s = servicesPalette(t);
  const catalogue = useCatalogue();
  const pl = usePlanner(catalogue.data);
  const geo = useStickyGeometry();
  const scroll = React.useRef<Animated.ScrollView>(null);
  const jump = useDomainJump(scroll);
  return (
    <View style={[st.root, { backgroundColor: t.bg }]} onLayout={geo.onRoot}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />
      <Animated.ScrollView
        ref={scroll}
        onScroll={geo.onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: tabBarH + (pl.unlocked ? 96 : 28),
        }}
      >
        <Hero s={s} />
        <PlansSection t={t} p={p} />
        <View style={[st.pad, st.teamGap]} onLayout={geo.onCard}>
          <PlannerCard
            s={s}
            pl={pl}
            query={catalogue}
            onBarLayout={geo.onBar}
          />
        </View>
        <View style={[st.pad, st.cards]} onLayout={jump.onLayout}>
          <DomainCard s={s} inputRef={jump.input} />
          <CustomCard s={s} whatsapp={catalogue.data?.whatsapp} />
        </View>
      </Animated.ScrollView>
      {/* Solid strip under the clock so scrolled content never sits there. */}
      <View
        style={[st.statusStrip, { height: insets.top, backgroundColor: t.bg }]}
      />
      <StickySummary
        s={s}
        pl={pl}
        scrollY={geo.scrollY}
        inlineY={geo.inlineY}
        viewH={geo.viewH}
        bottom={tabBarH}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
  },
  heroText: { flex: 1 },
  title: { fontFamily: F.display900, fontSize: 26, letterSpacing: -0.7 },
  sub: { fontFamily: F.sans400, fontSize: 13, marginTop: 1 },
  section: { paddingHorizontal: 18, paddingTop: 26, paddingBottom: 10 },
  sectionFirst: { paddingTop: 4 },
  teamGap: { paddingTop: 28 },
  sectionTitle: { fontFamily: F.display900, fontSize: 19, letterSpacing: -0.4 },
  sectionSub: { fontFamily: F.sans400, fontSize: 12.5, marginTop: 2 },
  pad: { paddingHorizontal: 12 },
  cards: { paddingTop: 26, gap: 12 },
  toggle: { paddingTop: 6, paddingBottom: 14 },
  list: { paddingHorizontal: 12, gap: 10 },
  error: {
    fontFamily: F.sans600,
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
});
