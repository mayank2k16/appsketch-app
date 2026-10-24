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
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscountOffers, useMoney } from '@/api/app-cart';
import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { type ServicesPalette, servicesPalette } from '@/components/services';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { buyPlan, isIos, type PlanInterval, useIapStore } from '@/lib/iap';
import { type AppColors, useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { BillingToggle } from './billing-toggle';
import { CartButton } from './cart-button';
import { DomainPane } from './domain-pane';
import { FolderCard, type FolderTab } from './folder-card';
import { PlanCard } from './plan-card';
import { PlanSkeleton } from './plan-skeleton';
import { pickOffer } from './planner/offer-strip';
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
  domainInput,
}: {
  t: AppColors;
  p: PricingPalette;
  cycle: PlanInterval;
  domainInput: React.RefObject<TextInput | null>;
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
      <TabbedPlans
        t={t}
        p={p}
        views={data.views}
        busySku={busySku}
        onPress={onPress}
        domainInput={domainInput}
      />
    </View>
  );
}

const DOMAIN_TAB = 'domain';

/** Tab icons: Basic → leaf, Growth → trending up, 100X → rocket. */
function tierIcon(tier: string) {
  const t = tier.toLowerCase();
  if (t.includes('100')) return 'rocket' as const;
  if (t.includes('growth')) return 'trending-up' as const;
  return 'leaf' as const;
}

/** "50% OFF" / "₹500 OFF" ("$6 OFF" abroad) for the Domain tab, from the
 *  best live offer. */
function useDomainOff(): string | null {
  const offers = useDiscountOffers();
  const { money } = useMoney();
  const o = pickOffer(offers.data ?? [], ['domain', 'order']);
  if (!o) return null;
  return o.type === 'percent' ? `${o.value}% OFF` : `${money(o.value)} OFF`;
}

/** Basic / Growth / 100X / Domain as a pill tab bar over one card. Opens on
 *  the Domain tab for `/pricing?section=domain`, else the user's plan, else
 *  the popular one. */
function TabbedPlans({
  t,
  p,
  views,
  busySku,
  onPress,
  domainInput,
}: {
  t: AppColors;
  p: PricingPalette;
  views: PlanView[];
  busySku: string | null;
  onPress: (plan: PlanView) => void;
  domainInput: React.RefObject<TextInput | null>;
}) {
  const s = servicesPalette(t);
  const { section } = useLocalSearchParams<{ section?: string }>();
  const domainOff = useDomainOff();
  const start =
    (section === DOMAIN_TAB ? DOMAIN_TAB : null) ??
    views.find((v) => v.current)?.tier ??
    views.find((v) => v.popular)?.tier ??
    views[0]?.tier ??
    DOMAIN_TAB;
  // null = not picked yet: follow `start` (plans, the user's plan and the
  // deep link can arrive after the first render).
  const [key, setKey] = React.useState<string | null>(null);
  const value = key ?? start;
  const tabs: FolderTab[] = [
    ...views.map((v) => ({
      key: v.tier,
      name: v.name,
      icon: tierIcon(v.tier),
      off: v.savePct ? `${v.savePct}% OFF` : null,
      dot: v.current,
    })),
    { key: DOMAIN_TAB, name: 'Domain', icon: 'globe' as const, off: domainOff },
  ];
  const plan = views.find((v) => v.tier === value);
  return (
    <FolderCard t={t} p={p} tabs={tabs} value={value} onPick={setKey}>
      {plan ? (
        <PlanCard
          plan={plan}
          t={t}
          p={p}
          ctaLabel={isIos() ? 'Subscribe' : 'Get the plan'}
          busy={!!plan.sku && busySku === plan.sku}
          locked={!!busySku}
          onSubscribe={() => onPress(plan)}
        />
      ) : (
        <DomainPane s={s} inputRef={domainInput} />
      )}
    </FolderCard>
  );
}

/** "Build with AI": the App Store plans (Yearly first), compact cards and
 *  the 3.1.2 block (Restore, auto-renew text, Terms, Privacy). */
