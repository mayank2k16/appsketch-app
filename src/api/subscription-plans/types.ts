/**
 * Subscription plans — ported from the web reference (Vite
 * `Containers/HomeV3/Pricing` + `Api/tenantAPI.fetchSubscriptionPlans`,
 * GET `/account/subscription-plans/`). Response/plan shape matches what
 * that screen's `transformPlan`/`extractPricing`/`formatFeatures` expect.
 */
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
// what Vite's Cart.jsx sends. ──

export type InitiateSubscriptionPaymentPayload = {
  subscription_id: number;
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
};

export type ConfirmSubscriptionPaymentFailurePayload = {
  error: string;
  user_subscription_id: number;
};
