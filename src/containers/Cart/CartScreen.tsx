import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  confirmSubscriptionPaymentFailure,
  confirmSubscriptionPaymentSuccess,
  initiateSubscriptionPayment,
  sortPlans,
  transformPlan,
  useSubscriptionPlans,
  type TransformedPlan,
} from '@/api';
import { purchaseDomain, useSearchDomains, type DomainContact, type DomainSearchResult } from '@/api/domains';
import { updateSubscription, useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { formatINR } from '@/lib/domain-pricing';
import type { CheckoutV2Response } from '@/lib/payments/payment-gateway';
import { openPaymentGateway } from '@/lib/payments/payment-gateway';
import { useStudio } from '@/lib/store/studio-store';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { useAppTheme, type AppColors } from '@/lib/theme';

import { DomainContactForm } from './components/DomainContactForm';
import { DomainSearchSection } from './components/DomainSearchSection';

const EMPTY_CONTACT: DomainContact = {
  FirstName: '',
  LastName: '',
  Address1: '',
  City: '',
  StateProvince: '',
  PostalCode: '',
  Country: '',
  Phone: '',
  EmailAddress: '',
};

function readUserField(user: Record<string, unknown> | null, key: 'name' | 'email' | 'phone'): string {
  if (!user) return '';
  if (key === 'phone') return String(user.phone_number ?? user.phone ?? '');
  return String(user[key] ?? '');
}

export function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { tier, billingCycle: billingCycleParam } = useLocalSearchParams<{ tier?: string; billingCycle?: string }>();
  const billingCycle = billingCycleParam === 'yearly' ? 'yearly' : 'monthly';

  const user = useAuth.use.user();
  const attachedTenant = useStudio.use.attachedTenant();

  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans();
  const plans = React.useMemo(() => sortPlans((plansData ?? []).map(transformPlan)), [plansData]);
  // No `tier` param (e.g. "Add domain" from Settings) → default to the
  // cheapest plan, same fallback Cart.jsx uses when it has no router-state plan.
  const plan: TransformedPlan | undefined = tier ? plans.find((p) => p.tier === tier) : plans[0];

  const [domainQuery, setDomainQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(domainQuery, 400);
  const { data: domainResults, isLoading: searchingDomains } = useSearchDomains(debouncedQuery);

  const [selectedDomain, setSelectedDomain] = React.useState<DomainSearchResult | null>(null);
  const [selectedYears, setSelectedYears] = React.useState(1);
  const [selectedYearPrice, setSelectedYearPrice] = React.useState(0);
  const [addFreeWhoisguard, setAddFreeWhoisguard] = React.useState(true);
  const [idnCode, setIdnCode] = React.useState('');

  const [showContactForm, setShowContactForm] = React.useState(false);
  const [contact, setContact] = React.useState<DomainContact>(EMPTY_CONTACT);
  const [checkingOut, setCheckingOut] = React.useState(false);

  function handleSelectDomain(result: DomainSearchResult, years: number, price: number) {
    setSelectedDomain(result);
    setSelectedYears(years);
    setSelectedYearPrice(price);
  }

  function removeDomain() {
    setSelectedDomain(null);
    setShowContactForm(false);
  }

  const priceOption = plan ? (billingCycle === 'monthly' ? plan.monthly : plan.yearly) : null;
  const planAmount = priceOption ? Number(priceOption.price) || 0 : 0;
  const domainAmount = selectedDomain ? selectedYearPrice : 0;
  const subtotal = planAmount + domainAmount;

  async function checkout() {
    if (!plan || !priceOption?.id) {
      toast.error('Unavailable', 'This plan is not available. Please go back and pick another.');
      return;
    }
    if (checkingOut) return;

    setCheckingOut(true);
    let userSubscriptionId: number | undefined;
    try {
      const { payment_detail } = await initiateSubscriptionPayment({
        subscription_id: priceOption.id,
        ...(selectedDomain
          ? {
            domain: selectedDomain.domain,
            domain_price: domainAmount,
            domain_years: selectedYears,
            additional_amount_in_inr: domainAmount,
            include_domain_in_amount: true,
          }
          : {}),
      });
      userSubscriptionId = payment_detail.user_subscription_id;

      // Same client-side combine as the web reference — the amount opened in
      // Razorpay is the order amount plus the domain price, not trusted to
      // already be summed server-side.
      const totalMinor = payment_detail.razorpay_order_id.amount + Math.round(domainAmount * 100);
      const checkoutResponse: CheckoutV2Response = {
        status: 200,
        order_id: userSubscriptionId,
        order_amount: totalMinor / 100,
        customer_name: readUserField(user, 'name'),
        checkout: {
          provider: 'Razorpay',
          order_id: payment_detail.razorpay_order_id.id,
          key_id: payment_detail.RAZORPAY_API_KEY,
          amount_minor: totalMinor,
          currency: payment_detail.razorpay_order_id.currency,
        },
        mode_of_payment: 'online',
        operational: true,
        delivery_charge: 0,
        default_delivery_charge: 0,
        inventory_status: {},
      };

      const result = await openPaymentGateway(checkoutResponse, {
        primaryColor: t.accent,
        prefillPhone: readUserField(user, 'phone'),
        prefillEmail: readUserField(user, 'email'),
      });

      if (result.success) {
        await confirmSubscriptionPaymentSuccess({
          razorpay_order_id: result.razorpay_order_id ?? '',
          razorpay_payment_id: result.razorpay_payment_id ?? '',
          razorpay_signature: result.razorpay_signature ?? '',
          user_subscription_id: userSubscriptionId,
          ...(selectedDomain
            ? {
              domain: selectedDomain.domain,
              years: selectedYears,
              auto_renew: false,
              add_free_whoisguard: addFreeWhoisguard,
              idn_code: idnCode || null,
              contacts: { registrant: contact, tech: contact, admin: contact, auxbilling: contact },
            }
            : {}),
        });

        // Mirrors Cart.jsx's dual-call — domain registration is confirmed via
        // `payment/success/` above AND requested again here explicitly.
        // Non-fatal if it errors: the plan purchase already succeeded.
        if (selectedDomain?.available) {
          try {
            await purchaseDomain({
              domain: selectedDomain.domain,
              years: selectedYears,
              auto_renew: false,
              add_free_whoisguard: addFreeWhoisguard,
              // Web defaults this to `1` when no tenant is in context; we
              // prefer the actually-attached store (Studio "View CMS") when
              // known, same fallback otherwise.
              tenant_id: attachedTenant?.id ?? 1,
              contacts: { registrant: contact },
            });
          } catch (err) {
            console.error('Domain purchase confirmation failed:', err);
          }
        }

        updateSubscription({ active: true, plan: { tier: plan.tier, display_name: plan.name } });
        toast.success(
          "You're all set!",
          selectedDomain ? `Subscribed to ${plan.name} and registered ${selectedDomain.domain}.` : `You're now on the ${plan.name} plan.`
        );
        router.replace('/studio' as never);
      } else if (result.reason !== 'cancelled') {
        await confirmSubscriptionPaymentFailure({
          error: result.message ?? result.reason,
          user_subscription_id: userSubscriptionId,
        });
        toast.error('Payment failed', result.message ?? 'Please try again.');
      }
    } catch {
      if (userSubscriptionId) {
        await confirmSubscriptionPaymentFailure({
          error: 'checkout_error',
          user_subscription_id: userSubscriptionId,
        }).catch(() => { });
      }
      toast.error('Something went wrong', 'Could not start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  function handleContinue() {
    if (selectedDomain?.available && !showContactForm) {
      setShowContactForm(true);
      return;
    }
    void checkout();
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>Cart</Text>
        <View style={st.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {plansLoading || !plan ? (
            <Text style={{ color: t.textSub, fontFamily: F.sans500 }}>
              {plansLoading ? 'Loading…' : 'No plan selected.'}
            </Text>
          ) : (
            <>
              {/* ── Plan summary ── */}
              <View style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={st.rowBetween}>
                  <Text style={[st.planName, { color: t.text }]}>{plan.name}</Text>
                  <Text style={[st.amount, { color: t.text }]}>{formatINR(planAmount)}</Text>
                </View>
                <Text style={[st.muted, { color: t.textSub }]}>
                  Billed {billingCycle === 'monthly' ? 'monthly' : 'yearly'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/pricing' as never)} style={{ marginTop: 10 }}>
                  <Text style={[st.linkText, { color: t.accent }]}>Change plan</Text>
                </TouchableOpacity>
              </View>

              {!showContactForm && (
                <DomainSearchSection
                  query={domainQuery}
                  onChangeQuery={setDomainQuery}
                  results={domainResults}
                  isLoading={searchingDomains}
                  selectedDomain={selectedDomain}
                  selectedYears={selectedYears}
                  onSelect={handleSelectDomain}
                  t={t}
                />
              )}

              {showContactForm && selectedDomain && (
                <View style={{ marginBottom: 20 }}>
                  <DomainContactForm
                    domain={selectedDomain.domain}
                    years={selectedYears}
                    contact={contact}
                    onChangeContact={setContact}
                    onBack={() => setShowContactForm(false)}
                    onSubmit={checkout}
                    submitting={checkingOut}
                    t={t}
                  />
                </View>
              )}

              {!showContactForm && (
                <>
                  {/* ── Order summary ── */}
                  <View style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[st.sectionHeading, { color: t.text }]}>Order summary</Text>

                    <View style={st.rowBetween}>
                      <Text style={[st.muted, { color: t.textSub }]}>{plan.name}</Text>
                      <Text style={[st.muted, { color: t.text }]}>{formatINR(planAmount)}</Text>
                    </View>

                    {selectedDomain && (
                      <View style={[st.rowBetween, { marginTop: 8 }]}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[st.muted, { color: t.textSub }]} numberOfLines={1}>
                            Domain: {selectedDomain.domain} ({selectedYears}y)
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[st.muted, { color: t.text }]}>{formatINR(domainAmount)}</Text>
                          <TouchableOpacity onPress={removeDomain}>
                            <Text style={[st.linkText, { color: '#E0392B', fontSize: 12 }]}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View style={[st.divider, { backgroundColor: t.border }]} />

                    <View style={st.rowBetween}>
                      <Text style={[st.sectionHeading, { color: t.text }]}>Subtotal</Text>
                      <Text style={[st.sectionHeading, { color: t.text }]}>{formatINR(subtotal)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleContinue}
                    activeOpacity={0.85}
                    disabled={checkingOut}
                    style={[st.continueBtn, { backgroundColor: t.accent }, checkingOut && { opacity: 0.6 }]}
                  >
                    <Text style={st.continueBtnText}>{checkingOut ? 'Processing…' : 'Continue'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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

  card: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontFamily: F.sans700, fontSize: 16 },
  amount: { fontFamily: F.sans700, fontSize: 16 },
  muted: { fontFamily: F.sans500, fontSize: 13 },
  linkText: { fontFamily: F.sans700, fontSize: 13 },

  sectionHeading: { fontFamily: F.sans700, fontSize: 15 },
  divider: { height: 1, marginVertical: 12 },

  continueBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  continueBtnText: { fontFamily: F.sans700, fontSize: 15, color: '#FFFFFF' },
});
