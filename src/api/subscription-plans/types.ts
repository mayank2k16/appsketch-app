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
