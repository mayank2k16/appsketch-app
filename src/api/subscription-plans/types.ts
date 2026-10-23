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
    code?: string;
    display_name: string;
    description?: string;
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
  /** Build credits granted per month; 0 = unlimited. */
  monthly_token_grant?: number | null;
  /** Coder model ids this plan unlocks. */
  coder_models?: string[] | null;
};

export type SubscriptionPlansResponse = {
  results: SubscriptionPlan[];
};
