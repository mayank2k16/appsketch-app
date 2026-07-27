/**
 * Subscription plans — ported from the web reference (Vite
 * `Containers/HomeV3/Pricing` + `Api/tenantAPI.fetchSubscriptionPlans`,
 * GET `/account/subscription-plans/`). Response/plan shape matches what
 * that screen's `transformPlan`/`extractPricing`/`formatFeatures` expect.
 */
import type { DomainContacts } from '@/api/domains/types';
export type SubscriptionBillingInterval = 'monthly' | 'yearly';

export type SubscriptionPlanCurrency = {
  symbol: string;
  code?: string;
};

export type SubscriptionPricingOption = {
  id: number;
  interval: SubscriptionBillingInterval | string;
  price: number | string;
  display_price: string;
  currency?: SubscriptionPlanCurrency;
};

export type SubscriptionPlanFeature = {
  enabled: boolean;
  integer_limit: number | null;
  feature: {
    display_name: string;
  };
};

export type SubscriptionPlanTier = 'free' | 'pro' | 'enterprise' | string;

export type SubscriptionPlan = {
  id: number;
  tier: SubscriptionPlanTier;
  display_name: string;
  description?: string;
  pricing_options: SubscriptionPricingOption[];
  plan_features: SubscriptionPlanFeature[];
};

export type SubscriptionPlansResponse = {
  results: SubscriptionPlan[];
};

// ── Checkout — mirrors the web reference (Vite `Api/tenantAPI`
// makeInitiatePayment/confirmPaymentSuccess/confirmPaymentFailure, hitting
// the same `account/payment/*` endpoints). `subscription_id` here is the
// *pricing option* id (monthly/yearly variant), not the plan id — matches
// what Vite's Cart.jsx sends. The optional `domain*` fields let a domain
// ride along in the same order (Vite's `Cart.jsx` always bills plan+domain
// together, never separately) — see `ConfirmSubscriptionPaymentSuccessPayload`
// for the matching fields on the confirm step. ──

export type InitiateSubscriptionPaymentPayload = {
  subscription_id: number;
  domain?: string | null;
  domain_price?: number;
  domain_years?: number;
  additional_amount_in_inr?: number;
  include_domain_in_amount?: boolean;
};

export type InitiateSubscriptionPaymentResponse = {
  payment_detail: {
    razorpay_order_id: {
      id: string;
      amount: number;
      currency: string;
    };
    RAZORPAY_API_KEY: string;
    user_subscription_id: number;
  };
};

export type ConfirmSubscriptionPaymentSuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  user_subscription_id: number;
  // Present only when a domain rode along in the same order — mirrors
  // Vite's `Cart.jsx` `confirmPaymentSuccess` call exactly.
  domain?: string | null;
  years?: number;
  auto_renew?: boolean;
  add_free_whoisguard?: boolean;
  idn_code?: string | null;
  contacts?: DomainContacts;
};

export type ConfirmSubscriptionPaymentFailurePayload = {
  error: string;
  user_subscription_id: number;
};
