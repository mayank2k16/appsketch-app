import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSubscriptionPlans } from '@/api';
import type { SubscriptionPlan, SubscriptionPlanFeature, SubscriptionPricingOption } from '@/api';
import { GradientText } from '@/components/ui/GradientText';
import { Skeleton } from '@/containers/Marketplace/components/Skeleton';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { useAppTheme, type AppColors } from '@/lib/theme';

const SKELETON_CARD_COUNT = 3;

const GRADIENT_TITLE_COLORS = ['#C084FC', '#F9A8D4', '#60A5FA'];

type BillingCycle = 'monthly' | 'yearly';

type TransformedPlan = {
  tier: string;
  name: string;
  description: string;
  monthly: SubscriptionPricingOption | null;
  yearly: SubscriptionPricingOption | null;
  features: string[];
  buttonText: string;
  isPrimary: boolean;
};

function extractPricing(options: SubscriptionPricingOption[]) {
  let monthly: SubscriptionPricingOption | null = null;
  let yearly: SubscriptionPricingOption | null = null;
  for (const opt of options) {
    if (opt.interval === 'monthly') monthly = opt;
    else if (opt.interval === 'yearly') yearly = opt;
  }
  return { monthly, yearly };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatFeatures(planFeatures: SubscriptionPlanFeature[]): string[] {
  return (planFeatures || [])
    .filter((pf) => pf.enabled)
    .map((pf) => {
      const displayName = pf.feature.display_name;
      const limit = pf.integer_limit;
      if (limit !== null) {
        return displayName.toLowerCase().includes('data storage')
          ? `${displayName} (${limit} GB)`
          : `${displayName} (${limit})`;
      }
      return displayName;
    });
}

function planPrice(plan: Pick<TransformedPlan, 'monthly' | 'yearly'>): number {
  const option = plan.monthly ?? plan.yearly;
  return option ? Number(option.price) || 0 : 0;
}

function isPlanFree(plan: Pick<TransformedPlan, 'monthly' | 'yearly'>): boolean {
  return planPrice(plan) === 0;
}

function transformPlan(plan: SubscriptionPlan): TransformedPlan {
  const { monthly, yearly } = extractPricing(plan.pricing_options || []);
  const free = isPlanFree({ monthly, yearly });
  return {
    tier: plan.tier,
    name: plan.display_name || '',
    description: plan.description || '',
    monthly,
    yearly,
    features: formatFeatures(plan.plan_features || []),
    buttonText: free ? 'Start Free' : 'Get The Plan Now',
    isPrimary: !free,
  };
}

function sortPlans(plans: TransformedPlan[]): TransformedPlan[] {
  return [...plans].sort((a, b) => planPrice(a) - planPrice(b));
}

/** Index of the one plan to badge "Most Popular" — the upper-middle tier,
 * since the backend doesn't send a "recommended" flag. None for 0-1 plans. */
function popularPlanIndex(count: number): number {
  return count <= 1 ? -1 : Math.min(count - 1, Math.floor(count / 2));
}

export function PricingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');
  const { data, isLoading, isError } = useSubscriptionPlans();

  const plans = React.useMemo(() => sortPlans((data ?? []).map(transformPlan)), [data]);

  function handlePlanPress(plan: TransformedPlan) {
    toast.info('Checkout coming soon', `Payment for the ${plan.name} plan will be available shortly.`);
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>Pricing & Plans</Text>
        <View style={st.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── Hero — subtitle + title only, matches the web header block ── */}
        <View style={st.section}>
          <Text style={[st.subtitle, { color: t.accent }]}>Our Pricing Plans</Text>
          <GradientText style={st.heroTitle} colors={GRADIENT_TITLE_COLORS}>
            Pricing and Plans
          </GradientText>
        </View>

        {isLoading ? (
          <View style={st.plansWrap}>
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
              <PlanCardSkeleton key={i} t={t} />
            ))}
          </View>
        ) : isError ? (
          <View style={st.section}>
            <View style={[st.errorBox, { backgroundColor: '#E0392B14', borderColor: '#E0392B40' }]}>
              <Text style={st.errorText}>Failed to load pricing data.</Text>
            </View>
          </View>
        ) : (
          <>
            {/* ── Billing toggle ── */}
            <View style={st.toggleSection}>
              <BillingToggle t={t} value={billingCycle} onChange={setBillingCycle} />
            </View>

            {/* ── Plan cards ── */}
            <View style={st.plansWrap}>
              {plans.map((plan, i) => (
                <PlanCard
                  key={plan.tier}
                  plan={plan}
                  billingCycle={billingCycle}
                  t={t}
                  popular={i === popularPlanIndex(plans.length)}
                  onPress={() => handlePlanPress(plan)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Billing toggle — segmented pill, animated thumb, "Save" badge ─────────
function BillingToggle({
  t,
  value,
  onChange,
}: {
  t: AppColors;
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  const anim = React.useRef(new Animated.Value(value === 'yearly' ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value === 'yearly' ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 110] });

  return (
    <View style={st.toggleRow}>
      <View style={[st.toggleTrack, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
        <Animated.View
          style={[st.toggleThumb, { backgroundColor: t.accent, transform: [{ translateX: thumbX }] }]}
        />
        <TouchableOpacity style={st.toggleOption} activeOpacity={0.8} onPress={() => onChange('monthly')}>
          <Text style={[st.toggleOptionText, { color: value === 'monthly' ? '#FFFFFF' : t.textSub }]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.toggleOption} activeOpacity={0.8} onPress={() => onChange('yearly')}>
          <Text style={[st.toggleOptionText, { color: value === 'yearly' ? '#FFFFFF' : t.textSub }]}>
            Yearly
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[st.saveBadge, { backgroundColor: t.accent }]}>
        <Text style={st.saveBadgeText}>Save 16.66%</Text>
      </View>
    </View>
  );
}

// ─── Plan card ──────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  billingCycle,
  t,
  popular,
  onPress,
}: {
  plan: TransformedPlan;
  billingCycle: BillingCycle;
  t: AppColors;
  popular: boolean;
  onPress: () => void;
}) {
  const priceOption = billingCycle === 'monthly' ? plan.monthly : plan.yearly;
  const isFree = !priceOption || Number(priceOption.price) === 0;

  return (
    <View
      style={[st.card, { backgroundColor: t.agentTabBg, borderColor: popular ? t.accent : t.agentTabBorder }]}
    >
      {popular && (
        <View style={[st.popularBadge, { backgroundColor: t.accent }]}>
          <Text style={st.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      <Text style={[st.planName, { color: t.text }]}>{plan.name}</Text>
      {!!plan.description && <Text style={[st.planDesc, { color: t.textSub }]}>{plan.description}</Text>}

      <View style={[st.priceBox, { backgroundColor: t.card, borderColor: t.border }]}>
        {isFree ? (
          <Text style={[st.priceFree, { color: t.text }]}>Free</Text>
        ) : (
          <View style={st.priceRow}>
            <Text style={[st.dollar, { color: t.accent }]}>{priceOption?.currency?.symbol ?? '$'}</Text>
            <Text style={[st.price, { color: t.text }]}>{formatCurrency(Number(priceOption?.price))}</Text>
            <Text style={[st.perPeriod, { color: t.textSub }]}>
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </Text>
          </View>
        )}
      </View>

      <View style={st.featureList}>
        {plan.features.map((feat) => (
          <View key={feat} style={st.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={t.accent} />
            <Text style={[st.featureText, { color: t.textSub }]}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Free tier has no CTA button, same as the web reference */}
      {!isPlanFree(plan) && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          style={[
            st.ctaButton,
            plan.isPrimary
              ? { backgroundColor: t.accent, borderColor: t.accent }
              : { backgroundColor: 'transparent', borderColor: t.accent },
          ]}
        >
          <Text style={[st.ctaButtonText, { color: plan.isPrimary ? '#FFFFFF' : t.accent }]}>
            {plan.buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Plan card skeleton — mirrors PlanCard's layout so the grid doesn't
// reflow once real cards swap in. ──
function PlanCardSkeleton({ t }: { t: AppColors }) {
  return (
    <View style={[st.card, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
      <Skeleton t={t} height={19} width="45%" borderRadius={4} style={{ marginBottom: 8 }} />
      <Skeleton t={t} height={13} width="80%" borderRadius={4} style={{ marginBottom: 16 }} />

      <View style={[st.priceBox, { backgroundColor: t.card, borderColor: t.border }]}>
        <Skeleton t={t} height={26} width={90} borderRadius={4} />
      </View>

      <View style={st.featureList}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} t={t} height={13} width={`${80 - i * 8}%`} borderRadius={4} />
        ))}
      </View>

      <Skeleton t={t} height={46} borderRadius={12} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: F.sans700, fontSize: 15 },

  section: { paddingHorizontal: 20, paddingTop: 24 },

  subtitle: {
    fontFamily: F.sans600,
    fontSize: 12.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: { fontFamily: F.display900, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },

  errorBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  errorText: { fontFamily: F.sans600, fontSize: 13.5, color: '#E0392B', textAlign: 'center' },

  toggleSection: { paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  toggleRow: { flexDirection: 'column-reverse', alignItems: 'center', gap: 10 },
  toggleTrack: {
    flexDirection: 'row',
    width: 220,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 0,
    width: 105,
    height: 34,
    borderRadius: 17,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionText: { fontFamily: F.sans600, fontSize: 13 },
  saveBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  saveBadgeText: { fontFamily: F.sans700, fontSize: 10.5, color: '#FFFFFF', letterSpacing: 0.3 },

  plansWrap: { paddingHorizontal: 20, paddingTop: 28, gap: 16 },

  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
  },
  popularBadgeText: { fontFamily: F.sans700, fontSize: 10.5, color: '#FFFFFF', letterSpacing: 0.3 },

  planName: { fontFamily: F.sans700, fontSize: 19, marginBottom: 4 },
  planDesc: { fontFamily: F.sans400, fontSize: 13, lineHeight: 19, marginBottom: 16 },

  priceBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  dollar: { fontFamily: F.sans700, fontSize: 16, marginRight: 2 },
  price: { fontFamily: F.display900, fontSize: 25 },
  perPeriod: { fontFamily: F.sans500, fontSize: 13, marginLeft: 3 },
  priceFree: { fontFamily: F.display900, fontSize: 24 },

  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontFamily: F.sans400, fontSize: 13.5, lineHeight: 19 },

  ctaButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaButtonText: { fontFamily: F.sans700, fontSize: 14 },
});

export default PricingScreen;