function PlansSection({
  t,
  p,
  domainInput,
}: {
  t: AppColors;
  p: PricingPalette;
  domainInput: React.RefObject<TextInput | null>;
}) {
  const [cycle, setCycle] = React.useState<PlanInterval>('yearly');
  const signedIn = useAuth.use.status() === 'signIn';
  const { saving, activePlanName } = usePricing(cycle);
  return (
    <View>
      <SectionHead
        t={t}
        first
        center
        title="Build with AI"
        sub="Self-serve plans. Switch or cancel anytime."
      />
      <CustomPricing t={t} />
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
      <PlanList t={t} p={p} cycle={cycle} domainInput={domainInput} />
    </View>
  );
}

function SectionHead({
  t,
  title,
  sub,
  first,
  center,
}: {
  t: AppColors;
  title: string;
  sub: string;
  first?: boolean;
  center?: boolean;
}) {
  const align = center ? st.center : null;
  return (
    <View style={[st.section, first && st.sectionFirst]}>
      <Text style={[st.sectionTitle, align, { color: t.text }]}>{title}</Text>
      <Text style={[st.sectionSub, align, { color: t.textSub }]}>{sub}</Text>
    </View>
  );
}

const WEBSITE_PRICING = 'https://appsketch.ai/pricing';

/** Under the heading: custom plans go to Contact us (in the app) or the
 *  website's pricing page. */
function CustomPricing({ t }: { t: AppColors }) {
  const router = useRouter();
  return (
    <View style={st.custom}>
      <Text style={[st.customText, { color: t.textSub }]}>
        Need a custom plan?{' '}
        <Text
          onPress={() => router.push('/contact')}
          accessibilityRole="link"
          style={[st.customLink, { color: '#EB4709' }]}
        >
          Contact us
        </Text>
        {' or '}
        <Text
          onPress={() => void Linking.openURL(WEBSITE_PRICING)}
          accessibilityRole="link"
          style={[st.customLink, { color: '#EB4709' }]}
        >
          visit our website
        </Text>
      </Text>
    </View>
  );
}

function Hero({ s }: { s: ServicesPalette }) {
  return (
    <View style={st.hero}>
      <View style={st.heroText}>
        <Text style={[st.title, { color: s.text }]}>Pricing</Text>
        <Text style={[st.sub, { color: s.sub }]} numberOfLines={1}>
          Build your app with AI. Plans and domains.
        </Text>
      </View>
      <CartButton s={s} />
    </View>
  );
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

/** The Pricing tab: compact hero, then one folder card with the self-serve
 *  plans (App Store on iOS) and a Domain tab, then the 3.1.2 footer. The
 *  assisted (team-built) services are not sold in the app. */
export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const tabBarH = useTabBarHeight();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const p = pricingPalette(t);
  const s = servicesPalette(t);
  const scroll = React.useRef<Animated.ScrollView>(null);
  const jump = useDomainJump(scroll);
  const signedIn = useAuth.use.status() === 'signIn';
  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />
      <Animated.ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: tabBarH + 28,
        }}
      >
        <Hero s={s} />
        <View onLayout={jump.onLayout}>
          <PlansSection t={t} p={p} domainInput={jump.input} />
        </View>
        {/* Restore Purchases, auto-renew terms, Terms of Use, Privacy. */}
        {isIos() ? <StoreFooter t={t} p={p} signedIn={signedIn} /> : null}
      </Animated.ScrollView>
      {/* Solid strip under the clock so scrolled content never sits there. */}
      <View
        style={[st.statusStrip, { height: insets.top, backgroundColor: t.bg }]}
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
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  heroText: { flex: 1 },
  title: { fontFamily: F.display900, fontSize: 26, letterSpacing: -0.7 },
  sub: { fontFamily: F.sans400, fontSize: 13, marginTop: 1 },
  section: { paddingHorizontal: 14, paddingTop: 26, paddingBottom: 10 },
  sectionFirst: { paddingTop: 4 },
  sectionTitle: { fontFamily: F.display900, fontSize: 19, letterSpacing: -0.4 },
  sectionSub: { fontFamily: F.sans400, fontSize: 12.5, marginTop: 2 },
  center: { textAlign: 'center' },
  custom: { paddingHorizontal: 14, paddingBottom: 10 },
  customText: {
    fontFamily: F.sans500,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  customLink: { fontFamily: F.sans700, textDecorationLine: 'underline' },
  pad: { paddingHorizontal: 8 },
  cards: { paddingTop: 26, gap: 12 },
  toggle: { paddingTop: 6, paddingBottom: 14 },
  list: { paddingHorizontal: 8, gap: 12 },
  error: {
    fontFamily: F.sans600,
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
});
